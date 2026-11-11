import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

// Shared access checks. Every function that reads or changes portal data goes
// through one of these, so the rules live in one place.

export type TeamMember = Doc<"users"> & { role: "team" };
export type ClientUser = Doc<"users"> & { role: "client"; client: string };

/** The signed-in person's users row, or null when signed out or not stored yet. */
export async function findViewer(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

/** Someone with access: a team member, or a client linked to a company. */
export async function requireAccess(ctx: QueryCtx): Promise<TeamMember | ClientUser> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Sign in first.");
  const user = await findViewer(ctx);
  if (user?.role === "team") return user as TeamMember;
  if (user?.role === "client" && user.client) return user as ClientUser;
  throw new ConvexError("Your account is waiting for access. Ask your Trodas project lead.");
}

/** A Trodas team member. Clients are read-only. */
export async function requireTeam(ctx: QueryCtx): Promise<TeamMember> {
  const user = await requireAccess(ctx);
  if (user.role !== "team") throw new ConvexError("Only the Trodas team can do this.");
  return user;
}

export function cleanText(value: string, field: string, max: number, required = true) {
  const text = value.trim();
  if (required && !text) throw new ConvexError(`Enter a ${field}.`);
  if (text.length > max) throw new ConvexError(`Keep the ${field} under ${max} characters.`);
  return text;
}
