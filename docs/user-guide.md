# User guide

How to use the Trodas Technologies project portal, for the Trodas team and for clients.

Admins: see also the [admin guide](admin-guide.md). Developers: see the [developer guide](developer-guide.md).

## What the portal is for

The portal is one place to see how projects are going: their status, progress, deadlines, shared documents and client feedback. Everyone works from the same live data. When someone updates a project, everyone signed in sees the change within a second or two, with no reload.

What you can see depends on your access:

| Your access | What you see | What you can change |
|---|---|---|
| **Admin** | Every project, plus the **Admin** page | Everything the team can, plus people, invites and client companies |
| **Trodas team** | Every project, Team, Connection settings | Create, edit and archive projects; update status and progress; share resources; mark feedback as reviewed |
| **Client** | Only your company’s projects, feedback, resources and activity | Share feedback on your projects. Everything else is read-only. |
| **Waiting for access** | A “waiting for access” message | Nothing yet |

## Signing in

Access is by invitation only. There’s no public sign-up.

### Accepting an invitation

1. Open the invitation email and follow its link. It opens the portal’s sign-in page with the heading **Accept your invitation**, and your email address already filled in.
2. Finish the form. Depending on how Trodas has set up sign-in, you’ll choose a password or continue with Google.
3. You land in the portal with the access your invitation gave you.

If that browser is already signed in to the portal as someone else, the page says so. Click **Sign out and accept** to sign them out and show your invitation form, or open the link in a private window.

### Signing in later

Go to the portal’s address and sign in with the same email address you were invited with. You stay signed in on that browser until you sign out.

### “Your account is waiting for access”

You’re signed in, but no admin has given your account access yet. This happens when:

- you signed in with a different email address from the one you were invited with, or
- your invitation was cancelled, or
- you were never invited.

Ask a Trodas admin to invite the exact address you sign in with. The moment they give you access, the portal fills in on its own; you don’t need to reload.

### Your account menu

Your picture (or initials) sits at the top right. Click it to manage your account (name, password, email) or to sign out.

## Finding your way around

The sidebar on the left lists the pages you can use. On a phone, open it with the menu button at the top left.

The top bar shows the page title and a connection badge:

| Badge | Meaning |
|---|---|
| **Live · Convex** | Connected. Changes save straight away and appear for everyone. |
| **Connecting…** | Still connecting. If it stays like this, check your internet connection. |
| **Waiting for access** | Signed in, but your account has no access yet (see above). |
| **Backend offline** | The portal can’t reach its data right now. Changes can’t be saved. |
| **Demo workspace** | The portal isn’t connected to its backend; you’re seeing sample data kept only in this browser. |

## Pages

### Overview

Your starting point.

- **Delivery snapshot:** how many projects are active, how many are overdue, and how many are due in the next seven days (dates follow Ghana time), plus a bar showing projects by status.
- **Delivery timeline:** a chart of each active project’s phases across the coming months. Phases are coloured **Done**, **In progress**, **Overdue** or **Upcoming**, a red line marks today, and the right-hand column shows the phase each project is in now. Choose a project name to open it.
- **Project portfolio:** the project table, with status tabs and a search box (searches project name, client and lead). Under each client name is the project’s current phase.
- **Latest client feedback:** the newest feedback that still needs review.
- **Delivery deadlines:** the next three deadlines of unfinished projects.
- **Recent activity:** what changed recently, such as projects created, status updates, and feedback reviewed.

### Projects

The full project list, with the same status tabs and search. Click a project’s name to open its details: client, status, deadline, lead, description, progress, and any shared resources.

**Export CSV** downloads every project you can see as a spreadsheet file (`trodas-projects.csv`), with name, client, status, progress, lead and deadline.

Team members also see an **Archived** tab once any project has been archived.

### Resources

Files and documents shared on projects: briefs, plans, checklists, contracts and so on. **Open** opens an uploaded file (a PDF, for example) in a new tab; **Download** saves a written document as a text file. Clients see only their company’s resources. Team members can **+ Add resource** and **Remove** resources.

### Client feedback

Feedback clients have shared on projects, newest first. Clients can **+ Share feedback**. Team members can **Mark as reviewed**, and clients see each item’s status.

