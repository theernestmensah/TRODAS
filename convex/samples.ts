import { internalMutation, type MutationCtx } from "./_generated/server";
import { audit, clientKey, findClient } from "./access";

// Sample data for development and demos: six projects for small Ghanaian businesses, with
// delivery timelines, client feedback, shared documents and recent activity.
// Load it with `npm run convex:samples` (safe to run again). It also removes the older
// placeholder samples (Acme Corporation and others, projects p1–p6) if they're still there.

type Phase = [title: string, start: string, end: string, done: boolean];
type SampleProject = {
  id: string;
  name: string;
  client: string;
  status: "In progress" | "In review" | "At risk" | "Completed";
  progress: number;
  lead: string;
  color: string;
  description: string;
  phases: Phase[];
};

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "s1", name: "Courier app for Android and iOS", client: "Sankofa Delivery", status: "In progress", progress: 55,
    lead: "Kwame Asante", color: "sand",
    description: "Customer app to book and track parcel deliveries across Accra, with a rider app and mobile money payments.",
    phases: [
      ["Discovery", "2026-10-01", "2026-10-12", true],
      ["UX and UI design", "2026-10-13", "2026-11-03", true],
      ["App development", "2026-11-04", "2026-12-22", false],
      ["Testing and beta", "2026-12-23", "2027-01-19", false],
      ["Store release", "2027-01-20", "2027-01-29", false],
    ],
  },
  {
    id: "s2", name: "Online ordering website", client: "Osu Bakery & Café", status: "In review", progress: 85,
    lead: "Efua Owusu", color: "pink",
    description: "Menu, online orders for pickup and delivery, and a simple screen to update the daily specials.",
    phases: [
      ["Discovery", "2026-10-05", "2026-10-09", true],
      ["Design", "2026-10-12", "2026-10-23", true],
      ["Build", "2026-10-26", "2026-11-11", true],
      ["Content and testing", "2026-11-12", "2026-11-18", false],
      ["Launch", "2026-11-19", "2026-11-20", false],
    ],
  },
  {
    id: "s3", name: "Container tracking dashboard", client: "Tema Harbour Logistics", status: "At risk", progress: 38,
    lead: "Yaw Darko", color: "blue",
    description: "Live container status for the operations desk, fed from the shipping lines’ daily data exports.",
    phases: [
      ["Discovery", "2026-09-14", "2026-09-25", true],
      ["Design", "2026-09-28", "2026-10-16", true],
      ["Build", "2026-10-19", "2026-11-11", false],
      ["Integration testing", "2026-11-12", "2026-11-27", false],
      ["Go-live", "2026-11-30", "2026-12-04", false],
    ],
  },
  {
    id: "s4", name: "Patient booking system", client: "Ridge Dental Clinic", status: "In progress", progress: 22,
    lead: "Adwoa Boateng", color: "",
    description: "Online appointment booking with SMS reminders, and a daily schedule for the front desk.",
    phases: [
      ["Discovery", "2026-11-02", "2026-11-13", false],
      ["Design", "2026-11-16", "2026-12-11", false],
      ["Build", "2026-12-14", "2027-02-05", false],
      ["Testing", "2027-02-08", "2027-02-19", false],
      ["Launch", "2027-02-22", "2027-02-26", false],
    ],
  },
  {
    id: "s5", name: "Farmer payments with mobile money", client: "Volta Grains Co-operative", status: "Completed", progress: 100,
    lead: "Kwame Asante", color: "sand",
    description: "Pays member farmers by mobile money as soon as their grain is weighed at a collection point.",
    phases: [
      ["Discovery", "2026-06-01", "2026-06-12", true],
      ["Design", "2026-06-15", "2026-07-10", true],
      ["Build", "2026-07-13", "2026-09-18", true],
      ["Pilot in two districts", "2026-09-21", "2026-10-16", true],
      ["Rollout", "2026-10-19", "2026-10-30", true],
    ],
  },
  {
    id: "s6", name: "Stock and sales system", client: "Kumasi Hardware Centre", status: "In progress", progress: 64,
    lead: "Yaw Darko", color: "",
    description: "Point of sale and stock levels for two branches, with low-stock alerts and daily sales reports.",
    phases: [
      ["Discovery", "2026-09-01", "2026-09-11", true],
      ["Design", "2026-09-14", "2026-10-02", true],
      ["Build", "2026-10-05", "2026-11-20", false],
      ["Testing", "2026-11-23", "2026-12-04", false],
      ["Training and launch", "2026-12-07", "2026-12-11", false],
    ],
  },
];

