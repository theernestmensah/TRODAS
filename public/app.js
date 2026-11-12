const $ = s => document.querySelector(s);
const icons = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  projects: '<path d="M3 7h7l2-3h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z"/><path d="M3 9h18"/>',
  resources: '<path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
  feedback: '<path d="M4 4h16v12H9l-5 4Z"/><path d="M8 8h8M8 12h5"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v2"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m10 3-1 3-3 1-3-1-1 4 3 2v3l-1 3 3 3 3-2h3l3 1 3-3-2-3v-3l1-3-3-3-3 1Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  invite: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
  building: '<path d="M4 21V5l8-3v19M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2M2 21h20"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  tick: '<path d="m5 12 5 5 9-10"/>',
  timeline: '<path d="M3 6h8M7 12h10M11 18h10"/><circle cx="3" cy="6" r="1"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.projects}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Demo data, used only when convexUrl is empty. Mirrors the samples in convex/samples.ts.
const phase = (title, start, end, done) => ({ title, start, end, done });
const initialProjects = [
  { id: 's1', name: 'Courier app for Android and iOS', client: 'Sankofa Delivery', status: 'In progress', progress: 55, deadline: '2027-01-29', lead: 'Kwame Asante', symbol: 'S', color: 'sand', description: 'Customer app to book and track parcel deliveries across Accra, with a rider app and mobile money payments.', milestones: [phase('Discovery', '2026-10-01', '2026-10-12', true), phase('UX and UI design', '2026-10-13', '2026-11-03', true), phase('App development', '2026-11-04', '2026-12-22', false), phase('Testing and beta', '2026-12-23', '2027-01-19', false), phase('Store release', '2027-01-20', '2027-01-29', false)] },
  { id: 's2', name: 'Online ordering website', client: 'Osu Bakery & Café', status: 'In review', progress: 85, deadline: '2026-11-20', lead: 'Efua Owusu', symbol: 'O', color: 'pink', description: 'Menu, online orders for pickup and delivery, and a simple screen to update the daily specials.', milestones: [phase('Discovery', '2026-10-05', '2026-10-09', true), phase('Design', '2026-10-12', '2026-10-23', true), phase('Build', '2026-10-26', '2026-11-11', true), phase('Content and testing', '2026-11-12', '2026-11-18', false), phase('Launch', '2026-11-19', '2026-11-20', false)] },
  { id: 's3', name: 'Container tracking dashboard', client: 'Tema Harbour Logistics', status: 'At risk', progress: 38, deadline: '2026-12-04', lead: 'Yaw Darko', symbol: 'T', color: 'blue', description: 'Live container status for the operations desk, fed from the shipping lines’ daily data exports.', milestones: [phase('Discovery', '2026-09-14', '2026-09-25', true), phase('Design', '2026-09-28', '2026-10-16', true), phase('Build', '2026-10-19', '2026-11-11', false), phase('Integration testing', '2026-11-12', '2026-11-27', false), phase('Go-live', '2026-11-30', '2026-12-04', false)] },
  { id: 's4', name: 'Patient booking system', client: 'Ridge Dental Clinic', status: 'In progress', progress: 22, deadline: '2027-02-26', lead: 'Adwoa Boateng', symbol: 'R', color: '', description: 'Online appointment booking with SMS reminders, and a daily schedule for the front desk.', milestones: [phase('Discovery', '2026-11-02', '2026-11-13', false), phase('Design', '2026-11-16', '2026-12-11', false), phase('Build', '2026-12-14', '2027-02-05', false), phase('Testing', '2027-02-08', '2027-02-19', false), phase('Launch', '2027-02-22', '2027-02-26', false)] },
  { id: 's5', name: 'Farmer payments with mobile money', client: 'Volta Grains Co-operative', status: 'Completed', progress: 100, deadline: '2026-10-30', lead: 'Kwame Asante', symbol: 'V', color: 'sand', description: 'Pays member farmers by mobile money as soon as their grain is weighed at a collection point.', milestones: [phase('Discovery', '2026-06-01', '2026-06-12', true), phase('Design', '2026-06-15', '2026-07-10', true), phase('Build', '2026-07-13', '2026-09-18', true), phase('Pilot in two districts', '2026-09-21', '2026-10-16', true), phase('Rollout', '2026-10-19', '2026-10-30', true)] },
  { id: 's6', name: 'Stock and sales system', client: 'Kumasi Hardware Centre', status: 'In progress', progress: 64, deadline: '2026-12-11', lead: 'Yaw Darko', symbol: 'K', color: '', description: 'Point of sale and stock levels for two branches, with low-stock alerts and daily sales reports.', milestones: [phase('Discovery', '2026-09-01', '2026-09-11', true), phase('Design', '2026-09-14', '2026-10-02', true), phase('Build', '2026-10-05', '2026-11-20', false), phase('Testing', '2026-11-23', '2026-12-04', false), phase('Training and launch', '2026-12-07', '2026-12-11', false)] }
];
const initialFeedback = [
  { id: 'sf1', author: 'Nana Akua Ofori', client: 'Osu Bakery & Café', project: 's2', text: 'The menu photos look great. Could customers choose a pickup time at checkout? Mornings get very busy.', date: 'Nov 10, 2026', status: 'Needs review' },
  { id: 'sf2', author: 'Selorm Agbeko', client: 'Tema Harbour Logistics', project: 's3', text: 'The tracking table is clear, but it’s slow to load on our office Wi-Fi. Can it show when the data was last updated?', date: 'Nov 9, 2026', status: 'Needs review' }
];
const initialActivity = [
  ['Efua Owusu', 'moved the project to review.', 'Online ordering website · 11 Nov'],
  ['Yaw Darko', 'flagged a delivery risk: the Build phase is running late.', 'Container tracking dashboard · 10 Nov'],
  ['Kwame Asante', 'completed the UX and UI design phase.', 'Courier app for Android and iOS · 3 Nov']
];
const clientActivity = [
  ['Kwame Asante', 'completed the UX and UI design phase.', 'Courier app for Android and iOS · 3 Nov'],
  ['Kwame Asante', 'shared the release plan.', 'Courier app for Android and iOS · 4 Nov']
];

function readStore(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved ?? fallback;
  } catch {
    return fallback;
  }
}

// Projects live in Convex once config.js has a convexUrl. Until then the portal
// runs as a demo with projects saved in this browser.
const convexConfigured = Boolean(String(window.ELLIX_CONFIG?.convexUrl || '').trim());
let backend = null; // ConvexClient, set when session.js reports the signed-in connection
let backendState = convexConfigured ? 'connecting' : 'demo'; // connecting | live | error | demo
let backendError = '';
let slowConnection = false;
// The signed-in person's access, from users:current: { role: 'admin' | 'team' | 'client' | null, client, ... }.
let viewer = null;
let projectsSub = null; // unsubscribe for projects:list
let feedbackSub = null;
let activitySub = null;
let resourcesSub = null;
// Staff and admin data, kept live while the signed-in person may see it (see keepSubscribed).
let clientsList = []; // clients:list (staff): the client companies projects and accounts use
let people = []; // users:list (admins)
let invites = { canEmail: false, pending: [] }; // invites:list (admins)
let auditEntries = []; // audit:list (admins)
let staffList = []; // users:staff (staff): admins and team, for project leads and the Team page
let archivedProjects = []; // archived projects (staff only): kept out of every list but Projects → Archived
let previewClient = null; // which client a team member previews in the client view
const optionalSubs = {};
// Admin page state. Drafts keep half-typed values when a live update re-renders the page.
let adminTab = 'people';
let renamingClient = null;
let peopleFilter = 'all'; // all | admin | team | client | waiting
const drafts = { inviteEmail: '', inviteAccess: 'team', newClient: '', renameClient: '', peopleQuery: '' };
let projects = convexConfigured ? [] : (() => {
  const saved = readStore('trodas-projects', readStore('ellix-projects', null));
  return Array.isArray(saved) ? saved : structuredClone(initialProjects);
})();
let feedback = (() => {
  const saved = readStore('trodas-feedback', null);
  return Array.isArray(saved) ? saved : structuredClone(initialFeedback);
})();
let activityItems = (() => {
  const saved = readStore('trodas-activity', null);
  return Array.isArray(saved) ? saved : structuredClone(initialActivity);
})();

let page = 'overview';
let role = 'team';
let filter = 'All projects';
let query = '';
const statuses = ['In progress', 'In review', 'At risk', 'Completed'];
const PREVIEW_CLIENT = 'Sankofa Delivery';
// A real client account (enforced by Convex), as opposed to a team member previewing the client view.
const isStaffRole = r => r === 'admin' || r === 'team';
const isClientAccount = () => backendState === 'live' && viewer?.role === 'client';
const isTeamAccount = () => backendState === 'live' && isStaffRole(viewer?.role); // team or admin
const isAdminAccount = () => backendState === 'live' && viewer?.role === 'admin';
// Clients a team member can preview: those with current projects.
const previewableClients = () => [...new Set(projects.map(p => p.client))].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
function clientName() {
  if (isClientAccount()) return viewer.client;
  const names = previewableClients();
  if (previewClient && names.includes(previewClient)) return previewClient;
  return names.includes(PREVIEW_CLIENT) ? PREVIEW_CLIENT : (names[0] || PREVIEW_CLIENT);
}
const visibleProjects = () => role === 'client' ? projects.filter(p => p.client === clientName()) : projects;
const projectFor = item => [...projects, ...archivedProjects].find(p => p.id === item.project || p._id === item.project);
// The team can change things; a client account or a team member previewing the client view can't.
const canEditProjects = () => role === 'team' && (backendState === 'demo' || isTeamAccount());

