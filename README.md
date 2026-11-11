# Trodas Technologies project portal

Internal workspace for project status, deadlines, resources, and client feedback. Team members see and edit every project; each client sees only their own company’s projects, read-only.

Sign-in is handled by [Clerk](https://clerk.com) (invite-only) and projects are stored in [Convex](https://convex.dev), with changes showing up live for everyone signed in. The front end is still plain HTML, CSS, and JavaScript with no build step.

## Run it

Double-click `start.bat`, or from this folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Then open http://localhost:5500. You’ll be sent to `login.html` until you sign in.

Add `-NoBrowser` to start the server without opening a browser tab. `serve.ps1` only serves the portal’s files now. It no longer has a `/projects` API, and it refuses to serve `node_modules`, `convex`, `data`, `scripts`, and `.env.local`.

Sign-in needs the page to be served over http, so opening `index.html` straight from disk no longer works. Until Clerk is configured, the login page shows what’s missing instead of the sign-in form. Until `convexUrl` is set, the portal runs as a demo with projects saved in your browser.

## Set up Clerk + Convex (one time)

### 1. Clerk

1. Create an application at https://dashboard.clerk.com (email sign-in is enough).
2. **API keys** → copy the **Publishable key** into `config.js` → `clerkPublishableKey`.
3. **Configure → Access mode** → choose **Invite-only**, so only invited people can join. Invite team members and clients from **Users → Invitations**. (If you need to create your own first account, leave it on Open until you’ve signed up, then switch.)
4. **Integrations → Convex** → activate it, and copy the **Frontend API URL** it shows (looks like `https://your-app-12.clerk.accounts.dev`).
5. **Sessions → Customize session token** → add these claims, so Convex knows each person’s name and email (the People & access page and `convex:grant` rely on the email):

   ```json
   {
     "name": "{{user.full_name}}",
     "email": "{{user.primary_email_address}}",
     "picture": "{{user.image_url}}"
   }
   ```

If invitees land on a Clerk-hosted page after accepting, set the app’s home URL under **Configure → Paths** to `http://localhost:5500/`.

### 2. Convex

```powershell
npm install
npx convex dev
```

- The first run asks you to log in and create a project. It then stops because `CLERK_JWT_ISSUER_DOMAIN` isn’t set yet. Set it to the Frontend API URL from step 1.4, then run `npx convex dev` again:

  ```powershell
  npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-app-12.clerk.accounts.dev
  ```

  (Or add it in the Convex dashboard → **Settings → Environment Variables**.)
- It writes `.env.local` (with `CONVEX_URL`) and generates `convex/_generated/`. Commit `convex/_generated/`; `.env.local` stays out of git.
- Copy the `CONVEX_URL` value into `config.js` → `convexUrl`.
- Leave `npx convex dev` running while you develop; it syncs everything in `convex/`.

### 3. Bring your data over (once)

```powershell
npm run convex:import-all
```

This copies the projects from `data/projects.json` along with initial client feedback, recent activity, and project resources into Convex. Running it again skips items that are already there. Use `npm run convex:import-all -- --prod` for your production deployment. You can also import just projects via `npm run convex:import-projects`.

### 4. Give yourself team access (once)

Everyone starts with no access, so nobody can open the People & access page yet. Sign in to the portal once (you’ll see “Your account is waiting for access”), then run:

```powershell
npm run convex:grant -- you@yourcompany.com team
```

Reload the portal. From then on, team members grant access to everyone else on the **People & access** page. The command also works for clients (`npm run convex:grant -- jane@acme.com client "Acme Corporation"`) and for removing access (`… none`). Add `--prod` for your production deployment.

### 5. Check it

```powershell
npm run check:integrations
```

This checks that Clerk and Convex are wired together. It confirms that `config.js`, `.env.local` and Convex’s `CLERK_JWT_ISSUER_DOMAIN` all point to the same places, and that Clerk publishes its signing keys and is invite-only. It also checks that every function in `convex/` is deployed, and that Convex refuses requests with no sign-in or a forged one. It changes nothing; each failure says how to fix it. Add `-- --prod` to check production. Run it after changing anything in `convex/`, Clerk or `config.js`.

Then open the portal: the top bar should say **Live · Convex** and list your projects. In the Convex dashboard, **Data → users** has a row for each person who has signed in, and **Data → projects** holds the projects.

If the portal says Convex didn’t accept your sign-in, the Clerk ↔ Convex link isn’t set up yet: recheck step 1.4 and `CLERK_JWT_ISSUER_DOMAIN`. If it stays on “Still connecting to Convex…”, check `convexUrl` in `config.js`. If people show up as “Portal user” with no email, recheck step 1.5.

## Roles

| Access | Can see | Can change |
|---|---|---|
| Trodas team | Every project, People & access, Team, Connection settings | Projects, and other people’s access |
| Client · *company* | Only projects whose client is exactly that company | Nothing (read-only) |
| Waiting for access (everyone at first) | A “waiting for access” message | Nothing |

- Invite people in Clerk, then set their access on **People & access** after they first sign in. Changes apply immediately, even on pages that are already open.
- Client companies are picked from the clients on existing projects, so the names always match.
- You can’t change your own access; another team member has to. That keeps the last team member from locking everyone out.
- Team members can still use **Team view / Client view** to preview what a client sees. Client accounts are locked to their own view.
- Convex enforces all of this in `convex/access.ts`; hiding pages in the browser is only for convenience.

## How sign-in works

| File | Role |
|---|---|
| `login.html`, `login.css`, `login.js` | Login page. Mounts Clerk’s sign-in form, styled with the portal’s colours. No sign-up link (invite-only). |
| `auth.js` | Loads Clerk from your Clerk Frontend API, keeps redirects on this site, and connects Convex with the Clerk token. |
| `session.js` | Keeps `index.html` behind sign-in, shows the signed-in person in the sidebar, mounts Clerk’s account menu (sign out, manage account) in the top bar, and hands the Convex connection to `app.js`. |
| `app.js` | The portal. Reads your access from `users:current`, subscribes to `projects:list` for live updates, saves through `projects:create` and `projects:update`, and runs the People & access page. |
| `convex/auth.config.ts` | Tells Convex to trust tokens from your Clerk instance. |
| `convex/schema.ts` | `users`, `projects`, `feedback`, `activity`, and `resources` tables. |
| `convex/access.ts` | The access rules every function uses: signed in, has access, is on the team. |
| `convex/users.ts` | `users:store` (called after each sign-in), `users:current`, `users:list` and `users:setAccess` (team only), and the internal `users:grantAccess` used by `convex:grant`. |
| `convex/projects.ts` | `projects:list` (all for the team, own company for clients), `projects:create` and `projects:update` (team only), and the internal `projects:importLegacy`. |
| `convex/feedback.ts` | `feedback:list` (all for the team, own company for clients), `feedback:review` (team only), `feedback:create`, and `feedback:importLegacy`. |
| `convex/activity.ts` | `activity:list` (all for team, company-scoped for clients) and `activity:importLegacy`. Activity is written by the server inside the mutations that make each change, so nothing in the browser can add entries. |
| `convex/resources.ts` | `resources:list` (all for team, company-scoped for clients), `resources:create` (team only), and `resources:importLegacy`. |
| `scripts/` | `convex:import-all`, `convex:import-projects`, and `convex:grant`, which run internal functions with your deployment’s admin access, and `check:integrations`, which only reads. |

The redirect to the login page happens in the browser and is not a security boundary by itself. Data is protected because every Convex function checks who is calling and what access they have before returning or changing anything.

## What’s included

- Overview with delivery snapshot, filters, search, and deadline tiles
- Create projects, update status/progress, review client feedback, share resources, and log live activity — all stored in Convex and shared in real time
- Resource downloads, feedback review, team filtering, CSV export
- Team and client roles enforced by Convex, managed on the People & access page
- Client preview for team members
- Demo mode in browser storage while `convexUrl` is empty

Brand reference: https://trodas.net/. Primary blue `#0040C1`. Inter and Inter Tight via Google Fonts.
