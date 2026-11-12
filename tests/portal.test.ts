// Access rules and features of the portal's Convex functions, run in memory (npm test).
// Each test starts from an empty database with: an admin (Ada), a team member (Tom),
// two clients from different companies (Jane at Acme, Bob at Nexus), and two projects.
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import schema from "../convex/schema";
import { api, internal } from "../convex/_generated/api";

const modules = import.meta.glob("../convex/**/*.*s");

type T = ReturnType<typeof convexTest>;
const as = (t: T, id: string, name: string, email: string) =>
  t.withIdentity({ tokenIdentifier: `https://test|${id}`, subject: id, issuer: "https://test", name, email });

async function setup() {
  const t = convexTest(schema, modules);
  const ada = as(t, "ada", "Ada Admin", "ada@trodas.net");
  const tom = as(t, "tom", "Tom Team", "tom@trodas.net");
  const jane = as(t, "jane", "Jane Acme", "jane@acme.com");
  const bob = as(t, "bob", "Bob Nexus", "bob@nexus.com");
  const newbie = as(t, "nina", "Nina New", "Nina@Acme.com");
  const stranger = as(t, "sam", "Sam Stranger", "sam@example.com");

  await t.mutation(internal.projects.importLegacy, {
    projects: [
      { id: "p1", name: "Website redesign", client: "Acme Corporation", status: "In progress", progress: 40, deadline: "2026-12-01", lead: "Tom Team" },
      { id: "p2", name: "Cloud move", client: "Nexus Technologies", status: "At risk", progress: 20, deadline: "2026-12-10", lead: "Ada Admin" },
    ],
  });
  for (const who of [ada, tom, jane, bob]) await who.mutation(api.users.store, {});
  await t.mutation(internal.users.grantAccess, { email: "ada@trodas.net", role: "admin" });
  await t.mutation(internal.users.grantAccess, { email: "tom@trodas.net", role: "team" });
  await t.mutation(internal.users.grantAccess, { email: "jane@acme.com", role: "client", client: "Acme Corporation" });
  await t.mutation(internal.users.grantAccess, { email: "bob@nexus.com", role: "client", client: "Nexus Technologies" });
  return { t, ada, tom, jane, bob, newbie, stranger };
}

const names = (rows: { name: string }[]) => rows.map((r) => r.name).sort();
const projectId = async (who: { query: T["query"] }, name: string) =>
  (await who.query(api.projects.list, {})).find((p) => p.name === name)!._id;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sign-in and access", () => {
  test("signed-out callers get nothing", async () => {
    const { t } = await setup();
    expect(await t.query(api.users.current, {})).toBeNull();
    await expect(t.query(api.projects.list, {})).rejects.toThrow(/Sign in first/);
    await expect(t.query(api.resources.list, {})).rejects.toThrow(/Sign in first/);
  });

  test("new sign-ins wait for access", async () => {
    const { stranger } = await setup();
    await stranger.mutation(api.users.store, {});
    expect((await stranger.query(api.users.current, {}))?.role).toBeNull();
    await expect(stranger.query(api.projects.list, {})).rejects.toThrow(/waiting for access/);
  });

  test("clients see only their own company; staff see everything", async () => {
    const { ada, tom, jane, bob } = await setup();
    expect(names(await jane.query(api.projects.list, {}))).toEqual(["Website redesign"]);
    expect(names(await bob.query(api.projects.list, {}))).toEqual(["Cloud move"]);
    expect(names(await tom.query(api.projects.list, {}))).toEqual(["Cloud move", "Website redesign"]);
    expect(names(await ada.query(api.projects.list, {}))).toEqual(["Cloud move", "Website redesign"]);
  });

  test("admin-only functions refuse the team and clients", async () => {
    const { tom, jane } = await setup();
    for (const who of [tom, jane]) {
      await expect(who.query(api.users.list, {})).rejects.toThrow(/Only admins/);
      await expect(who.query(api.audit.list, {})).rejects.toThrow(/Only admins/);
      await expect(who.query(api.invites.list, {})).rejects.toThrow(/Only admins/);
      await expect(who.mutation(api.clients.create, { name: "X" })).rejects.toThrow(/Only admins/);
    }
  });

  test("the staff list is for staff and lists only admins and team", async () => {
    const { tom, jane } = await setup();
    expect(names(await tom.query(api.users.staff, {}))).toEqual(["Ada Admin", "Tom Team"]);
    await expect(jane.query(api.users.staff, {})).rejects.toThrow(/Only the Trodas team/);
  });
});

