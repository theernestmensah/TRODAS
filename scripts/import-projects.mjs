// One-time import of projects from the old local API into Convex.
//
//   npm run convex:import-projects                 → data/projects.json into your dev deployment
//   npm run convex:import-projects -- other.json   → a different file
//   npm run convex:import-projects -- --prod       → your production deployment
//
// Runs the internal mutation projects:importLegacy through the Convex CLI, which uses
// your deployment's admin access. Projects that were already imported are skipped.
import { existsSync, readFileSync } from 'node:fs';
import { convexRun, root } from './convex-run.mjs';

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const fileArg = args.find(a => !a.startsWith('--'));

const file = fileArg
  ?? ['data/projects.json', 'data/projects.seed.json'].map(f => root + f).find(f => existsSync(f));
if (!file || !existsSync(file)) {
  console.error('No project file found. Pass a path: npm run convex:import-projects -- path/to/projects.json');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, 'utf8'));
const list = Array.isArray(raw) ? raw : raw.projects;
if (!Array.isArray(list)) {
  console.error(`${file} should contain an array of projects (or { "projects": [...] }).`);
  process.exit(1);
}

const projects = list.map(p => ({
  id: String(p.id),
  name: String(p.name ?? ''),
  client: String(p.client ?? ''),
  status: String(p.status ?? 'In progress'),
  progress: Number(p.progress ?? 0),
  deadline: String(p.deadline ?? ''),
  lead: String(p.lead ?? ''),
  description: String(p.description ?? ''),
  symbol: String(p.symbol ?? ''),
  color: String(p.color ?? '')
}));

console.log(`Importing ${projects.length} projects from ${file}…`);
process.exit(convexRun('projects:importLegacy', { projects }, flags));
