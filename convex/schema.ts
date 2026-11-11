import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const projectStatus = v.union(
  v.literal("In progress"),
  v.literal("In review"),
  v.literal("At risk"),
  v.literal("Completed"),
);

// "team": Trodas staff, can see and edit every project.
// "client": sees only projects whose `client` matches the user's `client`, read-only.
// No role yet: signed in, but waiting for a team member to grant access.
export const userRole = v.union(v.literal("team"), v.literal("client"));

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
    body: v.string(),
    legacyId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_client", ["client"])
    .index("by_project_legacy", ["projectLegacyId"]),
});