// Project leads: the portal's staff accounts (sample names in the demo), plus a project's
// current lead if it isn't one of them, so existing projects keep their lead.
const DEMO_LEADS = ['Kwame Asante', 'Efua Owusu', 'Yaw Darko', 'Adwoa Boateng'];
function leadOptions(selected) {
  const names = isTeamAccount() ? staffList.map(s => s.name) : DEMO_LEADS;
  const all = selected && !names.includes(selected) ? [...names, selected] : names;
  return all.map(n => `<option ${n === selected ? 'selected' : ''}>${esc(n)}</option>`).join('');
}

function pageAllowed(name) {
  if (name === 'admin') return role === 'team' && isAdminAccount();
  if (name === 'team') return role === 'team' && (backendState === 'demo' || isStaffRole(viewer?.role));
  if (name === 'settings') return role === 'team' && viewer?.role !== 'client';
  return true;
}
const initials = name => name.split(' ').map(n => n[0]).slice(0, 2).join('');
const badge = s => `<span class="badge ${s.toLowerCase().replaceAll(' ', '-')}">${esc(s)}</span>`;
const date = d => new Date(d + 'T12:00:00');
const fmt = d => date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Accra', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const activityStamp = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3200);
}

function persist() {
  try {
    localStorage.setItem('trodas-feedback', JSON.stringify(feedback));
    localStorage.setItem('trodas-activity', JSON.stringify(activityItems));
    if (backendState === 'demo') localStorage.setItem('trodas-projects', JSON.stringify(projects));
  } catch {
    toast('Browser storage is unavailable. Changes last for this session.');
  }
}

function signedInName() {
  return window.Clerk?.user ? TrodasAuth.displayName(window.Clerk.user) : 'Team member';
}

// Demo mode only. With Convex, the server records activity itself inside
// projects:create, projects:update, feedback:review and resources:create.
function logActivity(name, text, context) {
  if (backend) return;
  activityItems.unshift([name, text, `${context} · ${activityStamp()}`]);
  activityItems = activityItems.slice(0, 8);
  persist();
}

function pendingFeedback() {
  return feedback.filter(f => visibleProjects().some(p => p.id === f.project) && f.status === 'Needs review');
}

