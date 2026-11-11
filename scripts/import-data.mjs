// One-time import of all initial portal data (projects, feedback, activity, resources) into Convex.
//
//   npm run convex:import-all            → into your dev deployment
//   npm run convex:import-all -- --prod  → into your prod deployment

import { existsSync, readFileSync } from 'node:fs';
import { convexRun, root } from './convex-run.mjs';

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));

// 1. Projects
const projectFile = ['data/projects.json', 'data/projects.seed.json']
  .map(f => root + f)
  .find(f => existsSync(f));

if (projectFile && existsSync(projectFile)) {
  const raw = JSON.parse(readFileSync(projectFile, 'utf8'));
  const list = Array.isArray(raw) ? raw : raw.projects;
  if (Array.isArray(list)) {
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
    console.log(`Importing ${projects.length} projects…`);
    convexRun('projects:importLegacy', { projects }, flags);
  }
}

// 2. Feedback
const initialFeedback = [
  { id: 'f1', author: 'Emily Parker', client: 'Acme Corporation', project: 'p1', text: 'The new homepage is looking great! Love the cleaner navigation. Could we explore a slightly larger headline in the hero section?', date: 'Nov 7, 2026', status: 'Needs review' },
  { id: 'f2', author: 'Daniel Lee', client: 'Bloom Studio', project: 'p3', text: 'The portal flow is much easier to follow. The team is ready to review the final document upload experience.', date: 'Nov 6, 2026', status: 'Needs review' }
];
console.log(`Importing ${initialFeedback.length} feedback items…`);
convexRun('feedback:importLegacy', { feedback: initialFeedback }, flags);

// 3. Activity
const initialActivity = [
  { actor: 'Sarah Chen', action: 'updated the project progress.', context: 'Website redesign · Nov 7' },
  { actor: 'Olivia Brown', action: 'moved a project to review.', context: 'Customer portal · Nov 6' },
  { actor: 'James Wilson', action: 'completed the handoff.', context: 'Network modernization · Nov 2' },
  { actor: 'Sarah Chen', action: 'shared a website progress update.', context: 'Website redesign · Nov 7', client: 'Acme Corporation' },
  { actor: 'Alex Morgan', action: 'flagged a delivery risk.', context: 'Security audit · Nov 6', client: 'Acme Corporation' }
];
console.log(`Importing ${initialActivity.length} activity items…`);
convexRun('activity:importLegacy', { items: initialActivity }, flags);

// 4. Resources
const documents = [
  { name: 'Project brief', description: 'Scope, objectives, and delivery expectations.', type: 'Brief', project: 'p1', client: 'Acme Corporation', body: 'Website redesign\nClient: Acme Corporation\nObjective: Refresh the public website and improve navigation.\nDeliverables: Accessible layouts, responsive pages, and launch handoff.' },
  { name: 'Security checklist', description: 'Access controls and audit review requirements.', type: 'Checklist', project: 'p4', client: 'Acme Corporation', body: 'Security audit checklist\nReview user permissions\nConfirm multi-factor authentication\nValidate backup restore procedures\nDocument vulnerability remediation' },
  { name: 'Cloud migration plan', description: 'Milestones and infrastructure migration steps.', type: 'Plan', project: 'p2', client: 'Nexus Technologies', body: 'Cloud migration plan\n1. Inventory services\n2. Provision staging environment\n3. Validate backups\n4. Migrate services\n5. Monitor and hand over' }
];
console.log(`Importing ${documents.length} resources…`);
convexRun('resources:importLegacy', { documents }, flags);

console.log('Done importing initial data into Convex.');