const SAMPLE_FEEDBACK = [
  { id: "sf1", project: "s2", author: "Nana Akua Ofori", text: "The menu photos look great. Could customers choose a pickup time at checkout? Mornings get very busy.", date: "Nov 10, 2026", status: "Needs review" as const },
  { id: "sf2", project: "s3", author: "Selorm Agbeko", text: "The tracking table is clear, but it’s slow to load on our office Wi-Fi. Can it show when the data was last updated?", date: "Nov 9, 2026", status: "Needs review" as const },
  { id: "sf3", project: "s6", author: "Kwabena Frimpong", text: "Please add a way to print the end-of-day sales summary for each branch manager.", date: "Nov 4, 2026", status: "Reviewed" as const },
  { id: "sf4", project: "s5", author: "Abubakari Seidu", text: "Every farmer in the pilot was paid the same day. The committee is very happy with it.", date: "Oct 28, 2026", status: "Reviewed" as const },
];

const SAMPLE_RESOURCES = [
  { project: "s1", name: "Project brief", type: "Brief", description: "Who the app is for, what it must do, and how we’ll measure success.",
    body: "Courier app: project brief\nClient: Sankofa Delivery\n\nUsers: customers sending parcels in Accra; riders; dispatch staff.\nMust have: book a pickup, live tracking, mobile money payment, delivery photo as proof.\nSuccess: 500 bookings a week within three months of launch; average booking under 2 minutes." },
  { project: "s1", name: "Release plan", type: "Plan", description: "Beta, store submission and launch steps.",
    body: "Release plan\n1. Internal beta with 10 riders (from 23 Dec)\n2. Fix-up sprint\n3. Google Play and App Store submission (from 20 Jan)\n4. Launch in Osu, East Legon and Madina first\n5. Review after two weeks" },
  { project: "s2", name: "Launch checklist", type: "Checklist", description: "Everything to confirm before the site goes live.",
    body: "Launch checklist\n- Menu prices confirmed by the café\n- Mobile money payments tested\n- Pickup and delivery areas set\n- Staff trained on the specials screen\n- Domain and email working" },
  { project: "s3", name: "Data feed specification", type: "Plan", description: "Format and timing of the shipping-line exports.",
    body: "Data feed specification\nSource: daily CSV exports from three shipping lines\nFields: container number, vessel, status, location, last event time\nTiming: by 06:00 each day; dashboard refreshes on arrival" },
  { project: "s4", name: "Discovery notes", type: "Notes", description: "Findings from the front-desk and dentist interviews.",
    body: "Discovery notes\n- Most bookings come by phone between 8 and 10 am\n- Missed appointments: about 1 in 8\n- Patients prefer SMS reminders the day before\n- Front desk needs a printable daily schedule" },
  { project: "s6", name: "Training plan", type: "Plan", description: "Sessions for cashiers and branch managers.",
    body: "Training plan\nWeek of 7 Dec: two sessions per branch\nCashiers: sales, returns, end of day\nManagers: stock counts, low-stock alerts, reports" },
];

const SAMPLE_ACTIVITY = [
  { at: "2026-11-11T15:20:00Z", actor: "Efua Owusu", action: "moved the project to review.", project: "s2" },
  { at: "2026-11-10T11:05:00Z", actor: "Yaw Darko", action: "flagged a delivery risk: the Build phase is running late.", project: "s3" },
  { at: "2026-11-06T09:40:00Z", actor: "Yaw Darko", action: "shared a project resource.", project: "s6" },
  { at: "2026-11-03T16:10:00Z", actor: "Kwame Asante", action: "completed the UX and UI design phase.", project: "s1" },
  { at: "2026-11-02T10:00:00Z", actor: "Adwoa Boateng", action: "started discovery workshops.", project: "s4" },
  { at: "2026-10-30T14:30:00Z", actor: "Kwame Asante", action: "completed the handover.", project: "s5" },
];

