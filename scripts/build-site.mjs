// Builds the public website: copies only the portal's own pages and files into public/.
// Hosting (Vercel) serves public/ only, so the backend code, scripts, tests, docs and
// data in this folder are never published.
//
//   npm run build
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { root } from './convex-run.mjs';

const out = root + 'public/';
const files = [
  'index.html', 'login.html',
  'app.js', 'auth.js', 'session.js', 'login.js', 'config.js',
  'styles.css', 'login.css', 'fonts.css', 'favicon.svg'
];
const folders = ['assets'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let count = 0;
for (const file of files) {
  if (!existsSync(root + file)) throw new Error(`Missing ${file}: the site can't be built without it.`);
  cpSync(root + file, out + file);
  count++;
}
for (const folder of folders) {
  if (!existsSync(root + folder)) continue;
  cpSync(root + folder, out + folder, { recursive: true });
  const walk = dir => readdirSync(dir).reduce((n, name) => n + (statSync(`${dir}/${name}`).isDirectory() ? walk(`${dir}/${name}`) : 1), 0);
  count += walk(root + folder);
}
console.log(`Built public/ with ${count} files.`);
