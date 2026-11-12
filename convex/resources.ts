import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { cleanText, projectAppId, requireAccess, requireTeam, requireVisibleProject } from "./access";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

/**
 * Lists resources, newest first. Staff see all of them; clients only their company's.
 * Uploaded files come with `url`, a link to the file in Convex storage.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAccess(ctx);
    const rows: Doc<"resources">[] = viewer.role !== "client"
      ? await ctx.db.query("resources").order("desc").collect()
      : await ctx.db
          .query("resources")
          .withIndex("by_client", (q) => q.eq("client", viewer.client))
          .order("desc")
          .collect();
    return await Promise.all(
      rows.map(async (r) => ({ ...r, url: r.fileId ? await ctx.storage.getUrl(r.fileId) : null })),
    );
  },
});

/** A one-time link the portal uploads a file to, before calling create. Staff only. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireTeam(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Share a document on a project: either an uploaded file (fileId, from generateUploadUrl)
 * or written text (body). The project decides which client sees it. `project` is the id
 * the portal uses (see projectAppId). Staff only.
 */
export const create = mutation({
  args: {
    project: v.string(),
    name: v.string(),
    description: v.string(),
    type: v.string(),
    body: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const creator = await requireTeam(ctx);
    const project = await requireVisibleProject(ctx, creator, args.project);
    const name = cleanText(args.name, "resource name", 80);

    let content: { body: string } | { fileId: Doc<"resources">["fileId"]; fileName: string; fileType?: string; fileSize: number };
    if (args.fileId) {
      const file = await ctx.db.system.get(args.fileId);
      if (!file) throw new ConvexError("The uploaded file wasn’t found. Upload it again.");
      if (file.size > MAX_FILE_BYTES) {
        await ctx.storage.delete(args.fileId);
        throw new ConvexError("Files can be up to 25 MB.");
      }
      content = {
        fileId: args.fileId,
        fileName: cleanText(args.fileName ?? name, "file name", 200),
        fileType: file.contentType ?? undefined,
        fileSize: file.size,
      };
    } else {
      content = { body: cleanText(args.body ?? "", "document text", 100_000) };
    }

    const id = await ctx.db.insert("resources", {
      name,
      description: cleanText(args.description, "description", 300, false),
      type: cleanText(args.type, "type", 40),
      client: project.client,
      projectLegacyId: projectAppId(project),
      ...content,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activity", {
      actor: creator.name,
      action: "shared a project resource.",
      context: `${name} · ${project.name}`,
      client: project.client,
      createdAt: Date.now(),
    });

    return id;
  },
});

/** Remove a shared document, and its file if it has one. Staff only. */
export const remove = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, { id }) => {
    const user = await requireTeam(ctx);
    const resource = await ctx.db.get("resources", id);
    if (!resource) return;
    if (resource.fileId) await ctx.storage.delete(resource.fileId);
    await ctx.db.delete("resources", id);
    await ctx.db.insert("activity", {
      actor: user.name,
      action: "removed a project resource.",
      context: resource.name,
      client: resource.client,
      createdAt: Date.now(),
    });
  },
});

/**
 * One-time import of legacy documents into Convex.
 */
export const importLegacy = internalMutation({
  args: {
    documents: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        type: v.string(),
        project: v.string(),
        client: v.string(),
        body: v.string(),
      }),
    ),
  },
  handler: async (ctx, { documents }) => {
    let count = 0;
    for (const doc of documents) {
      const existing = await ctx.db
        .query("resources")
        .withIndex("by_project_legacy", (q) => q.eq("projectLegacyId", doc.project))
        .filter((q) => q.eq(q.field("name"), doc.name))
        .first();

      if (!existing) {
        await ctx.db.insert("resources", {
          name: doc.name,
          description: doc.description,
          type: doc.type,
          projectLegacyId: doc.project,
          client: doc.client,
          body: doc.body,
          createdAt: Date.now() - count * 60000,
        });
        count++;
      }
    }
    return count;
  },
});
