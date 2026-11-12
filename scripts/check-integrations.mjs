// Checks that Clerk sign-in and the Convex backend are wired together correctly.
//
//   npm run check:integrations            → your dev deployment
//   npm run check:integrations -- --prod  → your production deployment
//
// It reads config.js, .env.local and your Convex deployment's settings, asks Clerk's public
// endpoints how the app is configured, and calls Convex without a sign-in and with a fake
// one to make sure both are refused. It changes nothing. Exits with code 1 if a check fails.
//
// What it can't check from here: a real signed-in token. For that, sign in to the portal;
// the top bar should say "Live · Convex".
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { ConvexHttpClient } from 'convex/browser';
import { root } from './convex-run.mjs';

const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const prod = flags.includes('--prod');
let failures = 0;
let warnings = 0;

const pass = text => console.log(`  ✔ ${text}`);
const fail = (text, fix) => { failures++; console.log(`  ✖ ${text}${fix ? `\n      → ${fix}` : ''}`); };
const warn = (text, fix) => { warnings++; console.log(`  ! ${text}${fix ? `\n      → ${fix}` : ''}`); };
const section = title => console.log(`\n${title}`);

function convexCli(args) {
  const result = spawnSync(process.execPath, [root + 'node_modules/convex/bin/main.js', ...args, ...flags], {
    cwd: root,
    encoding: 'utf8'
  });
  return { ok: result.status === 0, out: (result.stdout || '').trim(), err: (result.stderr || '').trim() };
}

async function fetchJson(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (i >= tries) throw error;
      await new Promise(r => setTimeout(r, 700 * i));
    }
  }
}

const trimSlash = url => String(url || '').trim().replace(/\/+$/, '');

// ── 1. Portal settings ────────────────────────────────────────────────────────
// config.js holds a block per environment (development / production); older versions had one set.
const envName = prod ? 'production' : 'development';
const configFile = readFileSync(root + 'config.js', 'utf8');
const configText = (new RegExp(`${envName}\\s*:\\s*\\{([^}]*)\\}`).exec(configFile) || [])[1] ?? configFile;
const configValue = name => (new RegExp(`${name}\\s*:\\s*['"]([^'"]*)['"]`).exec(configText) || [])[1] || '';
section(`Portal settings (config.js → ${envName})`);
const publishableKey = configValue('clerkPublishableKey');
const convexUrl = trimSlash(configValue('convexUrl'));

let clerkHost = null;
const keyMatch = /^pk_(test|live)_([A-Za-z0-9+/=_-]+)$/.exec(publishableKey);
if (!publishableKey) fail('clerkPublishableKey is empty.', 'Copy it from Clerk → Configure → API keys.');
else if (!keyMatch) fail('clerkPublishableKey doesn’t look like a Clerk key (pk_test_… or pk_live_…).');
else {
  const decoded = Buffer.from(keyMatch[2], 'base64').toString('utf8');
  clerkHost = decoded.endsWith('$') ? decoded.slice(0, -1) : null;
  if (clerkHost) pass(`Clerk key points to ${clerkHost} (${keyMatch[1] === 'live' ? 'production' : 'development'} instance)`);
  else fail('clerkPublishableKey can’t be decoded.', 'Copy it again from Clerk → Configure → API keys.');
  if (prod && keyMatch[1] === 'test') warn('Checking production, but config.js has a development Clerk key (pk_test_…).');
}

if (!convexUrl) fail('convexUrl is empty, so the portal runs as a browser-only demo.', 'Copy CONVEX_URL from .env.local.');
else if (!/^https:\/\/[a-z0-9-]+\.convex\.cloud$/.test(convexUrl)) warn(`convexUrl is ${convexUrl}, which isn’t a usual Convex cloud address.`);
else pass(`Convex address: ${convexUrl}`);

if (!prod) {
  const envFile = root + '.env.local';
  const envUrl = existsSync(envFile) ? trimSlash((/^CONVEX_URL=(\S+)/m.exec(readFileSync(envFile, 'utf8')) || [])[1]) : '';
  if (!envUrl) warn('.env.local has no CONVEX_URL, so this folder isn’t linked to a Convex project.', 'Run npx convex dev once.');
  else if (convexUrl && envUrl !== convexUrl) fail(`config.js uses ${convexUrl}, but this folder deploys to ${envUrl}.`, 'Make convexUrl in config.js match CONVEX_URL in .env.local.');
  else if (envUrl) pass('config.js and .env.local point to the same Convex deployment');
}

