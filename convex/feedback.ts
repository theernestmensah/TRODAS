import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { feedbackStatus } from "./schema";
import { cleanText, requireAccess, requireTeam } from "./access";

/**
 * Lists feedback. Team members see all feedback; clients only see feedback for their company.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAccess(ctx);
    if (viewer.role === "team") {
      return await ctx.db.query("feedback").order("desc").collect();
    }
    return await ctx.db
      .query("feedback")
      .withIndex("by_client", (q) => q.eq("client", viewer.client))
      .order("desc")
      .collect();
  },
});

/**
 * Mark a feedback item as reviewed (Team only).
 */
export const review = mutation({
  args: {
    id: v.id("feedback"),
  },
  handler: async (ctx, { id }) => {
    const user = await requireTeam(ctx);
    const item = await ctx.db.get("feedback", id);
    if (!item) throw new ConvexError("Feedback not found.");
    if (item.status === "Reviewed") return;

    await ctx.db.patch("feedback", id, { status: "Reviewed" });

    await ctx.db.insert("activity", {
      actor: user.name,
      action: "marked client feedback as reviewed.",
      context: item.author,
      client: item.client,
      createdAt: Date.now(),
    });
  },
});

/**
 * Submit client feedback.
 */
export const create = mutation({
  args: {
    author: v.optional(v.string()),
    client: v.optional(v.string()),
    projectLegacyId: v.optional(v.string()),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await requireAccess(ctx);
    const client = viewer.role === "client" ? viewer.client : cleanText(args.client ?? "", "client", 60);
    const author = cleanText(args.author || viewer.name, "author", 60);
    const text = cleanText(args.text, "feedback message", 1000);
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const id = await ctx.db.insert("feedback", {
      author,
      client,
      projectLegacyId: args.projectLegacyId,
      text,
      date: dateStr,
      status: "Needs review",
      createdAt: Date.now(),
    });

    await ctx.db.insert("activity", {
      actor: author,
      action: "submitted new feedback.",
      context: `${client} · ${dateStr}`,
      client,
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * One-time import of legacy feedback into Convex.
 */
export const importLegacy = internalMutation({
  args: {
    feedback: v.array(
      v.object({
        id: v.string(),
        author: v.string(),
        client: v.string(),
        project: v.string(),
        text: v.string(),
        date: v.string(),
        status: feedbackStatus,
      }),
    ),
  },
  handler: async (ctx, { feedback }) => {
    let imported = 0;
    for (const item of feedback) {
      const existing = await ctx.db
        .query("feedback")
        .withIndex("by_project_legacy", (q) => q.eq("projectLegacyId", item.project))
        .filter((q) => q.eq(q.field("text"), item.text))
        .first();

      if (!existing) {
        await ctx.db.insert("feedback", {
          legacyId: item.id,
          author: item.author,
          client: item.client,
          projectLegacyId: item.project,
          text: item.text,
          date: item.date,
          status: item.status,
          createdAt: Date.now() - imported * 60000,
        });
        imported++;
      }
    }
    return imported;
  },
});