function render() {
  const titles = {
    overview: ['Workspace overview', 'Track delivery, deadlines, and client updates across your workspace.'],
    projects: ['Your projects', 'Find projects, check progress, and update delivery status.'],
    resources: ['Project resources', 'Find briefs, plans, and checklists shared with your projects.'],
    feedback: ['Client feedback', 'Review feedback shared on your projects.'],
    team: ['Project team', 'A shared view of your delivery team and their projects.'],
    settings: ['Connection settings', 'How this workspace connects to its Convex backend.'],
    admin: ['Admin', 'Invite people, decide what they can see, and manage client companies.']
  };
  if (!pageAllowed(page)) page = 'overview';
  $('#pageTitle').textContent = role === 'client' && page === 'overview' ? 'Your project overview' : titles[page][0];
  $('#pageSubtitle').textContent = titles[page][1];
  $('#crumb').textContent = page === 'overview' ? 'Overview' : page === 'feedback' ? 'Client feedback' : page[0].toUpperCase() + page.slice(1);
  // New-project form: suggest client names. The team picks from the client list; admins can add one.
  const clientNames = isTeamAccount() ? clientsList.map(c => c.name) : [...new Set(projects.map(p => p.client))].sort();
  $('#clientOptions').innerHTML = clientNames.map(n => `<option value="${esc(n)}"></option>`).join('');
  $('#projectForm [name="client"]').placeholder = isTeamAccount() && !isAdminAccount() ? 'Choose a client from the list' : 'Company name';
  // Lead list: keep the choice while the form is open; otherwise default to the signed-in person.
  const leadSelect = $('#projectForm [name="lead"]');
  const keepLead = $('#projectDialog').open ? leadSelect.value : '';
  leadSelect.innerHTML = leadOptions(keepLead || (isTeamAccount() ? viewer?.name : ''));
  const projectsReady = backendState === 'live' || backendState === 'demo';
  $('#newProject').hidden = role === 'client' || !projectsReady || !['overview', 'projects'].includes(page);
  // Only team members (or the demo) can switch to the client preview; client accounts are locked to it.
  const canPreview = projectsReady && !isClientAccount();
  $('#roleControl').hidden = !canPreview;
  $('.client-callout').hidden = !canPreview;
  $('#clientBanner').hidden = role !== 'client' || !projectsReady;
  if (isClientAccount()) {
    $('#clientBanner').textContent = `${clientName()} · A read-only view of your projects with Trodas Technologies.`;
  } else {
    // Team preview: choose which client's view to see.
    $('#clientBanner').innerHTML = `<label class="preview-picker">Client preview · Showing <select id="previewClientSelect" aria-label="Client to preview">${previewableClients().map(n => `<option ${n === clientName() ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select> as they see it. Read-only access.</label>`;
    $('#previewClientSelect').onchange = e => { previewClient = e.target.value; render(); };
  }
  $('#navCount').textContent = visibleProjects().length;
  $('#feedbackDot').hidden = !pendingFeedback().length;
  document.title = `${$('#pageTitle').textContent} — Trodas Technologies`;
  document.querySelectorAll('[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
    if (b.dataset.page === page) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
    b.hidden = !pageAllowed(b.dataset.page);
  });
  $('#content').innerHTML = page === 'settings' ? settings() : page === 'admin' ? adminPage() : !projectsReady ? backendNotice() : page === 'overview' ? overview() : page === 'projects' ? projectTable() : page === 'resources' ? resources() : page === 'feedback' ? feedbackPage() : team();
  bindContent();
}

// Re-render without losing the caret in the search box when a live update arrives mid-typing.
function renderKeepingFocus() {
  const active = document.activeElement;
  const id = active?.id;
  const caret = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
  render();
  const next = id && document.getElementById(id);
  if (next && next !== active) {
    next.focus();
    if (caret !== null && next.setSelectionRange) next.setSelectionRange(caret, caret);
  }
}

function backendNotice() {
  if (backendState === 'pending') {
    const who = viewer?.email || viewer?.name || 'this account';
    return `<div class="panel empty" role="status"><strong>Your account is waiting for access.</strong><br>You’re signed in as ${esc(who)}. A Trodas admin needs to give you access before projects appear here.</div>`;
  }
  if (backendState === 'connecting') {
    return slowConnection
      ? '<div class="panel empty" role="status">Still connecting to Convex…<br>Check that <code>convexUrl</code> in config.js is right and the deployment is running.</div>'
      : '<div class="panel empty" role="status">Loading projects from Convex…</div>';
  }
  return `<div class="panel empty" role="alert">Projects couldn’t be loaded from Convex.<br>${esc(backendError)}<br><button class="text-button" data-go="settings">Open connection settings ↗</button></div>`;
}

// ── Delivery timelines ───────────────────────────────────────────────────────
const DAY_MS = 864e5;
const dayMs = key => Date.parse(key + 'T00:00:00Z');
const keyOf = ms => new Date(ms).toISOString().slice(0, 10);
const shortDate = key => new Date(key + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const phaseLabel = { done: 'Done', late: 'Overdue', current: 'In progress', upcoming: 'Upcoming' };
function phaseState(m) {
  const today = todayKey();
  if (m.done) return 'done';
  if (m.end < today) return 'late';
  if (m.start <= today) return 'current';
  return 'upcoming';
}
const currentPhase = p => (p.milestones || []).find(m => !m.done) || null;
// The standard phases from today to the deadline (the server uses the same split).
function defaultTimeline(deadline) {
  const phases = [['Discovery', 0.12], ['Design', 0.2], ['Build', 0.43], ['Testing', 0.15], ['Launch', 0.1]];
  const today = todayKey();
  const from = dayMs(deadline > today ? today : deadline);
  const total = Math.max(phases.length, Math.round((dayMs(deadline) - from) / DAY_MS) + 1);
  let cursor = from;
  let used = 0;
  return phases.map(([title, share], i) => {
    const days = i === phases.length - 1 ? total - used : Math.max(1, Math.round(total * share));
    used += days;
    const m = { title, start: keyOf(cursor), end: keyOf(cursor + (days - 1) * DAY_MS), done: false };
    cursor += days * DAY_MS;
    return m;
  });
}

// Overview: a Gantt-style chart of active projects' phases, with a line for today.
function timelinePanel() {
  const rows = visibleProjects().filter(p => p.status !== 'Completed' && (p.milestones || []).length).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 7);
  if (!rows.length) return '';
  const today = dayMs(todayKey());
  let from = Math.max(Math.min(...rows.map(p => dayMs(p.milestones[0].start))), today - 75 * DAY_MS);
  const to = Math.min(Math.max(...rows.map(p => dayMs(p.milestones[p.milestones.length - 1].end) + DAY_MS), today + 21 * DAY_MS), today + 160 * DAY_MS);
  const first = new Date(from);
  first.setUTCDate(1);
  from = first.getTime();
  const pct = ms => Math.min(100, Math.max(0, (ms - from) / (to - from) * 100));
  const months = [];
  for (const d = new Date(from); d.getTime() < to; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.getTime());
  const axis = months.map(ms => `<span class="gantt-month" style="left:${pct(ms)}%">${new Date(ms).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}</span>`).join('');
  const now = `<i class="gantt-now" style="left:${pct(today)}%"></i>`;
  const body = rows.map(p => {
    const bars = p.milestones.map(m => {
      const state = phaseState(m);
      const left = pct(dayMs(m.start));
      const right = pct(dayMs(m.end) + DAY_MS);
      if (right <= 0 || left >= 100) return '';
      return `<i class="gantt-phase is-${state}" style="left:${left}%;width:${Math.max(0.8, right - left)}%" title="${esc(m.title)}: ${shortDate(m.start)} – ${shortDate(m.end)} (${phaseLabel[state]})"></i>`;
    }).join('');
    const current = currentPhase(p);
    const state = current ? phaseState(current) : 'done';
    return `<li class="gantt-row"><button class="gantt-label" data-project="${esc(p.id)}"><strong>${esc(p.name)}</strong><small>${esc(p.client)}</small></button><div class="gantt-track">${bars}${now}</div><span class="gantt-next is-${state}">${current ? `${esc(current.title)}<small>${state === 'late' ? 'overdue since' : 'until'} ${shortDate(current.end)}</small>` : 'All phases done'}</span></li>`;
  }).join('');
  return `<section class="panel timeline-panel" aria-labelledby="timelineTitle"><div class="panel-heading"><div><h2 id="timelineTitle">Delivery timeline</h2><p>Phases of active projects. Choose a project for its full timeline.</p></div><ul class="gantt-legend">${['done', 'current', 'late', 'upcoming'].map(s => `<li><i class="gantt-phase is-${s}"></i>${phaseLabel[s]}</li>`).join('')}</ul></div><div class="gantt-scroll"><div class="gantt"><div class="gantt-axis"><span></span><div class="gantt-months">${axis}<span class="gantt-today" style="left:${pct(today)}%">Today</span></div><span></span></div><ol class="gantt-rows">${body}</ol></div></div></section>`;
}

// Project window: the timeline as a list of phases the team can tick off.
function timelineSection(p, staff) {
  const list = p.milestones || [];
  const edit = staff && !p.archived ? `<button class="text-button" id="editTimeline">${list.length ? 'Edit timeline' : 'Add a timeline'}</button>` : '';
  if (!list.length) return `<div class="detail-section"><div class="section-head"><h3>Delivery timeline</h3>${edit}</div><p>No timeline yet.</p></div>`;
  const done = list.filter(m => m.done).length;
  const items = list.map((m, i) => {
    const state = phaseState(m);
    const days = Math.round((dayMs(m.end) - dayMs(m.start)) / DAY_MS) + 1;
    const toggle = staff && !p.archived ? `<button class="phase-toggle" data-phase="${i}" aria-pressed="${m.done}">${m.done ? 'Reopen' : 'Mark done'}</button>` : '';
    return `<li class="phase is-${state}"><span class="phase-dot" aria-hidden="true">${state === 'done' ? icon('tick') : ''}</span><div class="phase-body"><div class="phase-top"><strong>${esc(m.title)}</strong><span class="phase-state">${phaseLabel[state]}</span></div><small>${shortDate(m.start)} – ${shortDate(m.end)} · ${plural(days, 'day', 'days')}</small></div>${toggle}</li>`;
  }).join('');
  return `<div class="detail-section"><div class="section-head"><h3>Delivery timeline</h3><span class="count-pill">${done} of ${list.length} done</span>${edit}</div><ol class="phase-list">${items}</ol></div>`;
}

// Timeline editor: rows of phase name, start, end and done.
function timelineForm(p) {
  const start = p.milestones && p.milestones.length ? p.milestones : defaultTimeline(p.deadline);
  const row = (m, i) => `<div class="phase-row" data-row><input name="title_${i}" maxlength="60" placeholder="Phase name" aria-label="Phase name" value="${esc(m.title)}"><input type="date" name="start_${i}" aria-label="Starts" value="${esc(m.start)}"><input type="date" name="end_${i}" aria-label="Ends" value="${esc(m.end)}"><label class="phase-done"><input type="checkbox" name="done_${i}" ${m.done ? 'checked' : ''}>Done</label><button type="button" class="row-remove" data-remove-row aria-label="Remove phase">×</button></div>`;
  let next = start.length;
  openForm({
    title: 'Delivery timeline',
    intro: `${p.name} · ${p.client}`,
    submit: 'Save timeline',
    body: `<div class="phase-rows-head" aria-hidden="true"><span>Phase</span><span>Starts</span><span>Ends</span></div><div id="phaseRows">${start.map(row).join('')}</div><button type="button" class="secondary add-phase" id="addPhase">+ Add phase</button>`,
    onSubmit: async () => {
      const milestones = [...document.querySelectorAll('#phaseRows [data-row]')].map(r => ({
        title: r.querySelector('[name^="title_"]').value.trim(),
        start: r.querySelector('[name^="start_"]').value,
        end: r.querySelector('[name^="end_"]').value,
        done: r.querySelector('[name^="done_"]').checked
      })).filter(m => m.title || m.start || m.end);
      if (!milestones.length) { toast('Add at least one phase.'); return false; }
      const bad = milestones.find(m => !m.title || !m.start || !m.end || m.end < m.start);
      if (bad) { toast(bad.title ? `Check the dates of “${bad.title}”.` : 'Give every phase a name and dates.'); return false; }
      if (backend) await backend.mutation('projects:setTimeline', { id: p._id, milestones });
      else { p.milestones = milestones; persist(); }
      return 'Timeline saved.';
    }
  });
  $('#addPhase').onclick = () => {
    if (document.querySelectorAll('#phaseRows [data-row]').length >= 10) { toast('A timeline has at most 10 phases.'); return; }
    $('#phaseRows').insertAdjacentHTML('beforeend', row({ title: '', start: '', end: p.deadline, done: false }, next++));
    $('#phaseRows [data-row]:last-child input').focus();
  };
  $('#phaseRows').onclick = e => { const b = e.target.closest('[data-remove-row]'); if (b) b.closest('[data-row]').remove(); };
}

function overview() {
  const list = visibleProjects();
  const active = list.filter(p => p.status !== 'Completed');
  const review = pendingFeedback();
  const overdue = active.filter(p => p.deadline < todayKey()).length;
  const due = active.filter(p => p.deadline >= todayKey() && date(p.deadline) - date(todayKey()) <= 7 * 864e5).length;
  const counts = statuses.map(status => list.filter(p => p.status === status).length);
  return `<section class="delivery" aria-labelledby="deliveryTitle"><div class="delivery-copy"><h2 id="deliveryTitle">Delivery snapshot</h2><p>${active.length} active ${active.length === 1 ? 'project' : 'projects'}${overdue ? ` · ${overdue} overdue` : ''}${due ? ` · ${due} due this week` : ''}</p><button class="delivery-link" data-go="projects">Explore projects <span aria-hidden="true">→</span></button></div><div class="delivery-chart"><div class="chart-heading"><strong>Project status</strong><span>${list.length} total</span></div><div class="status-distribution" aria-hidden="true">${counts.map((n, i) => n ? `<i class="segment segment-${i}" style="flex:${n}"></i>` : '').join('')}</div><ul class="chart-legend">${statuses.map((status, i) => `<li><i class="segment segment-${i}"></i><span>${status}</span><strong>${counts[i]}</strong></li>`).join('')}</ul></div></section>
 ${timelinePanel()}<div class="dashboard-grid"><div class="main-column">${projectTable()}<section class="panel bottom-panel"><div class="panel-heading"><div><h2>Latest client feedback</h2><p>${review.length} awaiting review</p></div><button class="text-button" data-go="feedback">View feedback <span aria-hidden="true">↗</span></button></div>${feedbackPreview(review[0])}</section></div><div class="right-column">${deadlines()}${activity()}</div></div>`;
}

function projectTable() {
  // Archived projects appear only under Projects → Archived, for the team.
  const showArchived = page === 'projects' && role === 'team' && archivedProjects.length > 0;
  if (filter === 'Archived' && !showArchived) filter = 'All projects';
  const source = filter === 'Archived' ? archivedProjects : visibleProjects();
  const list = source.filter(p => (filter === 'All projects' || filter === 'Archived' || p.status === filter) && `${p.name} ${p.client} ${p.lead}`.toLowerCase().includes(query.toLowerCase()));
  const tabs = ['All projects', ...statuses, ...(showArchived ? ['Archived'] : [])];
  const tabCount = s => s === 'All projects' ? ` <span>${visibleProjects().length}</span>` : s === 'Archived' ? ` <span>${archivedProjects.length}</span>` : '';
  return `<section class="panel"><div class="panel-heading"><h2>${page === 'overview' ? 'Project portfolio' : 'All projects'} <span class="count-pill">${visibleProjects().length}</span></h2>${page === 'overview' ? '<button class="text-button" data-go="projects">View all projects <span>↗</span></button>' : '<button class="text-button" id="exportProjects">Export CSV ↗</button>'}</div><div class="filters"><div class="tabs">${tabs.map(s => `<button data-filter="${s}" aria-pressed="${filter === s}" class="${filter === s ? 'active' : ''}">${s}${tabCount(s)}</button>`).join('')}</div><label class="search">${icon('search')}<input id="search" placeholder="Search projects…" aria-label="Search projects" value="${esc(query)}"></label></div><div class="table-wrap"><table><thead><tr><th>Project name</th><th>Status</th><th>Progress</th><th>Lead</th><th>Deadline</th></tr></thead><tbody>${list.map(p => `<tr><td class="project-identity"><div class="project-cell"><span class="project-symbol ${esc(p.color)}">${esc(p.symbol)}</span><div><button class="project-name" data-project="${esc(p.id)}">${esc(p.name)}</button><span class="project-client">${esc(p.client)}${currentPhase(p) && p.status !== 'Completed' ? ` · ${esc(currentPhase(p).title)}` : ''}</span></div></div></td><td class="status-cell">${badge(p.status)}</td><td class="progress-cell"><div class="progress-line"><span class="progress-track"><i style="width:${Math.max(0, Math.min(100, Number(p.progress) || 0))}%"></i></span>${Number(p.progress) || 0}%</div></td><td class="lead-cell"><span class="avatar mini-avatar" title="${esc(p.lead)}">${esc(initials(p.lead))}</span></td><td class="deadline"><span class="mobile-label">Deadline</span>${esc(fmt(p.deadline))}</td></tr>`).join('')}</tbody></table>${!list.length ? '<div class="empty">No projects match this view.<br>Try a different search or status filter.</div>' : ''}</div><div class="table-footer"><span>Showing ${list.length} of ${source.length} ${filter === 'Archived' ? 'archived ' : ''}projects</span></div></section>`;
}

function deadlines() {
  const list = visibleProjects().filter(p => p.status !== 'Completed').sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  return `<section class="panel"><div class="panel-heading"><h2>Delivery deadlines</h2>${icon('calendar')}</div>${list.map(p => `<div class="deadline-item"><div class="date-box">${date(p.deadline).getDate()}<small>${date(p.deadline).toLocaleDateString('en', { month: 'short' })}</small></div><div><strong><button class="project-name" data-project="${esc(p.id)}">${esc(p.name)}</button></strong><p>${esc(p.client)}</p><span class="due">${esc(p.deadline < todayKey() ? 'Overdue' : p.status === 'At risk' ? 'Needs attention' : p.status === 'In review' ? 'Final review' : 'Delivery milestone')}</span></div></div>`).join('') || '<div class="empty">No upcoming deadlines.</div>'}<button class="panel-link" data-go="projects">See all project deadlines ↗</button></section>`;
}

function activity() {
  // With Convex, clients already receive only their company's activity; a team member
  // previewing the client view sees that client's entries. The demo uses sample entries.
  const items = !backend
    ? (role === 'client' ? clientActivity : activityItems)
    : role === 'client' && !isClientAccount() ? activityItems.filter(a => a[3] === clientName()) : activityItems;
  return `<section class="panel"><div class="panel-heading"><h2>Recent activity</h2>${icon('clock')}</div><div class="activity-list">${items.map(([name, text, context]) => `<div class="activity-item"><span class="avatar">${esc(initials(name))}</span><div><p><strong>${esc(name)}</strong> ${esc(text)}</p><small>${esc(context)}</small></div></div>`).join('')}</div></section>`;
}

function feedbackPreview(f) {
  if (!f) return '<div class="empty">You’re all caught up. No feedback needs review.</div>';
  const p = projects.find(p => p.id === f.project || p._id === f.project);
  return `<div class="feedback-preview"><span class="avatar">${esc(initials(f.author))}</span><div><strong>${esc(f.author)}</strong><small>${esc(f.client)}</small><p>“${esc(f.text)}”</p><span class="feedback-project">${esc(p?.name || 'Project')}</span></div></div>`;
}

let documents = [
  { name: 'Project brief', description: 'Who the app is for, what it must do, and how we’ll measure success.', type: 'Brief', project: 's1', body: 'Courier app: project brief\nClient: Sankofa Delivery\n\nUsers: customers sending parcels in Accra; riders; dispatch staff.\nMust have: book a pickup, live tracking, mobile money payment, delivery photo as proof.' },
  { name: 'Launch checklist', description: 'Everything to confirm before the site goes live.', type: 'Checklist', project: 's2', body: 'Launch checklist\n- Menu prices confirmed by the café\n- Mobile money payments tested\n- Pickup and delivery areas set\n- Staff trained on the specials screen' },
  { name: 'Data feed specification', description: 'Format and timing of the shipping-line exports.', type: 'Plan', project: 's3', body: 'Data feed specification\nSource: daily CSV exports from three shipping lines\nFields: container number, vessel, status, location, last event time' }
];

const fileSize = bytes => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function resources() {
  const canEdit = canEditProjects() && visibleProjects().length > 0;
  // data-download / data-remove-resource are the document's position in the full list.
  const cards = documents.map((d, i) => [d, i]).filter(([d]) => visibleProjects().some(p => p.id === d.project || p._id === d.project)).map(([d, i]) => {
    const open = d.url
      ? `<a class="secondary" href="${esc(d.url)}" target="_blank" rel="noopener">Open ${esc(d.type.toLowerCase())} ↗</a>`
      : `<button class="secondary" data-download="${i}">Download ${esc(d.type.toLowerCase())} ↗</button>`;
    const file = d.fileName ? `<small class="resource-file">${esc(d.fileName)}${d.fileSize ? ` · ${fileSize(d.fileSize)}` : ''}</small>` : '';
    return `<article class="panel resource-card">${icon('resources')}<h3>${esc(d.name)}</h3><span class="feedback-project">${esc(projectFor(d)?.name || '')}</span><p>${esc(d.description)}</p>${file}<div class="card-actions">${open}${canEdit ? `<button class="text-button" data-remove-resource="${i}">Remove</button>` : ''}</div></article>`;
  }).join('');
  const toolbar = canEdit ? '<div class="page-actions"><button class="primary" id="addResource">+ Add resource</button></div>' : '';
  return toolbar + (cards ? `<div class="resource-grid">${cards}</div>` : '<div class="panel empty">No resources have been shared yet.</div>');
}

function feedbackPage() {
  // Clients share feedback on their own projects; the team reviews it; admins can delete it.
  const toolbar = isClientAccount() && visibleProjects().length ? '<div class="page-actions"><button class="primary" id="shareFeedback">+ Share feedback</button></div>' : '';
  const items = feedback.filter(f => visibleProjects().some(p => p.id === f.project || p._id === f.project));
  if (!items.length) return toolbar + '<div class="panel empty">No client feedback has been shared yet.</div>';
  return toolbar + items.map(f => {
    const review = role === 'team' ? `<button class="text-button" data-review="${esc(f.id)}">${f.status === 'Needs review' ? 'Mark as reviewed' : 'Reviewed ✓'}</button>` : badge(f.status);
    const remove = role === 'team' && isAdminAccount() && f._id ? `<button class="text-button danger-text" data-delete-feedback="${esc(f._id)}" data-author="${esc(f.author)}">Delete</button>` : '';
    return `<article class="panel feedback-card"><div class="feedback-head"><span class="avatar">${esc(initials(f.author))}</span><div><strong>${esc(f.author)}</strong><small>${esc(f.client)} · ${esc(f.date)}</small></div></div><p>${esc(f.text)}</p><div class="card-actions"><span class="feedback-project">${esc(projectFor(f)?.name || 'Project')}</span><span class="card-actions-end">${review}${remove}</span></div></article>`;
  }).join('');
}

function team() {
  const active = name => projects.filter(p => p.lead === name && p.status !== 'Completed').length;
  const card = (name, detail, sub) => `<article class="panel team-card"><span class="avatar">${esc(initials(name))}</span><h3>${esc(name)}</h3><p>${esc(detail)}</p>${sub ? `<p class="team-email">${esc(sub)}</p>` : ''}<p>${plural(active(name), 'active project', 'active projects')}</p><button class="secondary" data-lead="${esc(name)}">View projects</button></article>`;
  if (!isTeamAccount()) {
    const roles = ['Project manager', 'Product designer', 'Software engineer', 'Business analyst'];
    return `<div class="team-grid">${DEMO_LEADS.map((name, i) => card(name, roles[i], '')).join('')}</div>`;
  }
  // Everyone with a staff account, then project leads who don't have one (e.g. from imported projects).
  const staffNames = new Set(staffList.map(s => s.name));
  const others = [...new Set(projects.map(p => p.lead))].filter(n => n && !staffNames.has(n)).sort();
  return `<div class="team-grid">${staffList.map(s => card(s.name, s.role === 'admin' ? 'Admin' : 'Trodas team', s.email)).join('')}${others.map(n => card(n, 'Project lead · no portal account', '')).join('')}</div>`;
}

function settings() {
  const url = String(window.ELLIX_CONFIG.convexUrl || '').trim();
  const status = {
    live: 'Connected. Projects are stored in Convex and update live for everyone who is signed in.',
    connecting: 'Connecting to Convex…',
    error: `Convex isn’t returning projects for this session. ${backendError}`,
    demo: 'Convex isn’t configured yet, so you’re viewing demo projects saved in this browser.'
  }[backendState];
  const where = url
    ? `<p>Deployment: <code>${esc(url)}</code></p>`
    : '<p>Add your deployment URL to <code>config.js</code> as <code>convexUrl</code>. <code>npx convex dev</code> prints it and saves it in <code>.env.local</code> as <code>CONVEX_URL</code>.</p>';
  return `<section class="panel settings-panel"><h2>Backend connection</h2><p>${esc(status)}</p>${where}<p>To copy projects over from the old local API, run <code>npm run convex:import-projects</code>. Projects that were already imported are skipped.</p><p>Convex checks every request: admins manage people and client companies, team members see and edit every project, clients see only their company’s projects read-only, and new sign-ins wait for access unless they were invited. The Client view switch is a preview for the team.</p></section>`;
}

// ── Admin page ───────────────────────────────────────────────────────────────
const accessValue = (role, client) => role === 'client' ? `client:${client}` : role || 'none';
const accessLabel = (role, client) => ({ admin: 'Admin', team: 'Trodas team', client: `Client · ${client}` }[role] || 'Waiting for access');
const roleKey = role => role || 'waiting';
const rolePill = (role, client) => `<span class="role-pill role-${roleKey(role)}">${esc(accessLabel(role, client))}</span>`;
const signedInAt = ms => new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function ago(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172800) return 'yesterday';
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} days ago`;
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
// "client:Osu Bakery & Café" → { role: 'client', client: 'Osu Bakery & Café' }
function parseAccess(value) {
  const [role, ...rest] = String(value).split(':');
  return role === 'client' ? { role, client: rest.join(':') } : { role };
}
function accessOptions(selected, { includeNone }) {
  const choices = [...(includeNone ? [['none', 'Waiting for access']] : []), ['admin', 'Admin'], ['team', 'Trodas team'], ...clientsList.map(c => [`client:${c.name}`, `Client · ${c.name}`])];
  return choices.map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
}
const cardHead = (iconName, title, text) => `<div class="admin-card-head"><span class="admin-card-icon">${icon(iconName)}</span><div><h2>${title}</h2><p>${esc(text)}</p></div></div>`;

function adminPage() {
  const counts = { admin: 0, team: 0, client: 0, waiting: 0 };
  people.forEach(u => { counts[roleKey(u.role)]++; });
  const companies = new Set(people.filter(u => u.role === 'client').map(u => u.client)).size;
  const waiting = counts.waiting + invites.pending.length;
  const tiles = [
    ['admin', 'Admins', counts.admin, 'Manage people and client companies'],
    ['team', 'Trodas team', counts.team, 'See and update every project'],
    ['client', 'Client accounts', counts.client, companies ? `Across ${plural(companies, 'company', 'companies')}` : 'No client accounts yet'],
    ['waiting', 'Waiting', waiting, invites.pending.length ? `${plural(invites.pending.length, 'invite', 'invites')} not accepted yet` : 'Everyone has access']
  ];
  const summary = `<div class="admin-summary">${tiles.map(([key, label, n, note]) => `<div class="admin-stat role-${key}${key === 'waiting' && waiting ? ' is-attention' : ''}"><span>${label}</span><strong>${n}</strong><small>${esc(note)}</small></div>`).join('')}</div>`;
  const tabs = [['people', 'People', people.length + invites.pending.length], ['clients', 'Client companies', clientsList.length], ['log', 'Access log', null]];
  const bar = `<div class="admin-tabs" role="tablist" aria-label="Admin sections">${tabs.map(([id, label, count]) => `<button role="tab" data-admin-tab="${id}" aria-selected="${adminTab === id}" class="${adminTab === id ? 'active' : ''}">${label}${count === null ? '' : ` <span>${count}</span>`}</button>`).join('')}</div>`;
  return summary + bar + (adminTab === 'clients' ? adminClients() : adminTab === 'log' ? adminLog() : adminPeople());
}

function adminPeople() {
  const help = invites.canEmail
    ? 'Clerk emails them a sign-up link. The access you choose applies the moment they first sign in.'
    : 'Save their access here, then invite them from Clerk (Users → Invitations). The access applies the moment they first sign in.';
  const pending = invites.pending.map(i => `<li class="invite-item"><span class="avatar role-avatar role-${roleKey(i.role)}">${esc(i.email[0].toUpperCase())}</span><div class="person-main"><strong>${esc(i.email)}</strong><small>${rolePill(i.role, i.client)}<span>by ${esc(i.invitedByName)} · ${esc(ago(i.createdAt))}</span></small></div><span class="mail-state${i.emailSent ? ' is-sent' : ''}">${i.emailSent ? 'Email sent' : 'No email sent'}</span><button class="text-button danger-text" data-revoke="${esc(i._id)}" data-email="${esc(i.email)}">Cancel</button></li>`).join('');
  const inviteCard = `<section class="panel admin-card invite-card">${cardHead('invite', 'Invite someone', help)}<form id="inviteForm" class="admin-form" novalidate><label>Email<input id="inviteEmail" name="email" type="text" inputmode="email" autocomplete="off" maxlength="254" placeholder="name@company.com" value="${esc(drafts.inviteEmail)}"></label><label>Access<select id="inviteAccess" name="access">${accessOptions(drafts.inviteAccess, { includeNone: false })}</select></label><button class="primary" type="submit">${icon('invite')}${invites.canEmail ? 'Send invite' : 'Save invite'}</button></form>${pending ? `<div class="admin-subsection"><h3>Invited, not signed in yet <span class="count-pill">${invites.pending.length}</span></h3><ul class="invite-list">${pending}</ul></div>` : ''}</section>`;

  const count = key => key === 'all' ? people.length : people.filter(u => roleKey(u.role) === key).length;
  const filters = [['all', 'Everyone'], ['admin', 'Admins'], ['team', 'Team'], ['client', 'Clients'], ['waiting', 'Waiting']];
  const q = drafts.peopleQuery.trim().toLowerCase();
  const shown = people.filter(u => (peopleFilter === 'all' || roleKey(u.role) === peopleFilter) && (!q || `${u.name} ${u.email || ''} ${u.client || ''}`.toLowerCase().includes(q)));
  const rows = shown.map(u => {
    const self = u._id === viewer?._id;
    return `<li class="person-row"><span class="avatar role-avatar role-${roleKey(u.role)}">${esc(initials(u.name))}</span><div class="person-main"><strong>${esc(u.name)}${self ? ' <span class="count-pill">You</span>' : ''}</strong><small>${esc(u.email || 'No email on file')}</small></div><div class="person-meta">${rolePill(u.role, u.client)}<small>Signed in ${esc(ago(u.lastSignedInAt))}</small></div><select class="person-access" data-access="${esc(u._id)}" data-name="${esc(u.name)}" aria-label="Access for ${esc(u.name)}" ${self ? 'disabled title="Ask another admin to change your access."' : ''}>${accessOptions(accessValue(u.role, u.client), { includeNone: true })}</select></li>`;
  }).join('');
  const peopleCard = `<section class="panel admin-card">${cardHead('team', 'People', 'Everyone who has signed in. Change someone’s access with the menu on their row; it applies straight away. You can’t change your own.')}<div class="people-toolbar"><div class="filter-chips" role="group" aria-label="Show">${filters.map(([key, label]) => `<button class="chip${peopleFilter === key ? ' active' : ''}" data-people-filter="${key}" aria-pressed="${peopleFilter === key}">${label} <span>${count(key)}</span></button>`).join('')}</div><label class="search people-search">${icon('search')}<input id="peopleQuery" placeholder="Search people…" aria-label="Search people" value="${esc(drafts.peopleQuery)}"></label></div><ul class="person-list">${rows || `<li class="empty">${people.length ? 'No one matches.' : 'No one has signed in yet.'}</li>`}</ul></section>`;
  return `<div class="admin-people">${inviteCard}${peopleCard}</div>`;
}

function adminClients() {
  const cards = clientsList.map(c => {
    const own = [...projects, ...archivedProjects].filter(p => p.client === c.name);
    const active = own.filter(p => !p.archived && p.status !== 'Completed');
    const accounts = people.filter(u => u.client === c.name);
    const unused = !own.length && !accounts.length && !invites.pending.some(i => i.client === c.name);
    if (renamingClient === c._id) {
      return `<li class="client-card is-editing"><form data-rename-form="${esc(c._id)}" data-old="${esc(c.name)}" novalidate><label>Rename ${esc(c.name)}<input id="renameClient" name="name" maxlength="60" value="${esc(drafts.renameClient)}"></label><p class="field-hint">Use another client’s exact name to merge the two.</p><div class="row-actions"><button class="primary" type="submit">Save</button><button class="secondary" type="button" data-rename-cancel>Cancel</button></div></form></li>`;
    }
    const list = active.length
      ? `<ul class="client-projects">${active.slice(0, 3).map(p => `<li><button class="project-name" data-project="${esc(p.id)}">${esc(p.name)}</button>${badge(p.status)}</li>`).join('')}${active.length > 3 ? `<li class="more">+ ${active.length - 3} more</li>` : ''}</ul>`
      : `<p class="client-quiet">${own.length ? 'No active projects.' : 'No projects yet.'}</p>`;
    const people_ = accounts.length ? `<div class="client-people">${accounts.slice(0, 4).map(u => `<span class="avatar role-avatar role-client" title="${esc(u.name)}">${esc(initials(u.name))}</span>`).join('')}</div>` : '';
    return `<li class="client-card"><div class="client-card-head"><span class="project-symbol ${esc(own[0]?.color || '')}">${esc(c.name[0].toUpperCase())}</span><div><strong>${esc(c.name)}</strong><small>${plural(own.length, 'project', 'projects')} · ${plural(accounts.length, 'client account', 'client accounts')}</small></div>${people_}</div>${list}<div class="row-actions"><button class="secondary" data-rename="${esc(c._id)}" data-name="${esc(c.name)}">Rename</button>${unused ? `<button class="text-button danger-text" data-remove-client="${esc(c._id)}" data-name="${esc(c.name)}">Remove</button>` : ''}</div></li>`;
  }).join('');
  return `<section class="panel admin-card">${cardHead('building', 'Client companies', 'Projects, client accounts and invites all pick from this list, so a typo can’t hide a client’s projects. Renaming updates everything that uses the name.')}<form id="clientForm" class="admin-form client-add" novalidate><label>Add a client company<input id="newClient" name="name" maxlength="60" autocomplete="off" placeholder="e.g. Labadi Beach Hotel" value="${esc(drafts.newClient)}"></label><button class="primary" type="submit">Add client</button></form><ul class="client-grid">${cards || '<li class="empty">No client companies yet.</li>'}</ul></section>`;
}

function logKind(action) {
  if (/deleted|cancelled|removed/.test(action)) return 'trash';
  if (/invit|pre-approved/.test(action)) return 'invite';
  if (/client|sample/.test(action)) return 'building';
  if (/access|admin/.test(action)) return 'key';
  return 'check';
}

function adminLog() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 864e5).toDateString();
  const dayLabel = ms => {
    const d = new Date(ms).toDateString();
    return d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(ms).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const groups = [];
  for (const e of auditEntries) {
    const label = dayLabel(e.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }
  const body = groups.map(g => `<li class="log-day"><h3>${esc(g.label)}</h3><ol class="log-entries">${g.items.map(e => { const kind = logKind(e.action); return `<li class="log-entry kind-${kind}"><span class="log-icon">${icon(kind)}</span><p><strong>${esc(e.actorName)}</strong> ${esc(e.action)}</p><time datetime="${new Date(e.createdAt).toISOString()}">${esc(new Date(e.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}</time></li>`; }).join('')}</ol></li>`).join('');
  return `<section class="panel admin-card">${cardHead('clock', 'Access log', 'Invites, access changes, client companies and deletions, newest first. Only admins see this.')}<ol class="log-days">${body || '<li class="empty">No changes yet.</li>'}</ol></section>`;
}

// Runs one admin action: disables the button, shows the outcome, re-renders.
async function adminAction(button, work) {
  if (!isAdminAccount()) return;
  if (button) button.disabled = true;
  try {
    const message = await work();
    if (message) toast(message);
  } catch (e) {
    toast(errorMessage(e));
  } finally {
    if (button) button.disabled = false;
    renderKeepingFocus();
  }
}

function bindAdmin() {
  document.querySelectorAll('[data-admin-tab]').forEach(b => {
    b.onclick = () => { adminTab = b.dataset.adminTab; renamingClient = null; render(); };
  });
  document.querySelectorAll('[data-people-filter]').forEach(b => {
    b.onclick = () => { peopleFilter = b.dataset.peopleFilter; render(); };
  });
  if ($('#peopleQuery')) $('#peopleQuery').oninput = e => { drafts.peopleQuery = e.target.value; renderKeepingFocus(); };
  [['#inviteEmail', 'inviteEmail'], ['#inviteAccess', 'inviteAccess'], ['#newClient', 'newClient'], ['#renameClient', 'renameClient']].forEach(([sel, key]) => {
    const el = $(sel);
    if (el) el.oninput = el.onchange = () => { drafts[key] = el.value; };
  });
  if ($('#inviteForm')) $('#inviteForm').onsubmit = e => {
    e.preventDefault();
    const email = drafts.inviteEmail.trim();
    if (!email) { toast('Enter their email address.'); $('#inviteEmail').focus(); return; }
    adminAction(e.submitter, async () => {
      const result = await backend.action('invites:send', { email, ...parseAccess(drafts.inviteAccess), redirectUrl: new URL('login.html', location.href).href });
      drafts.inviteEmail = '';
      if (result.emailed) return `Invite emailed to ${email}.`;
      if (result.reason === 'no-key') return `Access saved for ${email}. Now invite them in Clerk → Users → Invitations.`;
      return `Access saved for ${email}, but Clerk didn’t send the email: ${result.reason}`;
    });
  };
  document.querySelectorAll('[data-revoke]').forEach(b => {
    b.onclick = () => adminAction(b, async () => {
      await backend.action('invites:revoke', { id: b.dataset.revoke });
      return `Invite for ${b.dataset.email} cancelled.`;
    });
  });
  document.querySelectorAll('[data-access]').forEach(select => {
    select.onchange = () => adminAction(select, async () => {
      await backend.mutation('users:setAccess', { userId: select.dataset.access, ...parseAccess(select.value) });
      return `Access updated for ${select.dataset.name}.`;
    });
  });
  if ($('#clientForm')) $('#clientForm').onsubmit = e => {
    e.preventDefault();
    const name = drafts.newClient.trim();
    if (!name) { toast('Enter the company name.'); $('#newClient').focus(); return; }
    adminAction(e.submitter, async () => {
      await backend.mutation('clients:create', { name });
      drafts.newClient = '';
      return `${name} added to the client list.`;
    });
  };
  document.querySelectorAll('[data-rename]').forEach(b => {
    b.onclick = () => {
      renamingClient = b.dataset.rename;
      drafts.renameClient = b.dataset.name;
      render();
      $('#renameClient')?.focus();
      $('#renameClient')?.select();
    };
  });
  document.querySelectorAll('[data-rename-cancel]').forEach(b => { b.onclick = () => { renamingClient = null; render(); }; });
  document.querySelectorAll('[data-rename-form]').forEach(form => {
    form.onsubmit = e => {
      e.preventDefault();
      const name = drafts.renameClient.trim();
      if (!name) { toast('Enter the new name.'); return; }
      adminAction(e.submitter, async () => {
        const { merged } = await backend.mutation('clients:rename', { id: form.dataset.renameForm, name });
        renamingClient = null;
        return merged ? `${form.dataset.old} merged into ${name}.` : `${form.dataset.old} renamed to ${name}.`;
      });
    };
  });
  document.querySelectorAll('[data-remove-client]').forEach(b => {
    b.onclick = () => adminAction(b, async () => {
      await backend.mutation('clients:remove', { id: b.dataset.removeClient });
      return `${b.dataset.name} removed from the client list.`;
    });
  });
}

function navigate(next) {
  page = next;
  filter = 'All projects';
  query = '';
  render();
  setMenu(false);
  window.scrollTo(0, 0);
}

function bindContent() {
  document.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => navigate(b.dataset.go); });
  document.querySelectorAll('[data-project]').forEach(b => { b.onclick = () => openProject(b.dataset.project); });
  document.querySelectorAll('[data-filter]').forEach(b => { b.onclick = () => { filter = b.dataset.filter; render(); }; });
  if ($('#search')) $('#search').oninput = e => {
    const pos = e.target.selectionStart;
    query = e.target.value;
    render();
    $('#search').focus();
    $('#search').setSelectionRange(pos, pos);
  };
  document.querySelectorAll('[data-lead]').forEach(b => { b.onclick = () => { page = 'projects'; query = b.dataset.lead; render(); }; });
  document.querySelectorAll('[data-download]').forEach(b => {
    b.onclick = () => {
      const d = documents[Number(b.dataset.download)];
      if (d) download(`${d.name}.txt`, d.body || '', 'text/plain');
    };
  });
  if ($('#addResource')) $('#addResource').onclick = addResourceForm;
  document.querySelectorAll('[data-remove-resource]').forEach(b => {
    b.onclick = async () => {
      const d = documents[Number(b.dataset.removeResource)];
      if (!d || !confirm(`Remove “${d.name}”? The client won’t see it any more.`)) return;
      b.disabled = true;
      try {
        if (backend) await backend.mutation('resources:remove', { id: d._id });
        else { documents.splice(Number(b.dataset.removeResource), 1); render(); }
        toast(`${d.name} removed.`);
      } catch (err) {
        toast(errorMessage(err));
        b.disabled = false;
      }
    };
  });
  if ($('#shareFeedback')) $('#shareFeedback').onclick = shareFeedbackForm;
  document.querySelectorAll('[data-delete-feedback]').forEach(b => {
    b.onclick = async () => {
      if (!confirm(`Delete this feedback from ${b.dataset.author}? This can’t be undone.`)) return;
      b.disabled = true;
      try {
        await backend.mutation('feedback:remove', { id: b.dataset.deleteFeedback });
        toast('Feedback deleted.');
      } catch (err) {
        toast(errorMessage(err));
        b.disabled = false;
      }
    };
  });
  document.querySelectorAll('[data-review]').forEach(b => {
    b.onclick = async () => {
      if (role !== 'team') return;
      const f = feedback.find(item => item.id === b.dataset.review);
      if (!f || f.status === 'Reviewed') return;
      b.disabled = true;
      try {
        if (backend && backendState === 'live' && f._id) {
          await backend.mutation('feedback:review', { id: f._id });
        } else {
          f.status = 'Reviewed';
          logActivity(signedInName(), 'marked client feedback as reviewed.', f.author);
          persist();
          render();
        }
        toast('Feedback marked as reviewed.');
      } catch (err) {
        toast('Could not update feedback: ' + errorMessage(err));
      } finally {
        b.disabled = false;
      }
    };
  });
  if (page === 'admin') bindAdmin();
  if ($('#exportProjects')) $('#exportProjects').onclick = () => download('trodas-projects.csv', 'Project,Client,Status,Progress,Lead,Deadline\n' + visibleProjects().map(p => [p.name, p.client, p.status, p.progress, p.lead, p.deadline].map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv');
}

// One reusable dialog for small forms. onSubmit returns a message to show, or false to keep
// the dialog open (for example when something is missing).
function openForm({ title, intro, body, submit, onSubmit }) {
  const dialog = $('#formDialog');
  const form = $('#formDialogForm');
  form.innerHTML = `<div class="dialog-heading"><div><h2 id="formTitle">${esc(title)}</h2>${intro ? `<p>${esc(intro)}</p>` : ''}</div><button type="button" class="close" data-close aria-label="Close">×</button></div>${body}<div class="dialog-actions"><button type="button" class="secondary" data-close>Cancel</button><button class="primary" type="submit">${esc(submit)}</button></div>`;
  form.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => dialog.close(); });
  form.onsubmit = async e => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const data = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(data)) if (typeof data[key] === 'string') data[key] = data[key].trim();
    button.disabled = true;
    try {
      const message = await onSubmit(data);
      if (message === false) return;
      dialog.close();
      render();
      if (message) toast(message);
    } catch (err) {
      toast(errorMessage(err));
    } finally {
      button.disabled = false;
    }
  };
  dialog.showModal();
  form.querySelector('input, select, textarea')?.focus();
}

const MAX_UPLOAD = 25 * 1048576;

function addResourceForm() {
  const projectChoices = visibleProjects().map(p => `<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.client)}</option>`).join('');
  const types = ['Brief', 'Plan', 'Checklist', 'Report', 'Design', 'Contract', 'Notes', 'Other'];
  openForm({
    title: 'Add a resource',
    intro: 'Share a file or a written document on a project. Everyone on the project, including its client, can open it.',
    submit: 'Add resource',
    body: `<label>Project<select name="project">${projectChoices}</select></label><label>Title<input name="name" maxlength="80" placeholder="e.g. Launch checklist"></label><label>Type<select name="type">${types.map(t => `<option>${t}</option>`).join('')}</select></label><label>Short description<input name="description" maxlength="300" placeholder="What it’s for"></label>${backend ? '<label>File <small class="field-hint">PDF, Word, image… up to 25 MB</small><input name="file" type="file"></label><p class="field-hint">Or, instead of a file, write the content:</p>' : ''}<label>${backend ? 'Written content' : 'Content'}<textarea name="body" rows="5" maxlength="100000" placeholder="Paste or write the document’s text"></textarea></label>`,
    onSubmit: async data => {
      const file = data.file instanceof File && data.file.size ? data.file : null;
      if (!data.name) { toast('Give the resource a title.'); return false; }
      if (!file && !data.body) { toast(backend ? 'Choose a file or write the content.' : 'Write the content.'); return false; }
      if (file && file.size > MAX_UPLOAD) { toast('That file is over 25 MB. Choose a smaller one.'); return false; }
      if (!backend) {
        documents.unshift({ name: data.name, description: data.description, type: data.type, project: data.project, body: data.body });
        return `${data.name} shared.`;
      }
      let fileId;
      if (file) {
        toast(`Uploading ${file.name}…`);
        const uploadUrl = await backend.mutation('resources:generateUploadUrl', {});
        const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
        if (!res.ok) throw new Error('The file couldn’t be uploaded. Try again.');
        fileId = (await res.json()).storageId;
      }
      await backend.mutation('resources:create', {
        project: data.project, name: data.name, type: data.type, description: data.description,
        ...(file ? { fileId, fileName: file.name } : { body: data.body })
      });
      return `${data.name} shared.`;
    }
  });
}

function shareFeedbackForm() {
  openForm({
    title: 'Share feedback',
    intro: 'Your Trodas project team sees it straight away.',
    submit: 'Share feedback',
    body: `<label>Project<select name="project">${visibleProjects().map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>Your feedback<textarea name="text" rows="5" maxlength="1000" placeholder="What’s working well, and what should change?"></textarea></label>`,
    onSubmit: async data => {
      if (!data.text) { toast('Write your feedback first.'); return false; }
      await backend.mutation('feedback:create', { project: data.project, text: data.text });
      return 'Thanks. Your feedback was shared with the Trodas team.';
    }
  });
}

function download(name, body, type) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  toast('Download ready.');
}

