import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { milestone, projectStatus } from "./schema";
import { audit, cleanText, ensureClient, findClient, projectAppId, requireAccess, requireAdmin, requireClient, requireTeam, type Staff } from "./access";

const STATUSES = ["In progress", "In review", "At risk", "Completed"] as const;
type Status = (typeof STATUSES)[number];

// Access rules (see access.ts): team members see and change every project;
// clients see only their own company's projects and can't change anything.

function cleanDate(value: string, label: string) {
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
  if (!ok) throw new ConvexError(`Enter the ${label} as a date (YYYY-MM-DD).`);
  return value;
}
const cleanDeadline = (value: string) => cleanDate(value, "deadline");

// ── Delivery timeline ────────────────────────────────────────────────────────

type Milestone = { title: string; start: string; end: string; done: boolean };
const DAY = 86_400_000;
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10); // Ghana is on UTC
const keyMs = (key: string) => Date.parse(`${key}T00:00:00Z`);

/** The standard phases, spread from `start` to the deadline. */
export function defaultMilestones(start: string, deadline: string): Milestone[] {
  const phases: [string, number][] = [["Discovery", 0.12], ["Design", 0.2], ["Build", 0.43], ["Testing", 0.15], ["Launch", 0.1]];
  const from = keyMs(start);
  const total = Math.max(phases.length, Math.round((keyMs(deadline) - from) / DAY) + 1);
  let cursor = from;
  let used = 0;
  return phases.map(([title, share], i) => {
    const days = i === phases.length - 1 ? total - used : Math.max(1, Math.round(total * share));
    used += days;
    const phase = { title, start: dayKey(cursor), end: dayKey(cursor + (days - 1) * DAY), done: false };
    cursor += days * DAY;
    return phase;
  });
}

function cleanMilestones(list: Milestone[]) {
  if (list.length < 1 || list.length > 10) throw new ConvexError("A timeline has between 1 and 10 phases.");
  return list.map((m, i) => {
    const title = cleanText(m.title, `name of phase ${i + 1}`, 60);
    const start = cleanDate(m.start, `start of “${title}”`);
    const end = cleanDate(m.end, `end of “${title}”`);
    if (end < start) throw new ConvexError(`“${title}” ends before it starts.`);
    return { title, start, end, done: Boolean(m.done) };
  });
}

function cleanProgress(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new ConvexError("Progress must be between 0 and 100.");
  }
  return Math.round(value);
}

/** Newest first: every project (archived ones too) for staff; a client's company's current projects. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireAccess(ctx);
    if (viewer.role !== "client") {
      return await ctx.db.query("projects").order("desc").collect();
    }
    const own = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("client", viewer.client))
      .order("desc")
      .collect();
    return own.filter((p) => !p.archived);
  },
});

/**
 * The client name to store on a project: the client list's spelling. Admins may add a
 * new client here; the team picks an existing one.
 */
async function projectClient(ctx: MutationCtx, user: Staff, name: string) {
  const known = await findClient(ctx, name);
  if (known) return known.name;
  if (user.role !== "admin") return await requireClient(ctx, name); // throws with a clear message
  const client = (await ensureClient(ctx, name)).name;
  await audit(ctx, user, `added the client ${client} while saving a project.`);
  return client;
}