// The placeholder samples used before these.
const OLD_PROJECT_IDS = ["p1", "p2", "p3", "p4", "p5", "p6"];
const OLD_CLIENTS = ["Acme Corporation", "Nexus Technologies", "Bloom Studio", "Orion Health"];
const OLD_PEOPLE = ["Sarah Chen", "Olivia Brown", "James Wilson", "Alex Morgan", "Emily Parker", "Daniel Lee"];

async function removeOldSamples(ctx: MutationCtx) {
  let removed = 0;
  for (const legacyId of OLD_PROJECT_IDS) {
    const project = await ctx.db.query("projects").withIndex("by_legacy_id", (q) => q.eq("legacyId", legacyId)).first();
    if (!project || !OLD_CLIENTS.includes(project.client)) continue;
    for (const table of ["feedback", "resources"] as const) {
      const rows = await ctx.db.query(table).withIndex("by_project_legacy", (q) => q.eq("projectLegacyId", legacyId)).collect();
      for (const row of rows) {
        if ("fileId" in row && row.fileId) await ctx.storage.delete(row.fileId);
        await ctx.db.delete(table, row._id);
      }
    }
    await ctx.db.delete("projects", project._id);
    removed++;
  }
  for (const row of await ctx.db.query("activity").collect()) {
    if ((row.client && OLD_CLIENTS.includes(row.client)) || OLD_PEOPLE.includes(row.actor)) await ctx.db.delete("activity", row._id);
  }
  // Old companies go too, unless a real account, invite or project still uses them.
  const users = await ctx.db.query("users").collect();
  const pending = await ctx.db.query("invites").withIndex("by_status", (q) => q.eq("status", "pending")).collect();
  for (const name of OLD_CLIENTS) {
    const client = await findClient(ctx, name);
    if (!client) continue;
    const used = users.some((u) => u.client === name) || pending.some((i) => i.client === name)
      || (await ctx.db.query("projects").withIndex("by_client", (q) => q.eq("client", name)).first());
    if (!used) await ctx.db.delete("clients", client._id);
  }
  return removed;
}

/** Load the sample projects, timelines, feedback, documents and activity. Safe to run again. */
export const load = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oldRemoved = await removeOldSamples(ctx);
    let added = 0;
    for (const p of SAMPLE_PROJECTS) {
      if (await ctx.db.query("projects").withIndex("by_legacy_id", (q) => q.eq("legacyId", p.id)).first()) continue;
      if (!(await findClient(ctx, p.client))) {
        await ctx.db.insert("clients", { name: p.client, key: clientKey(p.client), createdAt: Date.now() });
      }
      await ctx.db.insert("projects", {
        name: p.name, client: p.client, status: p.status, progress: p.progress,
        deadline: p.phases[p.phases.length - 1][2], lead: p.lead, description: p.description,
        symbol: p.client[0].toUpperCase(), color: p.color, legacyId: p.id, updatedAt: Date.now(),
        milestones: p.phases.map(([title, start, end, done]) => ({ title, start, end, done })),
      });
      added++;
      const clientOf = p.client;
      for (const f of SAMPLE_FEEDBACK.filter((f) => f.project === p.id)) {
        await ctx.db.insert("feedback", { author: f.author, client: clientOf, projectLegacyId: p.id, text: f.text, date: f.date, status: f.status, legacyId: f.id, createdAt: Date.parse(`${f.date} 12:00 UTC`) || Date.now() });
      }
      for (const r of SAMPLE_RESOURCES.filter((r) => r.project === p.id)) {
        await ctx.db.insert("resources", { name: r.name, description: r.description, type: r.type, client: clientOf, projectLegacyId: p.id, body: r.body, createdAt: Date.now() });
      }
      for (const a of SAMPLE_ACTIVITY.filter((a) => a.project === p.id)) {
        await ctx.db.insert("activity", { actor: a.actor, action: a.action, context: p.name, client: clientOf, createdAt: Date.parse(a.at) });
      }
    }
    if (added || oldRemoved) {
      await audit(ctx, "Command line", `loaded ${added} sample project${added === 1 ? "" : "s"}${oldRemoved ? ` and removed ${oldRemoved} older placeholder project${oldRemoved === 1 ? "" : "s"}` : ""}.`);
    }
    return { added, oldRemoved };
  },
});
