import { query } from "./_generated/server";
import { requireAdmin } from "./access";

/** The latest access changes, newest first. Admins only. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const entries = await ctx.db.query("auditLog").withIndex("by_created_at").order("desc").take(100);
    return entries.map((e) => ({ _id: e._id, actorName: e.actorName, action: e.action, createdAt: e.createdAt }));
  },
});