async function logActivity(ctx: MutationCtx, actor: string, action: string, context: string, client: string) {
  await ctx.db.insert("activity", { actor, action, context, client, createdAt: Date.now() });
}

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
    // Projects use a client from the client list, so client accounts always match.
    const client = await projectClient(ctx, creator, args.client);
    const deadline = cleanDeadline(args.deadline);
    const today = dayKey(Date.now());

    const projectId = await ctx.db.insert("projects", {
      name: cleanText(args.name, "project name", 80),
      client,
      status: "In progress",
      progress: 0,
      deadline,
      // A starting timeline the team can adjust: standard phases from today to the deadline.
      milestones: defaultMilestones(deadline > today ? today : deadline, deadline),
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
 * Change a project's details. If its client changes, its feedback and resources move with it,
 * so the new client's accounts see them and the old client's no longer do. Staff only.
 */
export const edit = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    client: v.string(),
    deadline: v.string(),
    lead: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireTeam(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (!project) throw new ConvexError("This project no longer exists.");
    const client = await projectClient(ctx, user, args.client);
    const name = cleanText(args.name, "project name", 80);

    await ctx.db.patch("projects", args.id, {
      name,
      client,
      symbol: client[0].toUpperCase(),
      deadline: cleanDeadline(args.deadline),
      lead: cleanText(args.lead, "project lead", 60),
      description: cleanText(args.description, "description", 500, false),
      updatedAt: Date.now(),
    });

    if (client !== project.client) {
      const appId = projectAppId(project);
      for (const table of ["feedback", "resources"] as const) {
        const rows = await ctx.db.query(table).withIndex("by_project_legacy", (q) => q.eq("projectLegacyId", appId)).collect();
        for (const row of rows) await ctx.db.patch(table, row._id, { client });
      }
      await logActivity(ctx, user.name, `moved the project from ${project.client} to ${client}.`, name, client);
    } else {
      await logActivity(ctx, user.name, "edited the project details.", name, client);
    }
  },
});

/** Replace a project's timeline (names, dates, done). Staff only. */
export const setTimeline = mutation({
  args: { id: v.id("projects"), milestones: v.array(milestone) },
  handler: async (ctx, { id, milestones }) => {
    const user = await requireTeam(ctx);
    const project = await ctx.db.get("projects", id);
    if (!project) throw new ConvexError("This project no longer exists.");
    await ctx.db.patch("projects", id, { milestones: cleanMilestones(milestones), updatedAt: Date.now() });
    await logActivity(ctx, user.name, "updated the delivery timeline.", project.name, project.client);
  },
});

/** Mark one phase of a project's timeline done, or reopen it. Staff only. */
export const setMilestoneDone = mutation({
  args: { id: v.id("projects"), index: v.number(), done: v.boolean() },
  handler: async (ctx, { id, index, done }) => {
    const user = await requireTeam(ctx);
    const project = await ctx.db.get("projects", id);
    if (!project) throw new ConvexError("This project no longer exists.");
    const list = project.milestones ?? [];
    const phase = list[index];
    if (!phase) throw new ConvexError("That phase isn’t on the timeline any more.");
    if (phase.done === done) return;
    await ctx.db.patch("projects", id, {
      milestones: list.map((m, i) => (i === index ? { ...m, done } : m)),
      updatedAt: Date.now(),
    });
    await logActivity(ctx, user.name, done ? `completed the ${phase.title} phase.` : `reopened the ${phase.title} phase.`, project.name, project.client);
  },
});

/** Archive a project (it leaves everyone's lists) or restore it. Staff only. */
export const setArchived = mutation({
  args: { id: v.id("projects"), archived: v.boolean() },
  handler: async (ctx, { id, archived }) => {
    const user = await requireTeam(ctx);
    const project = await ctx.db.get("projects", id);
    if (!project) throw new ConvexError("This project no longer exists.");
    if (Boolean(project.archived) === archived) return;
    await ctx.db.patch("projects", id, { archived, updatedAt: Date.now() });
    await logActivity(ctx, user.name, archived ? "archived the project." : "restored the project.", project.name, project.client);
  },
});

/**
 * Delete an archived project for good, with its feedback and resources. Admins only;
 * archive first so nothing disappears by accident.
 */
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    const project = await ctx.db.get("projects", id);
    if (!project) return;
    if (!project.archived) throw new ConvexError("Archive the project before deleting it.");
    const appId = projectAppId(project);
    let attached = 0;
    for (const table of ["feedback", "resources"] as const) {
      const rows = await ctx.db.query(table).withIndex("by_project_legacy", (q) => q.eq("projectLegacyId", appId)).collect();
      for (const row of rows) {
        if ("fileId" in row && row.fileId) await ctx.storage.delete(row.fileId);
        await ctx.db.delete(table, row._id);
        attached++;
      }
    }
    await ctx.db.delete("projects", id);
    await audit(ctx, admin, `deleted the project ${project.name} (${project.client})${attached ? ` and ${attached} feedback item${attached === 1 ? "" : "s"} or resource${attached === 1 ? "" : "s"}` : ""}.`);
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
      const { name: client } = await ensureClient(ctx, p.client);
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
