import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { audit, cleanText, clientKey, findClient, requireAdmin, requireTeam, tidyClientName } from "./access";

/** The client list, for the Admin page and the new-project form. Staff only. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireTeam(ctx);
    const clients = await ctx.db.query("clients").collect();
    return clients
      .map((c) => ({ _id: c._id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  },
});

/** Add a client company. Admins only. */
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const name = cleanText(tidyClientName(args.name), "client name", 60);
    const existing = await findClient(ctx, name);
    if (existing) throw new ConvexError(`“${existing.name}” is already on the client list.`);
    const id = await ctx.db.insert("clients", { name, key: clientKey(name), createdAt: Date.now() });
    await audit(ctx, admin, `added the client ${name}.`);
    return id;
  },
});

/** Change a client name everywhere it's used. */
async function renameEverywhere(ctx: MutationCtx, from: string, to: string) {
  let changed = 0;
  for (const table of ["projects", "feedback", "resources", "activity"] as const) {
    const rows = await ctx.db.query(table).withIndex("by_client", (q) => q.eq("client", from)).collect();
    for (const row of rows) {
      await ctx.db.patch(table, row._id, table === "projects" ? { client: to, symbol: to[0].toUpperCase() } : { client: to });
      changed++;
    }
  }
  for (const table of ["users", "invites"] as const) {
    const rows = (await ctx.db.query(table).collect()).filter((row) => row.client === from);
    for (const row of rows) {
      await ctx.db.patch(table, row._id, { client: to });
      changed++;
    }
  }
  return changed;
}

/**
 * Rename a client. Projects, client accounts, invites, feedback, resources and activity
 * follow the new name. Renaming to another client's name merges the two. Admins only.
 */
export const rename = mutation({
  args: { id: v.id("clients"), name: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const client = await ctx.db.get("clients", args.id);
    if (!client) throw new ConvexError("That client no longer exists.");
    const name = cleanText(tidyClientName(args.name), "client name", 60);
    if (name === client.name) return { merged: false };

    const other = await findClient(ctx, name);
    if (other && other._id !== client._id) {
      await renameEverywhere(ctx, client.name, other.name);
      await ctx.db.delete("clients", client._id);
      await audit(ctx, admin, `merged the client ${client.name} into ${other.name}.`);
      return { merged: true };
    }
    await renameEverywhere(ctx, client.name, name);
    await ctx.db.patch("clients", client._id, { name, key: clientKey(name) });
    await audit(ctx, admin, `renamed the client ${client.name} to ${name}.`);
    return { merged: false };
  },
});

/** Remove a client nothing uses any more. Admins only. */
export const remove = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    const client = await ctx.db.get("clients", id);
    if (!client) return;
    const project = await ctx.db.query("projects").withIndex("by_client", (q) => q.eq("client", client.name)).first();
    const person = (await ctx.db.query("users").collect()).some((u) => u.client === client.name);
    const invite = (await ctx.db.query("invites").withIndex("by_status", (q) => q.eq("status", "pending")).collect()).some((i) => i.client === client.name);
    if (project || person || invite) {
      throw new ConvexError(`${client.name} still has projects, people or invites. Move them first, or rename this client to merge it.`);
    }
    await ctx.db.delete("clients", id);
    await audit(ctx, admin, `removed the client ${client.name}.`);
  },
});

/**
 * Fill the client list from the companies already used on projects and client accounts.
 * Safe to run again. `npx convex run clients:syncFromProjects`
 */
export const syncFromProjects = internalMutation({
  args: {},
  handler: async (ctx) => {
    const names = new Set<string>();
    for (const p of await ctx.db.query("projects").collect()) names.add(p.client);
    for (const u of await ctx.db.query("users").collect()) if (u.client) names.add(u.client);
    const added: string[] = [];
    for (const raw of names) {
      const name = tidyClientName(raw);
      if (!name || (await findClient(ctx, name))) continue;
      await ctx.db.insert("clients", { name, key: clientKey(name), createdAt: Date.now() });
      added.push(name);
    }
    // Spellings that differ only in capitals or spaces now point at one client: use its name.
    let normalized = 0;
    for (const raw of names) {
      const canonical = (await findClient(ctx, raw))?.name;
      if (canonical && canonical !== raw) normalized += await renameEverywhere(ctx, raw, canonical);
    }
    return { added, normalized };
  },
});