// ── 2. Convex trusts this Clerk app ───────────────────────────────────────────
section('Convex → Clerk trust');
const authConfig = readFileSync(root + 'convex/auth.config.ts', 'utf8');
if (/applicationID:\s*["']convex["']/.test(authConfig)) pass('convex/auth.config.ts expects tokens for "convex"');
else fail('convex/auth.config.ts doesn’t set applicationID: "convex".', 'Clerk’s Convex integration issues tokens with aud "convex".');

const issuerVar = convexCli(['env', 'get', 'CLERK_ISSUER_URL']);
const issuer = trimSlash(issuerVar.out.split(/\r?\n/).pop());
if (!issuerVar.ok || !issuer || /not set|not found/i.test(issuerVar.out + issuerVar.err)) {
  fail('CLERK_ISSUER_URL isn’t set on the Convex deployment.', `npx convex env set CLERK_ISSUER_URL https://${clerkHost ?? 'your-app.clerk.accounts.dev'}${prod ? ' --prod' : ''}`);
} else if (clerkHost && issuer !== `https://${clerkHost}`) {
  fail(`Convex trusts ${issuer}, but the portal signs in with https://${clerkHost}.`, `npx convex env set CLERK_ISSUER_URL https://${clerkHost}${prod ? ' --prod' : ''}`);
} else {
  pass(`Convex trusts tokens from ${issuer}`);
}

// ── 3. Clerk app settings (public endpoints) ──────────────────────────────────
section('Clerk app');
if (clerkHost) {
  try {
    const oidc = await fetchJson(`https://${clerkHost}/.well-known/openid-configuration`);
    if (trimSlash(oidc.issuer) === `https://${clerkHost}`) pass('Clerk publishes the expected issuer');
    else fail(`Clerk reports issuer ${oidc.issuer}, expected https://${clerkHost}.`);
    const jwks = await fetchJson(oidc.jwks_uri || `https://${clerkHost}/.well-known/jwks.json`);
    if (jwks.keys?.length) pass(`Clerk signing keys are published (${jwks.keys.length})`);
    else fail('Clerk publishes no signing keys, so Convex can’t verify sign-ins.');
  } catch (error) {
    fail(`Couldn’t reach Clerk at ${clerkHost} (${error.message}).`, 'Check your internet connection and the publishable key.');
  }
  try {
    const env = await fetchJson(`https://${clerkHost}/v1/environment`);
    const mode = env.user_settings?.sign_up?.mode;
    if (mode === 'restricted') pass('Sign-up is invite-only');
    else warn(`Sign-up mode is "${mode ?? 'unknown'}", so people can create accounts without an invite.`, 'Clerk → Configure → Access mode → Invite-only. (Convex still keeps them waiting for access.)');
  } catch (error) {
    warn(`Couldn’t read Clerk’s sign-up settings (${error.message}).`);
  }
} else {
  warn('Skipped: no valid Clerk key in config.js.');
}

// ── 3b. Admin page: invites and admins ────────────────────────────────────────
section('Admin page');
const secretVar = convexCli(['env', 'get', 'CLERK_SECRET_KEY']);
const secret = secretVar.ok ? secretVar.out.split(/\r?\n/).pop().trim() : '';
if (!secret.startsWith('sk_')) {
  warn('CLERK_SECRET_KEY isn’t set, so invites from the Admin page are saved but not emailed.', `Copy the secret key from Clerk → Configure → API keys, then: npx convex env set CLERK_SECRET_KEY <key>${prod ? ' --prod' : ''}`);
} else if (clerkHost) {
  const apiVar = convexCli(['env', 'get', 'CLERK_API_URL']);
  const api = apiVar.ok && /^https?:\/\//.test(apiVar.out.split(/\r?\n/).pop()) ? trimSlash(apiVar.out.split(/\r?\n/).pop()) : '';
  if (api) warn(`CLERK_API_URL is set to ${api}, so invites go there instead of Clerk.`, `npx convex env remove CLERK_API_URL${prod ? ' --prod' : ''}`);
  try {
    // The secret key's instance must be the one the portal signs in with: compare signing key ids.
    const res = await fetch('https://api.clerk.com/v1/jwks', { headers: { Authorization: `Bearer ${secret}` } });
    if (res.status === 401 || res.status === 403) fail('Clerk rejected CLERK_SECRET_KEY.', 'Copy a current secret key from Clerk → Configure → API keys.');
    else if (!res.ok) warn(`Couldn’t check CLERK_SECRET_KEY with Clerk (HTTP ${res.status}).`);
    else {
      const privateKids = new Set(((await res.json()).keys || []).map(k => k.kid));
      const publicKids = ((await fetchJson(`https://${clerkHost}/.well-known/jwks.json`)).keys || []).map(k => k.kid);
      if (publicKids.some(kid => privateKids.has(kid))) pass('CLERK_SECRET_KEY belongs to the same Clerk app, so invites can be emailed');
      else fail('CLERK_SECRET_KEY belongs to a different Clerk app than config.js.', 'Use the secret key from the same Clerk app as the publishable key.');
    }
  } catch (error) {
    warn(`Couldn’t check CLERK_SECRET_KEY with Clerk (${error.message}).`);
  }
}
const usersDump = convexCli(['data', 'users', '--format', 'jsonLines', '--limit', '1000']);
if (usersDump.ok) {
  const roles = usersDump.out.split(/\r?\n/).filter(l => l.trim().startsWith('{')).map(l => { try { return JSON.parse(l).role; } catch { return null; } });
  const admins = roles.filter(r => r === 'admin').length;
  // Admins pre-approved but not signed in yet (invites with role admin, still pending).
  const invitesDump = convexCli(['data', 'invites', '--format', 'jsonLines', '--limit', '1000']);
  const pendingAdmins = invitesDump.ok
    ? invitesDump.out.split(/\r?\n/).filter(l => l.trim().startsWith('{')).map(l => { try { return JSON.parse(l); } catch { return {}; } }).filter(i => i.status === 'pending' && i.role === 'admin').length
    : 0;
  if (admins) pass(`${admins} admin${admins === 1 ? '' : 's'} can manage people`);
  else if (pendingAdmins) warn(`No one is an admin yet; ${pendingAdmins} pre-approved admin${pendingAdmins === 1 ? '' : 's'} will become admin at first sign-in.`, 'Until then nobody can use the Admin page. To make someone admin now: npm run convex:grant -- you@company.com admin');
  else warn(roles.length ? 'No one is an admin, so no one can manage people in the portal.' : 'No one has signed in yet.', 'Sign in once, then: npm run convex:grant -- you@company.com admin');
} else {
  warn('Couldn’t count admins.');
}

// ── 4. Deployed functions match the code in convex/ ───────────────────────────
section('Convex functions');
const local = new Set();
for (const file of readdirSync(root + 'convex').filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))) {
  const module = file.replace(/\.ts$/, '');
  const source = readFileSync(root + 'convex/' + file, 'utf8');
  for (const m of source.matchAll(/^export const (\w+)\s*=\s*(?:query|mutation|action|internalQuery|internalMutation|internalAction)\s*\(/gm)) {
    local.add(`${module}:${m[1]}`);
  }
}
const spec = convexCli(['function-spec']);
let deployed = null;
try {
  deployed = new Set(JSON.parse(spec.out).functions
    .filter(f => f.udfType !== 'HttpAction')
    .map(f => f.identifier.replace(/\.js:/, ':')));
} catch {
  fail('Couldn’t list the deployed functions.', (spec.err || spec.out).split(/\r?\n/).slice(-1)[0] || 'Run npx convex dev once to link this folder.');
}
if (deployed) {
  const missing = [...local].filter(f => !deployed.has(f)).sort();
  const extra = [...deployed].filter(f => !local.has(f)).sort();
  if (missing.length) fail(`Not deployed yet: ${missing.join(', ')}`, `npx convex dev --once${prod ? ' (or npx convex deploy)' : ''}`);
  else pass(`All ${local.size} functions in convex/ are deployed`);
  if (extra.length) warn(`Deployed but no longer in convex/: ${extra.join(', ')}`, 'Deploy again to remove them.');
}

// ── 5. Convex refuses requests without a valid sign-in ────────────────────────
section('Convex sign-in checks');
const errorText = e => String(e?.data?.message ?? e?.data ?? e?.message ?? e).split('\n')[0].trim() || 'no answer';
let reachable = false;
if (convexUrl) {
  const anonymous = new ConvexHttpClient(convexUrl);
  try {
    const me = await anonymous.query('users:current', {});
    reachable = true;
    if (me === null) pass('Without a sign-in, Convex treats you as signed out');
    else fail('users:current returned a user without any sign-in.');
  } catch (error) {
    fail(`Couldn’t reach Convex at ${convexUrl} (${errorText(error)}). Skipped the sign-in checks.`, 'Check convexUrl in config.js and that the deployment exists.');
  }
}
if (reachable) {
  const anonymous = new ConvexHttpClient(convexUrl);
  for (const fn of ['projects:list', 'feedback:list', 'resources:list', 'activity:list', 'users:list', 'clients:list', 'invites:list', 'audit:list']) {
    if (deployed && !deployed.has(fn)) continue;
    try {
      await anonymous.query(fn, {});
      fail(`${fn} returned data without a sign-in.`, 'Every function must start with requireAccess or requireTeam (convex/access.ts).');
    } catch (error) {
      if (/Sign in first/.test(errorText(error))) pass(`${fn} refuses requests without a sign-in`);
      else fail(`${fn} failed unexpectedly: ${errorText(error)}`);
    }
  }
  const forged = new ConvexHttpClient(convexUrl);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  forged.setAuth(`${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: issuer || `https://${clerkHost}`, aud: 'convex', sub: 'user_fake', exp: Math.floor(Date.now() / 1000) + 300 })}.${b64('not-a-signature')}`);
  try {
    await forged.query('projects:list', {});
    fail('Convex accepted a token with a fake signature.');
  } catch (error) {
    if (/verify|Unauthenticated|InvalidAuthHeader/i.test(errorText(error))) pass('Convex rejects a forged sign-in token');
    else fail(`Forged token failed for an unexpected reason: ${errorText(error)}`);
  }
}

console.log(`\n${failures ? `✖ ${failures} problem${failures === 1 ? '' : 's'}` : '✔ Clerk and Convex are wired up'}${warnings ? `, ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}.`);
if (!failures) console.log('  To check a real sign-in, open the portal: the top bar should say “Live · Convex”.');
process.exit(failures ? 1 : 0);