describe("changing access", () => {
  test("admins can't change their own access, and only admins change anyone's", async () => {
    const { ada, tom } = await setup();
    const adaId = (await ada.query(api.users.current, {}))!._id;
    const tomId = (await tom.query(api.users.current, {}))!._id;
    await expect(ada.mutation(api.users.setAccess, { userId: adaId, role: "team" })).rejects.toThrow(/own access/);
    await expect(tom.mutation(api.users.setAccess, { userId: adaId, role: "none" })).rejects.toThrow(/Only admins/);
    await ada.mutation(api.users.setAccess, { userId: tomId, role: "client", client: "acme CORPORATION" });
    expect(await tom.query(api.users.current, {})).toMatchObject({ role: "client", client: "Acme Corporation" });
    await expect(ada.mutation(api.users.setAccess, { userId: tomId, role: "client", client: "Nope Inc" })).rejects.toThrow(/isn’t on the client list/);
  });

  test("changes are recorded in the access log", async () => {
    const { ada, tom } = await setup();
    const tomId = (await tom.query(api.users.current, {}))!._id;
    await ada.mutation(api.users.setAccess, { userId: tomId, role: "admin" });
    const log = await ada.query(api.audit.list, {});
    expect(log[0].action).toBe("changed Tom Team’s access from Trodas team to admin.");
  });
});

