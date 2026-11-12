# Admin guide

How to manage people, access and client companies in the Trodas project portal.

Admins have everything the Trodas team has (see the [user guide](user-guide.md)), plus the **Admin** page in the sidebar. The rules on this page are enforced by the portal’s backend, not just hidden in the browser, so nobody can work around them.

## Access levels

| Access | Who it’s for | They can |
|---|---|---|
| **Admin** | People who manage the portal | Everything, including this page |
| **Trodas team** | Trodas staff | See and edit every project, review feedback |
| **Client · *company*** | People at a client company | See only that company’s projects, feedback, resources and activity, read-only |
| **Waiting for access** | Anyone not given access yet | See a “waiting for access” message, nothing else |

Keep at least two admins, so someone can still manage access if one is away or loses their account.

## The Admin page

Across the top, four figures show how many **Admins**, **Trodas team** members and **Client accounts** there are, and how many people are **Waiting**: signed in without access, or invited but not signed in yet. Waiting is highlighted when it isn’t zero.

Below are three tabs: **People**, **Client companies** and **Access log**. Changes take effect straight away, including for people who already have the portal open.

- **People:** the invite form and pending invites, then everyone who has signed in, each with a coloured role badge and when they last signed in. Filter the list with **Everyone / Admins / Team / Clients / Waiting**, or search by name, email or company.
- **Client companies:** a card per company with its number of projects and client accounts, and up to three active projects. Choose a project to open it.
- **Access log:** changes grouped by day (Today, Yesterday, then dates), each with an icon for its kind: invites, access changes, client companies, deletions.

## Inviting someone

1. Open **Admin → People**.
2. Under **Invite someone**, enter their email address and choose their **Access**.
3. Click **Send invite**. If the button reads **Save invite**, see [“When invites aren’t emailed”](#when-invites-arent-emailed).

They receive an email from Clerk, the sign-in service, with a link to the portal. When they accept and first sign in, they get the access you chose. There’s no second step for you.

Use the exact address they’ll sign in with. Access is matched by email address (capital letters don’t matter). If they sign in with a different address, they’ll just see “waiting for access”.

### Pending invites

Invites that haven’t been accepted are listed under **Invited, not signed in yet**, showing the access you chose, who invited them, and whether the email went out:

- **Invite emailed:** Clerk sent the email.
- **Not emailed:** the access is saved, but no email went out. Invite them from the Clerk dashboard, or fix the reason and invite again.

**Changing a pending invite:** invite the same address again with the new access. The old email link stops working, and a new one is sent.

**Cancel invite** withdraws it. Their access is removed even if they still have the email: if they sign up anyway, they’ll only see “waiting for access”.

### Someone who already has an account

You can’t invite an address that already belongs to a portal account. Change that person’s access in the **People** list instead.

### When invites aren’t emailed

The button reads **Save invite**, and the page says invites can’t be emailed, when the portal’s backend doesn’t have the Clerk secret key. The person who maintains the portal sets it up once; see the [developer guide](developer-guide.md#5-email-invites-from-the-admin-page).

Until then, invites still work in two steps:

1. Click **Save invite** in the portal. This decides their access.
2. In the Clerk dashboard, go to **Users → Invitations** and invite the same email address.

When they accept and sign in, they get the access you saved.

## Changing someone’s access

In **Admin → People**, every person who has signed in is listed with the date they last signed in. Change the dropdown next to their name. It applies immediately, and the change is recorded in the access log.

- **You can’t change your own access.** Ask another admin. This stops you locking yourself out by accident.
- **The portal won’t remove the last admin.**
- **Client access** needs a company from the client list. Add the company on the **Client companies** tab first if it isn’t there.

### Removing someone’s access

Set them to **Waiting for access**. They can still sign in but see nothing, and their open pages empty straight away.

To remove their sign-in completely, also delete the user in the Clerk dashboard (**Users**, open the person, **Delete user**). Their row stays in the portal’s People list with no access, which is harmless.

## Client companies

**Admin → Client companies** is the list of client companies. Projects, client accounts and invites all pick from this list. Matching ignores capital letters and extra spaces, so “osu bakery & café” and “Osu Bakery & Café” are the same client. That stops a typo from hiding a client’s projects from them.

Each client shows how many projects and client accounts use it.

| To | Do this |
|---|---|
| Add a client | Type the name under **New client**, then **Add client**. |
| Fix a name | **Rename**, edit, **Save**. Every project, client account, invite, feedback item, resource and activity entry using the old name follows. |
| Merge two clients | Rename one to the other’s exact name. Everything moves to the remaining client, and the renamed one disappears. |
| Remove a client | **Remove** appears only when nothing uses the client: no projects, client accounts or pending invites. |

Merging can’t be undone with one click. To split a merged client again, you’d have to move projects and accounts back by hand.

## Deleting things

Admins can delete two kinds of data that the team can only archive or review:

- **Projects:** the team archives a project first (open it → **Archive project**). Then an admin opens it under **Projects → Archived** and clicks **Delete permanently**. Its feedback, shared resources and uploaded files are deleted too. This can’t be undone, so it asks you to confirm.
- **Feedback:** on **Client feedback**, admins see **Delete** on each item. Use it for sample feedback or something posted by mistake.

Both appear in the access log.

## Access log

**Admin → Access log** lists, newest first: invites sent, changed and cancelled; invites accepted; access changes; clients added, renamed, merged and removed; and projects and feedback deleted. Each entry says who did it and when. Changes made from the command line appear as **Command line**.

Only admins see the access log. It’s separate from the **Recent activity** feed, which clients can see for their own projects.

## Common situations

**A new client contact needs access.**
Make sure their company is on the **Client companies** tab, then invite them with **Client · *company***.

**A team member is leaving.**
Set them to **Waiting for access** in **People**, then delete their user in the Clerk dashboard.

**Someone says they only see “waiting for access”.**
Check the **People** list for the address they signed in with. If they’re there, give them access. If their invite is still pending under a different address, either cancel it and invite the address they used, or ask them to sign out and sign in with the invited address.

**A client was set up under the wrong company name.**
Rename the client on the **Client companies** tab, or merge it into the right one.

**No admin can sign in any more.**
Someone with access to the portal’s Convex project can restore an admin from the command line; see [Recovering admin access](developer-guide.md#recovering-admin-access).
