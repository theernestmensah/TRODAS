# Trodas Technologies project portal

One place for the Trodas team and its clients to follow projects: status, progress, delivery timelines, deadlines, shared documents and client feedback, updated live for everyone signed in.

- **Admins** invite people, decide what they can see, and manage client companies.
- **The Trodas team** sees and updates every project.
- **Clients** see only their own company’s projects, read-only.

Sign-in is handled by [Clerk](https://clerk.com) (invite-only); data and access rules live in [Convex](https://convex.dev). The front end is plain HTML, CSS and JavaScript with no build step.

## Documentation

| Guide | For | Covers |
|---|---|---|
| [User guide](docs/user-guide.md) | Everyone | Signing in and accepting invites, every page, everyday tasks, what clients see |
| [Admin guide](docs/admin-guide.md) | Admins | Inviting people, access levels, client companies, the access log, common situations |
| [Developer guide](docs/developer-guide.md) | Whoever maintains the portal | Setup, configuration, how sign-in and access work, data model, functions, scripts, production, troubleshooting |

## Quick start

From this folder (`D:\tRodas\ellix project`):

```powershell
npm install
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Or double-click `start.bat`. Then open <http://localhost:5500> and sign in.

Setting up Clerk and Convex for the first time? Follow [Set up from scratch](docs/developer-guide.md#set-up-from-scratch).

Check that Clerk and Convex are wired up correctly (read-only; each problem comes with a fix):

```powershell
npm run check:integrations
```

## Project layout

| Path | What’s there |
|---|---|
| `index.html`, `app.js`, `styles.css` | The portal |
| `login.html`, `login.js`, `login.css` | The sign-in page |
| `auth.js`, `session.js`, `config.js` | Clerk sign-in and the Convex connection |
| `convex/` | Backend: data model, access rules and server functions |
| `scripts/` | Import, access and integration-check commands |
| `tests/` | Automated tests of the access rules and features (`npm test`) |
| `data/` | Starting project data for imports |
| `docs/` | The guides above |
| `serve.ps1`, `start.bat` | Local web server |
| `DESIGN.md`, `PRODUCT.md` | Design system and product notes |

Brand reference: <https://trodas.net/>. Primary blue `#0040C1`. Inter and Inter Tight via Google Fonts.
