import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireAccess } from "./access";

/**
 * Lists recent activity items. Team sees everything; clients only see their own company's activity.
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit = 30 }) => {
    const viewer = await requireAccess(ctx);
    limit = Math.min(Math.max(Math.floor(limit), 1), 100);
    if (viewer.role === "team") {
      return await ctx.db.query("activity").order("desc").take(limit);
    }
    return await ctx.db
      .query("activity")
      .withIndex("by_client", (q) => q.eq("client", viewer.client))
      .order("desc")
      .take(limit);
  },
});

// There is no public "log activity" mutation: entries are written by the server inside
// the mutations that make the change, so clients stay read-only and nothing is logged twice.

/**
 * One-time import of initial activity entries into Convex.
 */
export const importLegacy = internalMutation({
  args: {
    items: v.array(
      v.object({
        actor: v.string(),
        action: v.string(),
        context: v.string(),
        client: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { items }) => {
    const existing = await ctx.db.query("activity").first();
    if (existing) return 0;

    let timestamp = Date.now();
    let count = 0;
    for (const item of items) {
      await ctx.db.insert("activity", {
        actor: item.actor,
        action: item.action,
        context: item.context,
        client: item.client,
        createdAt: timestamp - count * 1000 * 60 * 60,
      });
      count++;
    }
    return count;
  },
});
