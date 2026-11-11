import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { projectStatus } from "./schema";
import { cleanText, requireAccess, requireTeam } from "./access";

const STATUSES = ["In progress", "In review", "At risk", "Completed"] as const;
type Status = (typeof STATUSES)[number];

// Access rules (see access.ts): team members see and change every project;
// clients see only their own company's projects and can't change anything.

function cleanDeadline(value: string) {
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
  if (!ok) throw new ConvexError("Enter the deadline as a date (YYYY-MM-DD).");
  return value;
}

function cleanProgress(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new ConvexError("Progress must be between 0 and 100.");
  }
  return Math.round(value);
}

/** Newest first: every project for the team, only their company's for a client. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAccess(ctx);
    if (viewer.role === "team") {
      return await ctx.db.query("projects").order("desc").collect();
    }
    return await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("client", viewer.client))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    client: v.string(),
    deadline: v.string(),
    lead: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const creator = await requireTeam(ctx);
    const client = cleanText(args.client, "client", 60);

    const projectId = await ctx.db.insert("projects", {
      name: cleanText(args.name, "project name", 80),
      client,
      status: "In progress",
      progress: 0,
      deadline: cleanDeadline(args.deadline),
      lead: cleanText(args.lead, "project lead", 60),
      description: cleanText(args.description, "description", 500, false),
      symbol: client[0].toUpperCase(),
      color: "",
      createdBy: creator._id,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activity", {
      actor: creator.name,
      action: "created a new project.",
      context: cleanText(args.name, "project name", 80),
      client,
      createdAt: Date.now(),
    });

    return projectId;
  },
});

/** Delivery update from the project dialog. Completed projects are always 100%. */
export const update = mutation({
  args: {
    id: v.id("projects"),
    status: v.optional(projectStatus),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, { id, status, progress }) => {
    const user = await requireTeam(ctx);
    const project = await ctx.db.get("projects", id);
    if (!project) throw new ConvexError("This project no longer exists.");

    const nextStatus = status ?? project.status;
    const nextProgress = nextStatus === "Completed"
      ? 100
      : progress === undefined ? project.progress : cleanProgress(progress);

    await ctx.db.patch("projects", id, {
      status: nextStatus,
      progress: nextProgress,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activity", {
      actor: user.name,
      action: "updated delivery status.",
      context: project.name,
      client: project.client,
      createdAt: Date.now(),
    });
  },
});

/**
 * One-time import from the old local API's data file. Run it with
 * `npm run convex:import-projects`. Projects already imported (same legacy id) are skipped.
 */
export const importLegacy = internalMutation({
  args: {
    projects: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        client: v.string(),
        status: v.string(),
        progress: v.number(),
        deadline: v.string(),
        lead: v.string(),
        description: v.optional(v.string()),
        symbol: v.optional(v.string()),
        color: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let skipped = 0;
    // The old file lists newest first; insert oldest first so list() keeps the same order.
    for (const p of [...args.projects].reverse()) {
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_legacy_id", (q) => q.eq("legacyId", p.id))
        .first();
      if (existing) {
        skipped++;
        continue;
      }
      if (!STATUSES.includes(p.status as Status)) {
        throw new ConvexError(`Project "${p.name}" has an unknown status: ${p.status}`);
      }
      const client = cleanText(p.client, "client", 60);
      await ctx.db.insert("projects", {
        name: cleanText(p.name, "project name", 80),
        client,
        status: p.status as Status,
        progress: p.status === "Completed" ? 100 : cleanProgress(p.progress),
        deadline: cleanDeadline(p.deadline),
        lead: cleanText(p.lead, "project lead", 60),
        description: cleanText(p.description ?? "", "description", 500, false),
        symbol: (p.symbol || client[0]).toUpperCase(),
        color: p.color ?? "",
        legacyId: p.id,
        updatedAt: Date.now(),
      });
      inserted++;
    }
    return { inserted, skipped };
  },
});
