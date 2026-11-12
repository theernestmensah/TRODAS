import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Shared access checks. Every function that reads or changes portal data goes
// through one of these, so the rules live in one place.
//
//   admin  → everything the team can do, plus people, invites and client companies
//   team   → sees and edits every project
//   client → sees only their company's data, read-only
//   (none) → signed in, waiting for access

export type Role = "admin" | "team" | "client";
export type Staff = Doc<"users"> & { role: "admin" | "team" };
export type Admin = Doc<"users"> & { role: "admin" };
export type ClientUser = Doc<"users"> & { role: "client"; client: string };

export const isStaff = (role: string | undefined | null) => role === "admin" || role === "team";

/** The signed-in person's users row, or null when signed out or not stored yet. */
export async function findViewer(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

/** Someone with access: staff, or a client linked to a company. */
export async function requireAccess(ctx: QueryCtx): Promise<Staff | ClientUser> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Sign in first.");
  const user = await findViewer(ctx);
  if (isStaff(user?.role)) return user as Staff;
  if (user?.role === "client" && user.client) return user as ClientUser;
  throw new ConvexError("Your account is waiting for access. Ask a Trodas admin.");
}

/** A Trodas team member or admin. Clients are read-only. */
export async function requireTeam(ctx: QueryCtx): Promise<Staff> {
  const user = await requireAccess(ctx);
  if (!isStaff(user.role)) throw new ConvexError("Only the Trodas team can do this.");
  return user as Staff;
}

/** An admin: manages people, invites and client companies. */
export async function requireAdmin(ctx: QueryCtx): Promise<Admin> {
  const user = await requireAccess(ctx);
  if (user.role !== "admin") throw new ConvexError("Only admins can do this.");
  return user as Admin;
}

export function cleanText(value: string, field: string, max: number, required = true) {
  const text = value.trim();
  if (required && !text) throw new ConvexError(`Enter a ${field}.`);
  if (text.length > max) throw new ConvexError(`Keep the ${field} under ${max} characters.`);
  return text;
}

export function cleanEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ConvexError("Enter a valid email address.");
  }
  return email;
}

// ── Client companies ─────────────────────────────────────────────────────────

/** Tidy a company name: trimmed, single spaces. */
export const tidyClientName = (name: string) => name.trim().replace(/\s+/g, " ");
export const clientKey = (name: string) => tidyClientName(name).toLowerCase();

export async function findClient(ctx: QueryCtx, name: string) {
  const key = clientKey(name);
  if (!key) return null;
  return await ctx.db.query("clients").withIndex("by_key", (q) => q.eq("key", key)).unique();
}

/** The client's exact name as stored, or an error if it isn't on the client list. */
export async function requireClient(ctx: QueryCtx, name: string) {
  const client = await findClient(ctx, name);
  if (!client) {
    throw new ConvexError(`“${tidyClientName(name)}” isn’t on the client list. An admin can add it on the Admin page.`);
  }
  return client.name;
}

/** Find a client by name, adding it to the client list if it's new. Returns the stored name. */
export async function ensureClient(ctx: MutationCtx, name: string) {
  const tidy = cleanText(tidyClientName(name), "client", 60);
  const existing = await findClient(ctx, tidy);
  if (existing) return { name: existing.name, created: false };
  await ctx.db.insert("clients", { name: tidy, key: clientKey(tidy), createdAt: Date.now() });
  return { name: tidy, created: true };
}

// ── Projects as the portal refers to them ────────────────────────────────────

/** The id the portal uses for a project: its old id (p1…) if imported, otherwise its Convex id. */
export const projectAppId = (p: Doc<"projects">) => p.legacyId ?? p._id;

export async function findProjectByAppId(ctx: QueryCtx, appId: string) {
  const imported = await ctx.db.query("projects").withIndex("by_legacy_id", (q) => q.eq("legacyId", appId)).first();
  if (imported) return imported;
  const id = ctx.db.normalizeId("projects", appId);
  return id ? await ctx.db.get("projects", id) : null;
}

/**
 * A project the caller may see: any project for staff; for clients, only their company's
 * projects that aren't archived. Anything else reads as "not found", so ids don't leak.
 */
export async function requireVisibleProject(ctx: QueryCtx, viewer: Staff | ClientUser, appId: string) {
  const project = await findProjectByAppId(ctx, appId);
  if (!project || (viewer.role === "client" && (project.client !== viewer.client || project.archived))) {
    throw new ConvexError("That project isn’t available.");
  }
  return project;
}

// ── Access log ───────────────────────────────────────────────────────────────

/** Record an access change. `actor` is the admin who made it, or a label such as "Command line". */
export async function audit(ctx: MutationCtx, actor: Doc<"users"> | string, action: string) {
  await ctx.db.insert("auditLog", {
    actorName: typeof actor === "string" ? actor : actor.name,
    actorId: typeof actor === "string" ? undefined : actor._id,
    action,
    createdAt: Date.now(),
  });
}

/** How an access level reads in the access log and the portal. */
export function describeAccess(role: Role | undefined | null, client?: string | null) {
  if (role === "admin") return "admin";
  if (role === "team") return "Trodas team";
  if (role === "client") return `client access for ${client}`;
  return "no access";
}
