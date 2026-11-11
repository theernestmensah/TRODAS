// Grant portal access from the command line, using your Convex deployment's admin access.
// Use it for the first team member; after that, team members manage access on the
// People & access page in the portal.
//
//   npm run convex:grant -- you@trodas.net team
//   npm run convex:grant -- jane@acme.com client "Acme Corporation"
//   npm run convex:grant -- someone@example.com none          (remove access)
//   npm run convex:grant -- you@trodas.net team --prod        (production deployment)
//
// The person must have signed in to the portal once, so Convex knows their email.
import { convexRun } from './convex-run.mjs';

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const [email, role, ...clientWords] = args.filter(a => !a.startsWith('--'));
const client = clientWords.join(' ').trim();

const usage = 'Usage: npm run convex:grant -- <email> <team|client|none> ["Client company"]';
if (!email || !['team', 'client', 'none'].includes(role)) {
  console.error(usage);
  process.exit(1);
}
if (role === 'client' && !client) {
  console.error('Clients need a company name that matches their projects, e.g. "Acme Corporation".\n' + usage);
  process.exit(1);
}

process.exit(convexRun('users:grantAccess', { email, role, ...(role === 'client' ? { client } : {}) }, flags));
