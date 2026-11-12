// Load the sample data into Convex: six projects for small Ghanaian businesses, each with a
// delivery timeline, plus client feedback, shared documents and recent activity.
// Also removes the older placeholder samples (Acme Corporation and others) if present.
//
//   npm run convex:import-all            → into your dev deployment
//   npm run convex:import-all -- --prod  → into your prod deployment
//
// Safe to run again: projects already loaded are skipped. The sample data lives in
// convex/samples.ts. To import your own projects from a JSON file instead, use
// `npm run convex:import-projects -- path/to/projects.json`.
import { convexRun } from './convex-run.mjs';

const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
console.log('Loading sample projects, timelines, feedback, documents and activity…');
process.exit(convexRun('samples:load', {}, flags));
