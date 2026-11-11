import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { cleanText, findViewer, requireTeam } from "./access";

const accessChoice = v.union(v.literal("team"), v.literal("client"), v.literal("none"));

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

function accessFields(role: "team" | "client" | "none", client: string | undefined) {
  if (role === "client") {
    return { role, client: cleanText(client ?? "", "client company", 60) } as const;
  }
  // Patching a field to undefined removes it.
  return { role: role === "none" ? undefined : role, client: undefined };
}

/**
 * Called by the portal right after Convex accepts the Clerk token.
 * Creates the user's row on first sign-in and refreshes their profile after that.
 * Never touches role or client: only team members grant access.
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

    const existing = await findViewer(ctx);
    if (existing) {
      await ctx.db.patch("users", existing._id, profile);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...profile,
    });
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

/** Everyone who has signed in, for the People & access page. Team only. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireTeam(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .map(publicProfile)
      .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  },
});

/** Grant or change someone's access. Team only, and never your own. */
export const setAccess = mutation({
  args: {
    userId: v.id("users"),
    role: accessChoice,
    client: v.optional(v.string()),
  },
  handler: async (ctx, { userId, role, client }) => {
    const me = await requireTeam(ctx);
    if (me._id === userId) {
      throw new ConvexError("You can’t change your own access. Ask another team member.");
    }
    const target = await ctx.db.get("users", userId);
    if (!target) throw new ConvexError("That person’s account no longer exists.");
    await ctx.db.patch("users", userId, accessFields(role, client));
  },
});

/**
 * Bootstrap and recovery from the command line (admin access), for when no team member
 * can sign in to grant access yet: `npm run convex:grant -- you@company.com team`.
 * The person must have signed in to the portal once so their row exists.
 */
export const grantAccess = internalMutation({
  args: {
    email: v.string(),
    role: accessChoice,
    client: v.optional(v.string()),
  },
  handler: async (ctx, { email, role, client }) => {
    const wanted = email.trim().toLowerCase();
    const users = await ctx.db.query("users").collect();
    const matches = users.filter((u) => u.email?.toLowerCase() === wanted);
    if (matches.length === 0) {
      const known = users.map((u) => u.email).filter(Boolean).join(", ") || "none";
      throw new ConvexError(
        `No one with ${email} has signed in yet. Sign in to the portal once, then run this again. ` +
          `Emails on file: ${known}.`,
      );
    }
    const fields = accessFields(role, client);
    for (const user of matches) await ctx.db.patch("users", user._id, fields);
    return { updated: matches.length, role: fields.role ?? "none", client: fields.client ?? null };
  },
});
