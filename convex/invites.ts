import { ConvexError, v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { userRole } from "./schema";
import { audit, cleanEmail, describeAccess, requireAdmin, requireClient } from "./access";

// Invites decide someone's access before their first sign-in (see users:store).
// Convex is the source of truth: revoking here is what removes the access, even if the
// person still has the Clerk email. Clerk only sends the email, and only when the
// deployment has CLERK_SECRET_KEY set (Convex dashboard → Settings → Environment Variables).

// Convex provides process.env at run time; this declares it without needing @types/node.
declare const process: { env: Record<string, string | undefined> };

const clerkKey = () => (process.env.CLERK_SECRET_KEY ?? "").trim();
// Tests can point this at a stand-in for Clerk's Backend API.
const clerkApi = () => (process.env.CLERK_API_URL || "https://api.clerk.com").replace(/\/+$/, "");

async function clerkError(res: Response) {
  try {
    const body = await res.json();
    const first = body?.errors?.[0];
    return String(first?.long_message || first?.message || `HTTP ${res.status}`);
  } catch {
    return `HTTP ${res.status}`;
  }
}

/** Pending invites, and whether Convex can email them. Admins only. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const pending = await ctx.db
      .query("invites")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
    return {
      canEmail: clerkKey().startsWith("sk_"),
      pending: pending.map((i) => ({
        _id: i._id,
        email: i.email,
        role: i.role,
        client: i.client ?? null,
        invitedByName: i.invitedByName,
        emailSent: i.emailSent,
        createdAt: i.createdAt,
      })),
    };
  },
});

/** Save (or update) a pending invite. Called by send, with the admin's sign-in. */
export const record = internalMutation({
  args: { email: v.string(), role: userRole, client: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const email = cleanEmail(args.email);
    const client = args.role === "client" ? await requireClient(ctx, args.client ?? "") : undefined;

    const existing = (await ctx.db.query("users").collect()).find((u) => u.email?.toLowerCase() === email);
    if (existing) {
      throw new ConvexError(`${existing.name} already has an account. Change their access in the People list instead.`);
    }

    const access = describeAccess(args.role, client);
    const pending = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (pending) {
      await ctx.db.patch("invites", pending._id, {
        role: args.role,
        client,
        invitedBy: admin._id,
        invitedByName: admin.name,
        emailSent: false,
        clerkInvitationId: undefined,
        createdAt: Date.now(),
      });
      await audit(ctx, admin, `updated the invitation for ${email} to ${access}.`);
      // send() cancels the earlier Clerk email, so only the newest link is open.
      return { inviteId: pending._id, email, replacesClerkInvitation: pending.clerkInvitationId ?? null };
    }

    const inviteId = await ctx.db.insert("invites", {
      email,
      role: args.role,
      client,
      status: "pending",
      invitedBy: admin._id,
      invitedByName: admin.name,
      emailSent: false,
      createdAt: Date.now(),
    });
    await audit(ctx, admin, `invited ${email} with ${access}.`);
    return { inviteId, email, replacesClerkInvitation: null };
  },
});

async function revokeInClerk(key: string, invitationId: string) {
  const res = await fetch(`${clerkApi()}/v1/invitations/${encodeURIComponent(invitationId)}/revoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
  });
  return res.ok;
}

export const markEmailed = internalMutation({
  args: { inviteId: v.id("invites"), clerkInvitationId: v.string() },
  handler: async (ctx, { inviteId, clerkInvitationId }) => {
    await ctx.db.patch("invites", inviteId, { emailSent: true, clerkInvitationId });
  },
});

/**
 * Invite someone by email with the access they'll get on first sign-in. Admins only.
 * Returns whether Clerk emailed them; if not, the access is still saved and they can be
 * invited from the Clerk dashboard instead.
 */
export const send = action({
  args: {
    email: v.string(),
    role: userRole,
    client: v.optional(v.string()),
    redirectUrl: v.optional(v.string()), // the portal's login page, where the invite link lands
  },
  handler: async (ctx, args): Promise<{ emailed: boolean; reason?: string }> => {
    const { inviteId, email, replacesClerkInvitation } = await ctx.runMutation(internal.invites.record, {
      email: args.email,
      role: args.role,
      client: args.client,
    });

    const key = clerkKey();
    if (!key) return { emailed: false, reason: "no-key" };
    if (replacesClerkInvitation) await revokeInClerk(key, replacesClerkInvitation);

    let redirect_url: string | undefined;
    try {
      const url = new URL(args.redirectUrl ?? "");
      if (url.protocol === "https:" || url.protocol === "http:") redirect_url = url.href;
    } catch {
      // No usable redirect: Clerk's own sign-up page handles the invite.
    }

    const res = await fetch(`${clerkApi()}/v1/invitations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email, redirect_url, notify: true, ignore_existing: true }),
    });
    if (!res.ok) return { emailed: false, reason: await clerkError(res) };
    const invitation = await res.json();
    await ctx.runMutation(internal.invites.markEmailed, { inviteId, clerkInvitationId: String(invitation.id) });
    return { emailed: true };
  },
});

export const markRevoked = internalMutation({
  args: { id: v.id("invites") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    const invite = await ctx.db.get("invites", id);
    if (!invite || invite.status !== "pending") throw new ConvexError("That invitation was already used or cancelled.");
    await ctx.db.patch("invites", id, { status: "revoked" });
    await audit(ctx, admin, `cancelled the invitation for ${invite.email}.`);
    return { clerkInvitationId: invite.clerkInvitationId ?? null };
  },
});

/** Cancel a pending invite, in Convex and (when it was emailed) in Clerk. Admins only. */
export const revoke = action({
  args: { id: v.id("invites") },
  handler: async (ctx, { id }): Promise<{ clerkRevoked: boolean }> => {
    const { clerkInvitationId } = await ctx.runMutation(internal.invites.markRevoked, { id });
    const key = clerkKey();
    if (!key || !clerkInvitationId) return { clerkRevoked: false };
    return { clerkRevoked: await revokeInClerk(key, clerkInvitationId) };
  },
});
