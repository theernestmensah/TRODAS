// Runs `convex run <fn> <json>` with node directly (no shell), so the JSON argument
// needs no quoting on Windows. Extra flags such as --prod are passed through.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('..', import.meta.url));

export function convexRun(fn, args, flags = []) {
  const cli = root + 'node_modules/convex/bin/main.js';
  const result = spawnSync(process.execPath, [cli, 'run', ...flags, fn, JSON.stringify(args)], {
    cwd: root,
    stdio: 'inherit'
  });
  return result.status ?? 1;
}