function openProject(id) {
  const p = visibleProjects().find(item => item.id === id) || (role === 'team' ? archivedProjects.find(item => item.id === id) : null);
  if (!p) return;
  const staff = canEditProjects();
  const live = Boolean(backend);
  const statusForm = staff && !p.archived ? `<div class="detail-section"><h3>Update delivery status</h3><select id="statusUpdate" aria-label="Project status">${statuses.map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select><label style="margin-top:15px">Progress (%)<input id="progressUpdate" type="number" min="0" max="100" value="${p.progress}"></label><button class="primary" id="saveStatus">Save update</button></div>` : '';
  const editForm = staff && !p.archived ? `<details class="detail-section edit-details"><summary>Edit project details</summary><form id="editProjectForm" novalidate><label>Project name<input name="name" maxlength="80" value="${esc(p.name)}"></label><label>Client<input name="client" maxlength="60" list="clientOptions" autocomplete="off" value="${esc(p.client)}"></label><div class="form-grid"><label>Deadline<input name="deadline" type="date" value="${esc(p.deadline)}"></label><label>Project lead<select name="lead">${leadOptions(p.lead)}</select></label></div><label>Description<textarea name="description" rows="3" maxlength="500">${esc(p.description)}</textarea></label><button class="primary" type="submit">Save details</button></form></details>` : '';
  const manage = staff && live ? `<div class="detail-section project-manage">${p.archived
    ? `<p>This project is archived. It’s hidden from every list and from the client.</p><div class="card-actions"><button class="secondary" id="restoreProject">Restore project</button>${isAdminAccount() ? '<button class="danger" id="deleteProject">Delete permanently</button>' : ''}</div>`
    : '<button class="secondary" id="archiveProject">Archive project</button>'}</div>` : '';
  const shared = documents.filter(d => d.project === p.id || (p._id && d.project === p._id));
  $('#detailContent').innerHTML = `<div class="dialog-heading"><div><h2 id="detailTitle">${esc(p.name)}</h2><p>${esc(p.client)}</p></div><button class="close" data-close aria-label="Close">×</button></div><div class="detail-meta">${p.archived ? '<span class="badge archived">Archived</span>' : ''}${badge(p.status)}<span class="feedback-project">Deadline · ${fmt(p.deadline)}</span><span class="feedback-project">Lead · ${esc(p.lead)}</span></div><p style="color:var(--muted);line-height:1.8">${esc(p.description)}</p><div class="detail-section"><h3>Project progress</h3><div class="progress-line"><span class="progress-track" style="width:80%"><i style="width:${Math.max(0, Math.min(100, p.progress))}%"></i></span>${p.progress}%</div></div>${timelineSection(p, staff)}${statusForm}<div class="detail-section"><h3>Shared resources</h3>${shared.map(d => `<p>${esc(d.name)} · Available in Resources</p>`).join('') || '<p>No resources have been shared for this project.</p>'}</div>${editForm}${manage}`;
  if (!$('#detailDialog').open) $('#detailDialog').showModal();
  $('#detailDialog [data-close]').onclick = () => $('#detailDialog').close();

  // Timeline: tick a phase off (or reopen it), or edit the whole timeline.
  document.querySelectorAll('#detailContent [data-phase]').forEach(b => {
    b.onclick = async () => {
      const i = Number(b.dataset.phase);
      const done = b.getAttribute('aria-pressed') !== 'true';
      b.disabled = true;
      try {
        if (live) await backend.mutation('projects:setMilestoneDone', { id: p._id, index: i, done });
        p.milestones[i].done = done; // shown at once; the live update confirms it
        if (!live) persist();
        openProject(p.id);
        renderKeepingFocus();
        toast(done ? `${p.milestones[i].title} marked done.` : `${p.milestones[i].title} reopened.`);
      } catch (err) {
        toast(errorMessage(err));
        b.disabled = false;
      }
    };
  });
  if ($('#editTimeline')) $('#editTimeline').onclick = () => { $('#detailDialog').close(); timelineForm(p); };

  // Runs a project change, then closes the dialog and confirms.
  const run = async (button, work, message) => {
    button.disabled = true;
    try {
      await work();
      $('#detailDialog').close();
      render();
      toast(message);
    } catch (err) {
      toast(errorMessage(err));
    } finally {
      button.disabled = false;
    }
  };
  if ($('#editProjectForm')) $('#editProjectForm').onsubmit = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    for (const key of ['name', 'client', 'lead', 'description']) data[key] = String(data[key] || '').trim();
    if (!data.name || !data.client || !data.deadline) { toast('Enter a project name, client and deadline.'); return; }
    run(e.submitter, async () => {
      if (live) await backend.mutation('projects:edit', { id: p._id, ...data });
      else { Object.assign(p, data, { symbol: data.client[0].toUpperCase() }); persist(); }
    }, 'Project details saved.');
  };
  if ($('#archiveProject')) $('#archiveProject').onclick = e => run(e.currentTarget, () => backend.mutation('projects:setArchived', { id: p._id, archived: true }), `${p.name} archived. Find it under Projects → Archived.`);
  if ($('#restoreProject')) $('#restoreProject').onclick = e => run(e.currentTarget, () => backend.mutation('projects:setArchived', { id: p._id, archived: false }), `${p.name} restored.`);
  if ($('#deleteProject')) $('#deleteProject').onclick = e => {
    if (!confirm(`Delete “${p.name}” for good? Its feedback and shared resources are deleted too. This can’t be undone.`)) return;
    run(e.currentTarget, () => backend.mutation('projects:remove', { id: p._id }), `${p.name} deleted.`);
  };
  if ($('#saveStatus')) $('#saveStatus').onclick = async () => {
    if (role !== 'team') return;
    const val = Number($('#progressUpdate').value);
    if (!Number.isFinite(val) || val < 0 || val > 100 || $('#progressUpdate').value === '') {
      toast('Enter a progress value between 0 and 100.');
      return;
    }
    const changes = { status: $('#statusUpdate').value, progress: $('#statusUpdate').value === 'Completed' ? 100 : val };
    const save = $('#saveStatus');
    save.disabled = true;
    try {
      if (backend) await backend.mutation('projects:update', { id: p._id, ...changes });
      else Object.assign(p, changes);
      persist();
      logActivity(signedInName(), 'updated delivery status.', p.name);
      $('#detailDialog').close();
      render();
      toast('Project updated.');
    } catch (e) {
      toast('Update failed: ' + errorMessage(e));
    } finally {
      save.disabled = false;
    }
  };
}