### Team *(team and admins)*

A card for everyone with a Trodas team or admin account, showing how many active projects they lead. Project leads named on projects who don’t have a portal account appear too, marked “no portal account”. **View projects** shows that person’s projects.

### Admin *(admins only)*

Invites, access and client companies. See the [admin guide](admin-guide.md).

### Connection settings *(team and admins)*

Shows whether the portal is connected to its backend, and which one.

## Everyday tasks (team)

### Create a project

1. On **Overview** or **Projects**, click **New project**.
2. Fill in the name, client, deadline, project lead and a short description. The lead list shows everyone with a Trodas team or admin account, and starts on you.
3. Click **Create project**. It starts as *In progress* at 0%.

**Client** suggests names from the client list as you type. Pick one exactly: team members can only create projects for clients already on the list, so a misspelt name can’t hide a project from its client. If the client is new, ask an admin to add it. Admins can type a new client name here, and it’s added to the list.

### Update a project’s status

1. Open the project (click its name).
2. Under **Update delivery status**, choose the status and enter the progress (0–100).
3. Click **Save update**.

The four statuses are **In progress**, **In review**, **At risk** and **Completed**. Choosing *Completed* always sets progress to 100%. Every update appears in **Recent activity**.

### Follow and update the delivery timeline

Every project has a timeline of phases, such as Discovery, Design, Build, Testing and Launch, each with its own dates. Open a project to see it under **Delivery timeline**: each phase shows its dates, how many days it runs, and whether it’s done, in progress, overdue or upcoming. New projects start with these five phases spread from today to the deadline.

Team members can:

- click **Mark done** when a phase is finished (or **Reopen** to undo it). It’s recorded in Recent activity.
- click **Edit timeline** to rename phases, change their dates, tick them done, add phases (**+ Add phase**, up to 10) or remove them (**×**), then **Save timeline**.

Clients see the same timeline, read-only.

### Edit a project’s details

Open the project and expand **Edit project details**. You can change the name, client, deadline, lead and description, then click **Save details**. If you change the client, the project’s feedback and resources move with it: the new client sees them, and the old client no longer does.

### Archive or restore a project

Open the project and click **Archive project**. It leaves every list (and the client’s view) but isn’t deleted. To find it again, go to **Projects → Archived**, open it, and click **Restore project**.

Admins can also **Delete permanently** an archived project. That deletes its feedback and shared resources too, and can’t be undone.

### Share a resource

1. On **Resources**, click **+ Add resource**.
2. Choose the project, and give it a title, type and short description.
3. Either choose a **File** (PDF, Word, image… up to 25 MB), or write the content in **Written content**.
4. Click **Add resource**.

Everyone on that project sees it straight away, including the client. **Remove** takes it away again; it asks you to confirm first.

### Review client feedback

On **Client feedback**, click **Mark as reviewed** on an item once you’ve dealt with it. The overview’s feedback count goes down, and the client sees it as *Reviewed*.

### See what a client sees

Use the **Team view / Client view** switch in the top bar, or **Preview client view** in the sidebar. The banner at the top has a list to choose which client to preview. The preview is read-only. Switch back to **Team view** to make changes again.

## For clients

When you sign in you see only your company’s projects, with a banner showing your company name. You can:

- follow each project’s status, progress and deadline,
- open a project for its description and shared documents,
- open and download shared resources,
- share feedback on your projects (**Client feedback → + Share feedback**: pick the project, write your message),
- see each feedback item’s status (*Needs review* or *Reviewed*),
- see recent activity on your projects.

Apart from feedback, your view is read-only. To ask for a change to a project, contact your Trodas project lead or share feedback on it.

## Questions

**I updated a project but a colleague doesn’t see it.**
Check that both of you see **Live · Convex** in the top bar. Changes appear within a second or two for everyone connected.

**I can’t find a client in the New project form.**
It isn’t on the client list yet. Ask an admin to add it on the Admin page.

**I signed in but see nothing.**
Your account is waiting for access. See [“Your account is waiting for access”](#your-account-is-waiting-for-access).

**I see “Demo workspace”.**
The portal isn’t connected to its backend. Anything you change is kept only in your browser. Tell the person who maintains the portal.
