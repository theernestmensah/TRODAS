# Trodas Technologies project portal
## Platform
Web.
## Stack
User requested HTML, CSS, and JavaScript. No framework.
## Purpose
Internal team tracks project status, deadlines, resources, and client feedback. Clients receive limited read-only access.
## Integration
Authentication: Clerk, invite-only (team members and clients are invited; no public sign-up). Backend: Convex stores signed-in users, projects, client feedback, recent activity, and resources (live-updating); the local PowerShell API was retired. Roles are enforced in Convex: admins invite people from the Admin page, set their access, manage the client company list, and see an access log; Trodas team members see and edit every project, review feedback, and share resources; client accounts see only their company's projects, feedback, resources, and company activity, read-only; invited people get their access on first sign-in, anyone else waits for an admin. Browser persistence remains as an offline/demo preview capability when Convex is not yet connected.
## Open decisions
Company name Trodas Technologies confirmed by user. Brand reference https://trodas.net/; colors and fonts verified in the live site.