// ConvexError carries a readable message in .data; other errors only have .message.
const errorMessage = e => (typeof e?.data === 'string' ? e.data : e?.message) || 'Something went wrong.';

// Convex documents → the shape the views use. Imported projects keep their old id
// (p1, p2…) because demo feedback and resources still point at it.
function applyProjects(docs) {
  const all = docs.map(doc => ({ ...doc, id: doc.legacyId || doc._id }));
  projects = all.filter(p => !p.archived);
  archivedProjects = all.filter(p => p.archived);
}

function applyFeedback(docs) {
  feedback = docs.map(doc => ({
    _id: doc._id,
    id: doc.legacyId || doc._id,
    author: doc.author,
    client: doc.client,
    project: doc.projectLegacyId || (doc.projectId ? String(doc.projectId) : ''),
    text: doc.text,
    date: doc.date,
    status: doc.status
  }));
}

function applyActivity(docs) {
  activityItems = docs.map(doc => [doc.actor, doc.action, doc.context, doc.client]);
}

function applyResources(docs) {
  documents = docs.map(doc => ({
    _id: doc._id,
    id: doc.legacyId || doc._id,
    name: doc.name,
    description: doc.description,
    type: doc.type,
    project: doc.projectLegacyId || (doc.projectId ? String(doc.projectId) : ''),
    client: doc.client,
    body: doc.body,
    url: doc.url || null, // uploaded files: a link from Convex storage
    fileName: doc.fileName || null,
    fileSize: doc.fileSize || null
  }));
}

