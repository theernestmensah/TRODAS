import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { cleanText, requireAccess, requireTeam } from "./access";

/**
 * Lists resources. Team sees all resources; clients only see resources for their company.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAccess(ctx);
    if (viewer.role === "team") {
      return await ctx.db.query("resources").order("desc").collect();
    }
    return await ctx.db
      .query("resources")
      .withIndex("by_client", (q) => q.eq("client", viewer.client))
      .order("desc")
      .collect();
  },
});

/**
 * Add a new resource / document to a project (Team only).
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.string(),
    client: v.string(),
    projectLegacyId: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const creator = await requireTeam(ctx);
    const client = cleanText(args.client, "client", 60);
    const name = cleanText(args.name, "resource name", 80);

    const id = await ctx.db.insert("resources", {
      name,
      description: cleanText(args.description, "description", 300),
      type: cleanText(args.type, "type", 40),
      client,
      projectLegacyId: args.projectLegacyId,
      body: args.body,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activity", {
      actor: creator.name,
      action: "shared a project resource.",
      context: `${name} · ${client}`,
      client,
      createdAt: Date.now(),
    });

    return id;
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
