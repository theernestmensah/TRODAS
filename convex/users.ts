import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { audit, cleanEmail, describeAccess, ensureClient, findViewer, requireAdmin, requireClient, requireTeam } from "./access";

export const accessChoice = v.union(v.literal("admin"), v.literal("team"), v.literal("client"), v.literal("none"));
export type AccessChoice = "admin" | "team" | "client" | "none";

/** What the portal is allowed to know about a person (never the token identifier). */
function publicProfile(user: Doc<"users">) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email ?? null,
    imageUrl: user.imageUrl ?? null,
    lastSignedInAt: user.lastSignedInAt,
    role: user.role ?? null,
    client: user.client ?? null,
  };
}

/**
 * The fields to store for an access choice. Clients must be on the client list
 * (the command line may add a missing one). Patching a field to undefined removes it.
 */
export async function accessFields(ctx: MutationCtx, role: AccessChoice, client: string | undefined, addMissingClient = false) {
  if (role === "client") {
    const name = addMissingClient ? (await ensureClient(ctx, client ?? "")).name : await requireClient(ctx, client ?? "");
    return { role, client: name } as const;
  }
  return { role: role === "none" ? undefined : role, client: undefined };
}

async function adminCount(ctx: MutationCtx) {
  const users = await ctx.db.query("users").collect();
  return users.filter((u) => u.role === "admin").length;
}

/**
 * Called by the portal right after Convex accepts the Clerk token.
 * Creates the user's row on first sign-in and refreshes their profile after that.
 * If they have no access yet and an admin invited their email, the invite's access applies.
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not signed in: Convex did not receive a valid Clerk token.");
    }

    const profile = {
      name: identity.name ?? identity.email ?? "Portal user",
      email: identity.email,
      imageUrl: identity.pictureUrl,
      lastSignedInAt: Date.now(),
    };

    let user = await findViewer(ctx);
    if (user) {
      await ctx.db.patch("users", user._id, profile);
    } else {
      const id = await ctx.db.insert("users", { tokenIdentifier: identity.tokenIdentifier, ...profile });
      user = (await ctx.db.get("users", id))!;
    }

    // Clerk only lets a verified address be someone's primary email, and invite-only
    // accounts are created from the invitation email, so this matches the invited person.
    if (!user.role && identity.email) {
      const invite = await ctx.db
        .query("invites")
        .withIndex("by_email", (q) => q.eq("email", identity.email!.trim().toLowerCase()))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();
      if (invite) {
        const fields = invite.role === "client" ? { role: invite.role, client: invite.client } : { role: invite.role, client: undefined };
        await ctx.db.patch("users", user._id, fields);
        await ctx.db.patch("invites", invite._id, { status: "accepted", acceptedAt: Date.now() });
        const whose = invite.invitedBy ? `${invite.invitedByName}’s invitation` : "a pre-approved invitation";
        await audit(ctx, user, `accepted ${whose} and got ${describeAccess(invite.role, invite.client)}.`);
      }
    }
    return user._id;
  },
});

/** The signed-in person and their access, or null when signed out or not stored yet. */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await findViewer(ctx);
    return user ? publicProfile(user) : null;
  },
});

/** Everyone who has signed in, for the Admin page. Admins only. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .map(publicProfile)
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  },
});

/** Trodas staff (admins and team), for project leads and the Team page. Staff only. */
export const staff = query({
  args: {},
  handler: async (ctx) => {
    await requireTeam(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.role === "admin" || u.role === "team")
      .map((u) => ({ _id: u._id, name: u.name, email: u.email ?? null, imageUrl: u.imageUrl ?? null, role: u.role! }))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  },
});

/** Grant or change someone's access. Admins only, and never your own. */
export const setAccess = mutation({
  args: {
    userId: v.id("users"),
    role: accessChoice,
    client: v.optional(v.string()),
  },
  handler: async (ctx, { userId, role, client }) => {
    const me = await requireAdmin(ctx);
    if (me._id === userId) {
      throw new ConvexError("You can’t change your own access. Ask another admin.");
    }
    const target = await ctx.db.get("users", userId);
    if (!target) throw new ConvexError("That person’s account no longer exists.");
    const fields = await accessFields(ctx, role, client);
    if (target.role === fields.role && (target.client ?? undefined) === fields.client) return;
    if (target.role === "admin" && fields.role !== "admin" && (await adminCount(ctx)) <= 1) {
      throw new ConvexError("The portal needs at least one admin.");
    }
    await ctx.db.patch("users", userId, fields);
    await audit(ctx, me, `changed ${target.name}’s access from ${describeAccess(target.role, target.client)} to ${describeAccess(fields.role, fields.client)}.`);
  },
});

/**
 * Bootstrap and recovery from the command line (admin access), for when no admin
 * can sign in to grant access: `npm run convex:grant -- you@company.com admin`.
 * For someone who hasn't signed in yet, it saves the access as a pending invite that
 * applies at their first sign-in. It sends no email: invite them in Clerk if needed.
 */
export const grantAccess = internalMutation({
  args: {
    email: v.string(),
    role: accessChoice,
    client: v.optional(v.string()),
  },
  handler: async (ctx, { email, role, client }) => {
    const wanted = cleanEmail(email);
    const users = await ctx.db.query("users").collect();
    const matches = users.filter((u) => u.email?.toLowerCase() === wanted);
    if (matches.length === 0) {
      const pending = await ctx.db
        .query("invites")
        .withIndex("by_email", (q) => q.eq("email", wanted))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();
      if (role === "none") {
        if (pending) {
          await ctx.db.patch("invites", pending._id, { status: "revoked" });
          await audit(ctx, "Command line", `cancelled the invitation for ${wanted}.`);
        }
        return { updated: 0, preApproved: false, role: "none", client: null };
      }
      const fields = await accessFields(ctx, role, client, true);
      const invite = { role: fields.role!, client: fields.client, invitedBy: undefined, invitedByName: "Command line", emailSent: false, createdAt: Date.now() };
      if (pending) await ctx.db.patch("invites", pending._id, invite);
      else await ctx.db.insert("invites", { email: wanted, status: "pending", ...invite });
      await audit(ctx, "Command line", `pre-approved ${wanted} with ${describeAccess(fields.role, fields.client)}; it applies at their first sign-in.`);
      return { updated: 0, preApproved: true, role: fields.role!, client: fields.client ?? null };
    }
    const fields = await accessFields(ctx, role, client, true);
    for (const user of matches) {
      await ctx.db.patch("users", user._id, fields);
      await audit(ctx, "Command line", `set ${user.name}’s access to ${describeAccess(fields.role, fields.client)}.`);
    }
    return { updated: matches.length, role: fields.role ?? "none", client: fields.client ?? null };
  },
});