function setBackendState(state, message = '') {
  backendState = state;
  backendError = message;
  $('#connectionState').textContent = { live: 'Live · Convex', connecting: 'Connecting…', pending: 'Waiting for access', error: 'Backend offline', demo: 'Demo workspace' }[state];
  $('#saveState').innerHTML = {
    live: '<i class="online-dot"></i> Changes sync to Convex',
    connecting: 'Connecting to Convex…',
    pending: 'Waiting for an admin to give you access.',
    error: 'Not connected. Changes can’t be saved right now.',
    demo: '<i class="online-dot"></i> All changes saved locally'
  }[state];
  renderKeepingFocus();
}

function connectProjects(client) {
  if (backend) return;
  backend = client;
  // Access is decided by Convex (users:current); projects load only once there is access.
  client.onUpdate('users:current', {}, applyViewer, error => {
    console.warn('[access] Could not read your access from Convex.', error);
    setBackendState('error', errorMessage(error));
  });
}

// Subscribe to a query while `wanted` is true, unsubscribe (and clear its data) when it isn't.
function keepSubscribed(name, wanted, apply) {
  if (wanted && !optionalSubs[name]) {
    const sub = backend.onUpdate(name, {}, value => {
      if (optionalSubs[name] !== sub) return;
      apply(value);
      renderKeepingFocus();
    }, error => console.warn(`[${name}] Convex query failed.`, error));
    optionalSubs[name] = sub;
  } else if (!wanted && optionalSubs[name]) {
    optionalSubs[name]();
    delete optionalSubs[name];
    apply(null);
  }
}

