import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const projectStatus = v.union(
  v.literal("In progress"),
  v.literal("In review"),
  v.literal("At risk"),
  v.literal("Completed"),
);

// "admin": Trodas staff who also manage people, invites and client companies.
// "team": Trodas staff, can see and edit every project.
// "client": sees only projects whose `client` matches the user's `client`, read-only.
// No role yet: signed in, but waiting for an admin to grant access.
export const userRole = v.union(v.literal("admin"), v.literal("team"), v.literal("client"));

export const inviteStatus = v.union(v.literal("pending"), v.literal("accepted"), v.literal("revoked"));

export const milestone = v.object({
  title: v.string(),
  start: v.string(),
  end: v.string(),
  done: v.boolean(),
});

export const feedbackStatus = v.union(
  v.literal("Needs review"),
  v.literal("Reviewed"),
);

export default defineSchema({
  // One row per person who has signed in through Clerk.
  // tokenIdentifier is stable per Clerk user and issuer, so it is the lookup key.
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    lastSignedInAt: v.number(),
    role: v.optional(userRole),
    client: v.optional(v.string()), // company name, set when role is "client"
  }).index("by_token", ["tokenIdentifier"]),

  projects: defineTable({
    name: v.string(),
    client: v.string(),
    status: projectStatus,
    progress: v.number(), // whole percent, 0–100
    deadline: v.string(), // YYYY-MM-DD
    lead: v.string(),
    description: v.string(),
    symbol: v.string(), // letter shown in the project badge
    color: v.string(), // badge colour key used by styles.css ("", "blue", "pink", "sand")
    // The project's id in the old local API ("p1", or a UUID). Demo feedback and
    // resources still point at these ids, so imported projects keep them.
    legacyId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    // Archived projects leave everyone's lists; the team can still find and restore them.
    archived: v.optional(v.boolean()),
    // Delivery timeline: phases in order, each with its dates (YYYY-MM-DD) and whether it's finished.
    milestones: v.optional(v.array(milestone)),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_client", ["client"]),

  feedback: defineTable({
    author: v.string(),
    client: v.string(),
    projectLegacyId: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    text: v.string(),
    date: v.string(),
    status: feedbackStatus,
    legacyId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_client", ["client"])
    .index("by_project_legacy", ["projectLegacyId"]),

  activity: defineTable({
    actor: v.string(),
    action: v.string(),
    context: v.string(),
    client: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_client", ["client"])
    .index("by_created_at", ["createdAt"]),

  resources: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.string(),
    client: v.string(),
    projectLegacyId: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    // A resource is either written text (body) or an uploaded file in Convex storage.
    body: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    legacyId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_client", ["client"])
    .index("by_project_legacy", ["projectLegacyId"]),

  // Client companies. Projects, client accounts and invites use `name`; `key` is the
  // lower-cased name, so "acme corporation " and "Acme Corporation" are the same client.
  clients: defineTable({
    name: v.string(),
    key: v.string(),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  // Access decided before someone's first sign-in. users:store applies a pending invite
  // to the account whose email matches, then marks it accepted.
  invites: defineTable({
    email: v.string(), // lower-cased
    role: userRole,
    client: v.optional(v.string()),
    status: inviteStatus,
    invitedBy: v.optional(v.id("users")), // empty when saved from the command line
    invitedByName: v.string(),
    emailSent: v.boolean(), // false when Convex has no Clerk secret key, or Clerk refused
    clerkInvitationId: v.optional(v.string()),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // Who changed access, invites and client companies. Admins only; never shown to clients.
  auditLog: defineTable({
    actorName: v.string(),
    actorId: v.optional(v.id("users")),
    action: v.string(),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