describe("invites", () => {
  test("without a Clerk key, the invite is saved and applied on first sign-in", async () => {
    const { ada, newbie } = await setup();
    const result = await ada.action(api.invites.send, { email: " nina@acme.com ", role: "client", client: "Acme Corporation" });
    expect(result).toEqual({ emailed: false, reason: "no-key" });
    expect((await ada.query(api.invites.list, {})).pending.map((i) => i.email)).toEqual(["nina@acme.com"]);
    await newbie.mutation(api.users.store, {}); // signs in as Nina@Acme.com: capitals don't matter
    expect(await newbie.query(api.users.current, {})).toMatchObject({ role: "client", client: "Acme Corporation" });
    expect((await ada.query(api.invites.list, {})).pending).toEqual([]);
    await expect(ada.action(api.invites.send, { email: "nina@acme.com", role: "team" })).rejects.toThrow(/already has an account/);
  });

  test("with a Clerk key, Clerk is asked to email it, and cancelling revokes it there", async () => {
    const { ada, newbie } = await setup();
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_fake");
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method} ${url}`);
      return new Response(JSON.stringify({ id: "inv_1" }), { status: 200 });
    });
    expect(await ada.action(api.invites.send, { email: "nina@acme.com", role: "team", redirectUrl: "http://localhost:5500/login.html" })).toEqual({ emailed: true });
    const [invite] = (await ada.query(api.invites.list, {})).pending;
    expect(invite).toMatchObject({ emailSent: true });
    expect(await ada.action(api.invites.revoke, { id: invite._id })).toEqual({ clerkRevoked: true });
    expect(calls).toEqual(["POST https://api.clerk.com/v1/invitations", "POST https://api.clerk.com/v1/invitations/inv_1/revoke"]);
    await newbie.mutation(api.users.store, {});
    expect((await newbie.query(api.users.current, {}))?.role).toBeNull(); // cancelled: no access
  });
});

describe("client companies", () => {
  test("renaming follows everywhere; renaming onto another client merges", async () => {
    const { ada, jane } = await setup();
    const clients = await ada.query(api.clients.list, {});
    const acme = clients.find((c) => c.name === "Acme Corporation")!;
    await ada.mutation(api.clients.rename, { id: acme._id, name: "Acme Group" });
    expect(await jane.query(api.users.current, {})).toMatchObject({ client: "Acme Group" });
    expect((await jane.query(api.projects.list, {}))[0].client).toBe("Acme Group");

    const temp = await ada.mutation(api.clients.create, { name: "Temp Co" });
    expect(await ada.mutation(api.clients.rename, { id: temp, name: "acme group" })).toEqual({ merged: true });
    expect(names(await ada.query(api.clients.list, {}))).toEqual(["Acme Group", "Nexus Technologies"]);
    await expect(ada.mutation(api.clients.remove, { id: acme._id })).rejects.toThrow(/still has projects/);
  });

  test("the team picks existing clients; admins may add one while creating a project", async () => {
    const { ada, tom } = await setup();
    const base = { deadline: "2026-12-20", lead: "Tom Team", description: "" };
    await expect(tom.mutation(api.projects.create, { ...base, name: "A", client: "Brand New Co" })).rejects.toThrow(/isn’t on the client list/);
    await tom.mutation(api.projects.create, { ...base, name: "B", client: "  acme corporation " });
    expect((await tom.query(api.projects.list, {})).find((p) => p.name === "B")?.client).toBe("Acme Corporation");
    await ada.mutation(api.projects.create, { ...base, name: "C", client: "Brand New Co" });
    expect(names(await ada.query(api.clients.list, {}))).toContain("Brand New Co");
  });
});

describe("projects", () => {
  test("editing a project's client moves its feedback and resources with it", async () => {
    const { tom, jane, bob } = await setup();
    await jane.mutation(api.feedback.create, { project: "p1", text: "Looks great" });
    await tom.mutation(api.resources.create, { project: "p1", name: "Brief", type: "Brief", description: "", body: "Scope" });
    const id = await projectId(tom, "Website redesign");
    await tom.mutation(api.projects.edit, { id, name: "Website rebuild", client: "Nexus Technologies", deadline: "2027-01-15", lead: "Ada Admin", description: "Moved" });
    expect(await jane.query(api.projects.list, {})).toEqual([]);
    expect(names(await bob.query(api.projects.list, {}))).toEqual(["Cloud move", "Website rebuild"]);
    expect((await bob.query(api.feedback.list, {})).map((f) => f.text)).toEqual(["Looks great"]);
    expect(names(await bob.query(api.resources.list, {}))).toEqual(["Brief"]);
    expect(await jane.query(api.resources.list, {})).toEqual([]);
  });

  test("clients can't edit, archive or delete", async () => {
    const { tom, jane } = await setup();
    const id = await projectId(tom, "Website redesign");
    await expect(jane.mutation(api.projects.edit, { id, name: "X", client: "Acme Corporation", deadline: "2026-12-01", lead: "Tom Team", description: "" })).rejects.toThrow(/Only the Trodas team/);
    await expect(jane.mutation(api.projects.setArchived, { id, archived: true })).rejects.toThrow(/Only the Trodas team/);
    await expect(jane.mutation(api.projects.remove, { id })).rejects.toThrow(/Only admins/);
  });

  test("archived projects disappear for clients; only admins delete, and only archived projects", async () => {
    const { ada, tom, jane } = await setup();
    await jane.mutation(api.feedback.create, { project: "p1", text: "Hi" });
    await tom.mutation(api.resources.create, { project: "p1", name: "Brief", type: "Brief", description: "", body: "Scope" });
    const id = await projectId(tom, "Website redesign");
    await expect(ada.mutation(api.projects.remove, { id })).rejects.toThrow(/Archive the project/);
    await tom.mutation(api.projects.setArchived, { id, archived: true });
    expect(await jane.query(api.projects.list, {})).toEqual([]);
    expect((await tom.query(api.projects.list, {})).find((p) => p._id === id)?.archived).toBe(true);
    await expect(jane.mutation(api.feedback.create, { project: "p1", text: "Still there?" })).rejects.toThrow(/isn’t available/);
    await expect(tom.mutation(api.projects.remove, { id })).rejects.toThrow(/Only admins/);
    await ada.mutation(api.projects.remove, { id });
    expect(names(await ada.query(api.projects.list, {}))).toEqual(["Cloud move"]);
    expect(await ada.query(api.feedback.list, {})).toEqual([]);
    expect(await ada.query(api.resources.list, {})).toEqual([]);
    expect((await ada.query(api.audit.list, {}))[0].action).toMatch(/^deleted the project Website redesign/);
  });
});

describe("feedback", () => {
  test("clients comment only on their own projects, under their own name", async () => {
    const { tom, jane } = await setup();
    await jane.mutation(api.feedback.create, { project: "p1", text: "  Love it  " });
    const [item] = await tom.query(api.feedback.list, {});
    expect(item).toMatchObject({ author: "Jane Acme", client: "Acme Corporation", text: "Love it", status: "Needs review" });
    await expect(jane.mutation(api.feedback.create, { project: "p2", text: "Sneaky" })).rejects.toThrow(/isn’t available/);
  });

  test("only admins delete feedback", async () => {
    const { ada, tom, jane } = await setup();
    const id = await jane.mutation(api.feedback.create, { project: "p1", text: "Hello" });
    await expect(tom.mutation(api.feedback.remove, { id })).rejects.toThrow(/Only admins/);
    await ada.mutation(api.feedback.remove, { id });
    expect(await ada.query(api.feedback.list, {})).toEqual([]);
  });
});

describe("resources", () => {
  test("the team shares text and files; each client sees only their own", async () => {
    const { t, tom, jane, bob } = await setup();
    await tom.mutation(api.resources.create, { project: "p1", name: "Plan", type: "Plan", description: "Steps", body: "1. Start" });
    const fileId = await t.run((ctx) => ctx.storage.store(new Blob(["%PDF-1.4 sample"], { type: "application/pdf" })));
    await tom.mutation(api.resources.create, { project: "p1", name: "Contract", type: "Contract", description: "", fileId, fileName: "contract.pdf" });

    const seen = await jane.query(api.resources.list, {});
    expect(names(seen)).toEqual(["Contract", "Plan"]);
    const file = seen.find((r) => r.name === "Contract")!;
    expect(file).toMatchObject({ fileName: "contract.pdf", fileType: "application/pdf", fileSize: 15 });
    expect(typeof file.url).toBe("string");
    expect(await bob.query(api.resources.list, {})).toEqual([]);

    await expect(jane.mutation(api.resources.create, { project: "p1", name: "X", type: "Notes", description: "", body: "x" })).rejects.toThrow(/Only the Trodas team/);
    await tom.mutation(api.resources.remove, { id: file._id });
    expect(await t.run((ctx) => ctx.storage.getUrl(fileId))).toBeNull(); // the stored file is gone too
  });

  test("a resource needs a file or written content", async () => {
    const { tom } = await setup();
    await expect(tom.mutation(api.resources.create, { project: "p1", name: "Empty", type: "Notes", description: "" })).rejects.toThrow(/document text/);
  });
});

describe("timelines", () => {
  test("new projects get standard phases ending on the deadline", async () => {
    const { tom } = await setup();
    const id = await tom.mutation(api.projects.create, { name: "App", client: "Acme Corporation", deadline: "2099-03-31", lead: "Tom Team", description: "" });
    const project = (await tom.query(api.projects.list, {})).find((p) => p._id === id)!;
    expect(project.milestones!.map((m) => m.title)).toEqual(["Discovery", "Design", "Build", "Testing", "Launch"]);
    expect(project.milestones!.at(-1)!.end).toBe("2099-03-31");
    for (let i = 1; i < project.milestones!.length; i++) expect(project.milestones![i].start > project.milestones![i - 1].end).toBe(true);
  });

  test("the team marks phases done and edits the timeline; clients can't", async () => {
    const { tom, jane } = await setup();
    const id = await projectId(tom, "Website redesign");
    const phases = [
      { title: "Plan", start: "2026-11-01", end: "2026-11-10", done: false },
      { title: "Build", start: "2026-11-11", end: "2026-12-01", done: false },
    ];
    await tom.mutation(api.projects.setTimeline, { id, milestones: phases });
    await tom.mutation(api.projects.setMilestoneDone, { id, index: 0, done: true });
    expect((await jane.query(api.projects.list, {}))[0].milestones).toMatchObject([{ title: "Plan", done: true }, { title: "Build", done: false }]);
    expect((await jane.query(api.activity.list, {}))[0].action).toBe("completed the Plan phase.");
    await expect(jane.mutation(api.projects.setMilestoneDone, { id, index: 1, done: true })).rejects.toThrow(/Only the Trodas team/);
    await expect(tom.mutation(api.projects.setTimeline, { id, milestones: [{ title: "Oops", start: "2026-12-01", end: "2026-11-01", done: false }] })).rejects.toThrow(/ends before it starts/);
  });
});

describe("command line and samples", () => {
  test("granting an email that hasn't signed in pre-approves it", async () => {
    const { t, ada, newbie } = await setup();
    const result = await t.mutation(internal.users.grantAccess, { email: "nina@acme.com", role: "admin" });
    expect(result).toMatchObject({ updated: 0, preApproved: true, role: "admin" });
    expect((await ada.query(api.invites.list, {})).pending).toMatchObject([{ email: "nina@acme.com", role: "admin", invitedByName: "Command line", emailSent: false }]);
    await newbie.mutation(api.users.store, {});
    expect((await newbie.query(api.users.current, {}))?.role).toBe("admin");
    expect((await ada.query(api.audit.list, {}))[0].action).toBe("accepted a pre-approved invitation and got admin.");
  });

  test("sample data loads once, with timelines, and replaces the old placeholders", async () => {
    const { t, ada } = await setup();
    await t.mutation(internal.projects.importLegacy, { projects: [{ id: "p3", name: "Customer portal", client: "Bloom Studio", status: "In review", progress: 90, deadline: "2026-11-12", lead: "Olivia Brown" }] });
    const first = await t.mutation(internal.samples.load, {});
    expect(first).toEqual({ added: 6, oldRemoved: 3 }); // p1 and p2 from setup, plus p3
    expect(await t.mutation(internal.samples.load, {})).toEqual({ added: 0, oldRemoved: 0 });
    const projects = await ada.query(api.projects.list, {});
    expect(projects.some((p) => p.client === "Bloom Studio")).toBe(false);
    const courier = projects.find((p) => p.client === "Sankofa Delivery")!;
    expect(courier.milestones).toHaveLength(5);
    expect(courier.deadline).toBe("2027-01-29");
    expect(names(await ada.query(api.clients.list, {}))).toContain("Osu Bakery & Café");
  });
});

describe("activity", () => {
  test("clients see only their company's activity", async () => {
    const { tom, jane, bob } = await setup();
    await tom.mutation(api.projects.update, { id: await projectId(tom, "Website redesign"), progress: 60 });
    await tom.mutation(api.projects.update, { id: await projectId(tom, "Cloud move"), progress: 30 });
    expect((await jane.query(api.activity.list, {})).map((a) => a.context)).toEqual(["Website redesign"]);
    expect((await bob.query(api.activity.list, {})).map((a) => a.context)).toEqual(["Cloud move"]);
  });
});