function applyViewer(me) {
  const previousRole = viewer?.role;
  viewer = me;
  const staff = isStaffRole(me?.role);
  const admin = me?.role === 'admin';
  const hasAccess = staff || (me?.role === 'client' && Boolean(me.client));

  // Client accounts are locked to the client view; a promotion to staff returns to the team view.
  if (me?.role === 'client') role = 'client';
  else if (staff && !isStaffRole(previousRole)) role = 'team';
  $('#role').value = role;

  keepSubscribed('clients:list', staff, list => { clientsList = list || []; });
  keepSubscribed('users:staff', staff, list => { staffList = list || []; });
  keepSubscribed('users:list', admin, list => { people = list || []; });
  keepSubscribed('invites:list', admin, value => { invites = value || { canEmail: false, pending: [] }; });
  keepSubscribed('audit:list', admin, list => { auditEntries = list || []; });

  if (hasAccess && !projectsSub) {
    const sub = backend.onUpdate('projects:list', {}, docs => {
      if (projectsSub !== sub) return;
      applyProjects(docs);
      setBackendState('live');
    }, error => {
      if (projectsSub !== sub) return;
      console.warn('[projects] Convex query failed.', error);
      setBackendState('error', errorMessage(error));
    });
    projectsSub = sub;

    feedbackSub = backend.onUpdate('feedback:list', {}, docs => {
      applyFeedback(docs);
      renderKeepingFocus();
    }, error => console.warn('[feedback] Convex query failed.', error));

    activitySub = backend.onUpdate('activity:list', {}, docs => {
      applyActivity(docs);
      renderKeepingFocus();
    }, error => console.warn('[activity] Convex query failed.', error));

    resourcesSub = backend.onUpdate('resources:list', {}, docs => {
      applyResources(docs);
      renderKeepingFocus();
    }, error => console.warn('[resources] Convex query failed.', error));
  } else if (!hasAccess) {
    projectsSub?.();
    projectsSub = null;
    feedbackSub?.();
    feedbackSub = null;
    activitySub?.();
    activitySub = null;
    resourcesSub?.();
    resourcesSub = null;
    projects = [];
  }

  if (!hasAccess) setBackendState('pending');
  else if (backendState === 'live') renderKeepingFocus();
}

// session.js announces the Convex connection once the signed-in user is recorded.
window.addEventListener('portal:convex-ready', e => connectProjects(e.detail.client));
window.addEventListener('portal:convex-error', e => {
  if (backendState !== 'live') setBackendState('error', e.detail.message);
});

document.querySelectorAll('[data-page]').forEach(b => { b.onclick = () => navigate(b.dataset.page); });
function setMenu(open) {
  $('.sidebar').classList.toggle('open', open);
  $('#navBackdrop').hidden = !open;
  $('#mobileMenu').setAttribute('aria-expanded', String(open));
}
$('#mobileMenu').onclick = () => {
  const open = !$('.sidebar').classList.contains('open');
  setMenu(open);
  if (open) $('#navigation button:not([hidden])')?.focus();
};
function closeMenu() {
  setMenu(false);
  $('#mobileMenu').focus();
}
$('#navBackdrop').onclick = closeMenu;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('.sidebar').classList.contains('open')) closeMenu();
});
$('.brand').onclick = e => { e.preventDefault(); navigate('overview'); };
$('#role').onchange = e => {
  if (isClientAccount()) {
    e.target.value = 'client';
    return;
  }
  role = e.target.value;
  $('#projectDialog').close();
  $('#detailDialog').close();
  navigate('overview');
};
$('#previewClient').onclick = () => {
  $('#role').value = 'client';
  role = 'client';
  navigate('overview');
  toast(`Previewing ${clientName()}’s view.`);
};
$('#newProject').onclick = () => { if (role === 'team') $('#projectDialog').showModal(); };
document.querySelectorAll('#projectDialog [data-close]').forEach(b => { b.onclick = () => $('#projectDialog').close(); });
$('#projectForm').onsubmit = async e => {
  e.preventDefault();
  if (role !== 'team') return;
  const data = Object.fromEntries(new FormData(e.target));
  data.name = data.name.trim();
  data.client = data.client.trim();
  if (!data.name || !data.client) {
    toast('Enter a project name and client.');
    return;
  }
  data.description = (data.description || '').trim();
  const submit = e.target.querySelector('button.primary');
  submit.disabled = true;
  try {
    if (backend) {
      await backend.mutation('projects:create', { name: data.name, client: data.client, deadline: data.deadline, lead: data.lead, description: data.description });
    } else {
      projects.unshift({ ...data, id: crypto.randomUUID(), status: 'In progress', progress: 0, symbol: data.client[0].toUpperCase(), color: '' });
    }
    persist();
    logActivity(signedInName(), 'created a new project.', data.name);
    e.target.reset();
    $('#projectDialog').close();
    page = 'projects';
    filter = 'All projects';
    query = '';
    render();
    toast('Project created.');
  } catch (err) {
    toast('Could not create project: ' + errorMessage(err));
  } finally {
    submit.disabled = false;
  }
};

setBackendState(backendState);
setTimeout(() => {
  if (backendState !== 'connecting') return;
  slowConnection = true;
  renderKeepingFocus();
}, 12000);
