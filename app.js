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
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.projects}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initialProjects = [
  { id: 'p1', name: 'Website redesign', client: 'Acme Corporation', status: 'In progress', progress: 72, deadline: '2026-11-16', lead: 'Sarah Chen', symbol: 'A', color: '', description: 'A refreshed, accessible website that makes it easier for customers to find the right services.' },
  { id: 'p2', name: 'Cloud infrastructure', client: 'Nexus Technologies', status: 'In progress', progress: 48, deadline: '2026-11-22', lead: 'James Wilson', symbol: 'N', color: 'blue', description: 'Migrate core services to a resilient cloud environment with monitoring and automated backups.' },
  { id: 'p3', name: 'Customer portal', client: 'Bloom Studio', status: 'In review', progress: 90, deadline: '2026-11-12', lead: 'Olivia Brown', symbol: 'B', color: 'pink', description: 'A dedicated customer workspace for documents, requests, and service updates.' },
  { id: 'p4', name: 'Security audit', client: 'Acme Corporation', status: 'At risk', progress: 35, deadline: '2026-11-09', lead: 'Alex Morgan', symbol: 'A', color: '', description: 'Review access controls, identify vulnerabilities, and deliver a prioritized remediation plan.' },
  { id: 'p5', name: 'Mobile app development', client: 'Orion Health', status: 'In progress', progress: 61, deadline: '2026-12-06', lead: 'Sarah Chen', symbol: 'O', color: 'sand', description: 'Develop a mobile-first patient experience with appointment and care information.' },
  { id: 'p6', name: 'Network modernization', client: 'Nexus Technologies', status: 'Completed', progress: 100, deadline: '2026-11-02', lead: 'James Wilson', symbol: 'N', color: 'blue', description: 'Upgrade network infrastructure and document operational support procedures.' }
];
const initialFeedback = [
  { id: 'f1', author: 'Emily Parker', client: 'Acme Corporation', project: 'p1', text: 'The new homepage is looking great! Love the cleaner navigation. Could we explore a slightly larger headline in the hero section?', date: 'Nov 7, 2026', status: 'Needs review' },
  { id: 'f2', author: 'Daniel Lee', client: 'Bloom Studio', project: 'p3', text: 'The portal flow is much easier to follow. The team is ready to review the final document upload experience.', date: 'Nov 6, 2026', status: 'Needs review' }
];
const initialActivity = [
  ['Sarah Chen', 'updated the project progress.', 'Website redesign · Nov 7'],
  ['Olivia Brown', 'moved a project to review.', 'Customer portal · Nov 6'],
  ['James Wilson', 'completed the handoff.', 'Network modernization · Nov 2']
];
const clientActivity = [
  ['Sarah Chen', 'shared a website progress update.', 'Website redesign · Nov 7'],
  ['Alex Morgan', 'flagged a delivery risk.', 'Security audit · Nov 6']
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
// The signed-in person's access, from users:current: { role: 'team' | 'client' | null, client, ... }.
let viewer = null;
let projectsSub = null; // unsubscribe for projects:list
let feedbackSub = null;
let activitySub = null;
let resourcesSub = null;
let people = []; // users:list, for the People & access page (team only)
let peopleSub = null;
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
const PREVIEW_CLIENT = 'Acme Corporation';
// A real client account (enforced by Convex), as opposed to a team member previewing the client view.
const isClientAccount = () => backendState === 'live' && viewer?.role === 'client';
const isTeamAccount = () => backendState === 'live' && viewer?.role === 'team';
function clientName() {
  if (isClientAccount()) return viewer.client;
  return projects.some(p => p.client === PREVIEW_CLIENT) ? PREVIEW_CLIENT : (projects[0]?.client || PREVIEW_CLIENT);
}
const visibleProjects = () => role === 'client' ? projects.filter(p => p.client === clientName()) : projects;

function pageAllowed(name) {
  if (name === 'access') return role === 'team' && isTeamAccount();
  if (name === 'team') return role === 'team' && (backendState === 'demo' || viewer?.role === 'team');
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
    access: ['People & access', 'Decide who can sign in to the portal and what they can see.']
  };
  if (!pageAllowed(page)) page = 'overview';
  $('#pageTitle').textContent = role === 'client' && page === 'overview' ? 'Your project overview' : titles[page][0];
  $('#pageSubtitle').textContent = titles[page][1];
  $('#crumb').textContent = page === 'overview' ? 'Overview' : page === 'feedback' ? 'Client feedback' : page === 'access' ? 'People & access' : page[0].toUpperCase() + page.slice(1);
  const projectsReady = backendState === 'live' || backendState === 'demo';
  $('#newProject').hidden = role === 'client' || !projectsReady || !['overview', 'projects'].includes(page);
  // Only team members (or the demo) can switch to the client preview; client accounts are locked to it.
  const canPreview = projectsReady && !isClientAccount();
  $('#roleControl').hidden = !canPreview;
  $('.client-callout').hidden = !canPreview;
  $('#clientBanner').hidden = role !== 'client' || !projectsReady;
  $('#clientBanner').textContent = isClientAccount()
    ? `${clientName()} · A read-only view of your projects with Trodas Technologies.`
    : `Client preview · Showing ${clientName()}’s shared projects. Read-only access.`;
  $('#navCount').textContent = visibleProjects().length;
  $('#feedbackDot').hidden = !pendingFeedback().length;
  document.title = `${$('#pageTitle').textContent} — Trodas Technologies`;
  document.querySelectorAll('[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
    if (b.dataset.page === page) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
    b.hidden = !pageAllowed(b.dataset.page);
  });
  $('#content').innerHTML = page === 'settings' ? settings() : page === 'access' ? accessPage() : !projectsReady ? backendNotice() : page === 'overview' ? overview() : page === 'projects' ? projectTable() : page === 'resources' ? resources() : page === 'feedback' ? feedbackPage() : team();
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
    return `<div class="panel empty" role="status"><strong>Your account is waiting for access.</strong><br>You’re signed in as ${esc(who)}. A Trodas team member needs to give you access before projects appear here.</div>`;
  }
  if (backendState === 'connecting') {
    return slowConnection
      ? '<div class="panel empty" role="status">Still connecting to Convex…<br>Check that <code>convexUrl</code> in config.js is right and the deployment is running.</div>'
      : '<div class="panel empty" role="status">Loading projects from Convex…</div>';
  }
  return `<div class="panel empty" role="alert">Projects couldn’t be loaded from Convex.<br>${esc(backendError)}<br><button class="text-button" data-go="settings">Open connection settings ↗</button></div>`;
}

function overview() {
  const list = visibleProjects();
  const active = list.filter(p => p.status !== 'Completed');
  const review = pendingFeedback();
  const overdue = active.filter(p => p.deadline < todayKey()).length;
  const due = active.filter(p => p.deadline >= todayKey() && date(p.deadline) - date(todayKey()) <= 7 * 864e5).length;
  const counts = statuses.map(status => list.filter(p => p.status === status).length);
  return `<section class="delivery" aria-labelledby="deliveryTitle"><div class="delivery-copy"><h2 id="deliveryTitle">Delivery snapshot</h2><p>${active.length} active ${active.length === 1 ? 'project' : 'projects'}${overdue ? ` · ${overdue} overdue` : ''}${due ? ` · ${due} due this week` : ''}</p><button class="delivery-link" data-go="projects">Explore projects <span aria-hidden="true">→</span></button></div><div class="delivery-chart"><div class="chart-heading"><strong>Project status</strong><span>${list.length} total</span></div><div class="status-distribution" aria-hidden="true">${counts.map((n, i) => n ? `<i class="segment segment-${i}" style="flex:${n}"></i>` : '').join('')}</div><ul class="chart-legend">${statuses.map((status, i) => `<li><i class="segment segment-${i}"></i><span>${status}</span><strong>${counts[i]}</strong></li>`).join('')}</ul></div></section>
 <div class="dashboard-grid"><div class="main-column">${projectTable()}<section class="panel bottom-panel"><div class="panel-heading"><div><h2>Latest client feedback</h2><p>${review.length} awaiting review</p></div><button class="text-button" data-go="feedback">View feedback <span aria-hidden="true">↗</span></button></div>${feedbackPreview(review[0])}</section></div><div class="right-column">${deadlines()}${activity()}</div></div>`;
}

function projectTable() {
  const list = visibleProjects().filter(p => (filter === 'All projects' || p.status === filter) && `${p.name} ${p.client} ${p.lead}`.toLowerCase().includes(query.toLowerCase()));
  return `<section class="panel"><div class="panel-heading"><h2>${page === 'overview' ? 'Project portfolio' : 'All projects'} <span class="count-pill">${visibleProjects().length}</span></h2>${page === 'overview' ? '<button class="text-button" data-go="projects">View all projects <span>↗</span></button>' : '<button class="text-button" id="exportProjects">Export CSV ↗</button>'}</div><div class="filters"><div class="tabs">${['All projects', ...statuses].map(s => `<button data-filter="${s}" aria-pressed="${filter === s}" class="${filter === s ? 'active' : ''}">${s}${s === 'All projects' ? ` <span>${visibleProjects().length}</span>` : ''}</button>`).join('')}</div><label class="search">${icon('search')}<input id="search" placeholder="Search projects…" aria-label="Search projects" value="${esc(query)}"></label></div><div class="table-wrap"><table><thead><tr><th>Project name</th><th>Status</th><th>Progress</th><th>Lead</th><th>Deadline</th></tr></thead><tbody>${list.map(p => `<tr><td class="project-identity"><div class="project-cell"><span class="project-symbol ${esc(p.color)}">${esc(p.symbol)}</span><div><button class="project-name" data-project="${esc(p.id)}">${esc(p.name)}</button><span class="project-client">${esc(p.client)}</span></div></div></td><td class="status-cell">${badge(p.status)}</td><td class="progress-cell"><div class="progress-line"><span class="progress-track"><i style="width:${Math.max(0, Math.min(100, Number(p.progress) || 0))}%"></i></span>${Number(p.progress) || 0}%</div></td><td class="lead-cell"><span class="avatar mini-avatar" title="${esc(p.lead)}">${esc(initials(p.lead))}</span></td><td class="deadline"><span class="mobile-label">Deadline</span>${esc(fmt(p.deadline))}</td></tr>`).join('')}</tbody></table>${!list.length ? '<div class="empty">No projects match this view.<br>Try a different search or status filter.</div>' : ''}</div><div class="table-footer"><span>Showing ${list.length} of ${visibleProjects().length} projects</span></div></section>`;
}

function deadlines() {
  const list = visibleProjects().filter(p => p.status !== 'Completed').sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  return `<section class="panel"><div class="panel-heading"><h2>Delivery deadlines</h2>${icon('calendar')}</div>${list.map(p => `<div class="deadline-item"><div class="date-box">${date(p.deadline).getDate()}<small>${date(p.deadline).toLocaleDateString('en', { month: 'short' })}</small></div><div><strong><button class="project-name" data-project="${esc(p.id)}">${esc(p.name)}</button></strong><p>${esc(p.client)}</p><span class="due">${esc(p.deadline < todayKey() ? 'Overdue' : p.status === 'At risk' ? 'Needs attention' : p.status === 'In review' ? 'Final review' : 'Delivery milestone')}</span></div></div>`).join('') || '<div class="empty">No upcoming deadlines.</div>'}<button class="panel-link" data-go="projects">See all project deadlines ↗</button></section>`;
}

function activity() {
  const items = role === 'client' ? clientActivity : activityItems;
  return `<section class="panel"><div class="panel-heading"><h2>Recent activity</h2>${icon('clock')}</div><div class="activity-list">${items.map(([name, text, context]) => `<div class="activity-item"><span class="avatar">${esc(initials(name))}</span><div><p><strong>${esc(name)}</strong> ${esc(text)}</p><small>${esc(context)}</small></div></div>`).join('')}</div></section>`;
}

function feedbackPreview(f) {
  if (!f) return '<div class="empty">You’re all caught up. No feedback needs review.</div>';
  const p = projects.find(p => p.id === f.project || p._id === f.project);
  return `<div class="feedback-preview"><span class="avatar">${esc(initials(f.author))}</span><div><strong>${esc(f.author)}</strong><small>${esc(f.client)}</small><p>“${esc(f.text)}”</p><span class="feedback-project">${esc(p?.name || 'Project')}</span></div></div>`;
}

let documents = [
  { name: 'Project brief', description: 'Scope, objectives, and delivery expectations.', type: 'Brief', project: 'p1', body: 'Website redesign\nClient: Acme Corporation\nObjective: Refresh the public website and improve navigation.\nDeliverables: Accessible layouts, responsive pages, and launch handoff.' },
  { name: 'Security checklist', description: 'Access controls and audit review requirements.', type: 'Checklist', project: 'p4', body: 'Security audit checklist\nReview user permissions\nConfirm multi-factor authentication\nValidate backup restore procedures\nDocument vulnerability remediation' },
  { name: 'Cloud migration plan', description: 'Milestones and infrastructure migration steps.', type: 'Plan', project: 'p2', body: 'Cloud migration plan\n1. Inventory services\n2. Provision staging environment\n3. Validate backups\n4. Migrate services\n5. Monitor and hand over' }
];

function resources() {
  return `<div class="resource-grid">${documents.filter(d => visibleProjects().some(p => p.id === d.project || p._id === d.project)).map((d, i) => `<article class="panel resource-card">${icon('resources')}<h3>${esc(d.name)}</h3><span class="feedback-project">${esc(projects.find(p => p.id === d.project || p._id === d.project)?.name || '')}</span><p>${esc(d.description)}</p><button class="secondary" data-download="${i}">Download ${esc(d.type.toLowerCase())} ↗</button></article>`).join('')}</div>`;
}

function feedbackPage() {
  const items = feedback.filter(f => visibleProjects().some(p => p.id === f.project || p._id === f.project));
  if (!items.length) return '<div class="panel empty">No client feedback has been shared yet.</div>';
  return items.map(f => `<article class="panel feedback-card"><div class="feedback-head"><span class="avatar">${esc(initials(f.author))}</span><div><strong>${esc(f.author)}</strong><small>${esc(f.client)} · ${esc(f.date)}</small></div></div><p>${esc(f.text)}</p><span class="feedback-project">${esc(projects.find(p => p.id === f.project || p._id === f.project)?.name || 'Project')}</span><div style="float:right">${role === 'team' ? `<button class="text-button" data-review="${esc(f.id)}">${f.status === 'Needs review' ? 'Mark as reviewed' : 'Reviewed ✓'}</button>` : badge(f.status)}</div></article>`).join('');
}

function team() {
  return '<div class="team-grid">' + ['Alex Morgan', 'Sarah Chen', 'James Wilson', 'Olivia Brown'].map((name, i) => `<article class="panel team-card"><span class="avatar">${esc(initials(name))}</span><h3>${esc(name)}</h3><p>${['Project manager', 'Design & development', 'Infrastructure engineer', 'Product designer'][i]}</p><p>${projects.filter(p => p.lead === name && p.status !== 'Completed').length} active projects</p><button class="secondary" data-lead="${esc(name)}">View projects</button></article>`).join('') + '</div>';
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
  return `<section class="panel settings-panel"><h2>Backend connection</h2><p>${esc(status)}</p>${where}<p>To copy projects over from the old local API, run <code>npm run convex:import-projects</code>. Projects that were already imported are skipped.</p><p>Convex checks every request: team members see and edit every project, clients see only their company’s projects read-only, and new sign-ins wait for access. The Client view switch is a preview for the team.</p></section>`;
}

const accessValue = u => u.role === 'team' ? 'team' : u.role === 'client' ? `client:${u.client}` : 'none';
const signedInAt = ms => new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function accessPage() {
  const companies = [...new Set([...projects.map(p => p.client), ...people.filter(u => u.client).map(u => u.client)])]
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  const choices = [['none', 'Waiting for access'], ['team', 'Trodas team'], ...companies.map(c => [`client:${c}`, `Client · ${c}`])];
  const waiting = people.filter(u => !u.role).length;
  const rows = people.map(u => {
    const self = u._id === viewer?._id;
    const options = choices.map(([value, label]) => `<option value="${esc(value)}" ${value === accessValue(u) ? 'selected' : ''}>${esc(label)}</option>`).join('');
    return `<div class="access-row${u.role ? '' : ' is-waiting'}"><span class="avatar">${esc(initials(u.name))}</span><div class="access-person"><strong>${esc(u.name)}${self ? ' <span class="count-pill">You</span>' : ''}</strong><small>${esc(u.email || 'No email on file')}</small></div><span class="access-seen">Last signed in ${esc(signedInAt(u.lastSignedInAt))}</span><select data-access="${esc(u._id)}" data-name="${esc(u.name)}" aria-label="Access for ${esc(u.name)}" ${self ? 'disabled title="Ask another team member to change your access."' : ''}>${options}</select></div>`;
  }).join('');
  return `<section class="panel access-panel"><div class="panel-heading"><div><h2>People</h2><p>${people.length} signed in${waiting ? ` · ${waiting} waiting for access` : ''}</p></div></div><p class="access-intro">People appear here after their first sign-in. Team members see and edit every project. Clients see only their company’s projects, read-only. Invite new people from the Clerk dashboard.</p><div class="access-list">${rows || '<div class="empty">No one has signed in yet.</div>'}</div></section>`;
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
      if (d) download(`${d.name}.txt`, d.body, 'text/plain');
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
  document.querySelectorAll('[data-access]').forEach(select => {
    select.onchange = async () => {
      if (!isTeamAccount()) return;
      const [choice, ...rest] = select.value.split(':');
      select.disabled = true;
      try {
        await backend.mutation('users:setAccess', { userId: select.dataset.access, role: choice, ...(choice === 'client' ? { client: rest.join(':') } : {}) });
        toast(`Access updated for ${select.dataset.name}.`);
      } catch (e) {
        toast('Couldn’t update access: ' + errorMessage(e));
        renderKeepingFocus();
      } finally {
        select.disabled = false;
      }
    };
  });
  if ($('#exportProjects')) $('#exportProjects').onclick = () => download('trodas-projects.csv', 'Project,Client,Status,Progress,Lead,Deadline\n' + visibleProjects().map(p => [p.name, p.client, p.status, p.progress, p.lead, p.deadline].map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv');
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
  const p = visibleProjects().find(item => item.id === id);
  if (!p) return;
  $('#detailContent').innerHTML = `<div class="dialog-heading"><div><h2 id="detailTitle">${esc(p.name)}</h2><p>${esc(p.client)}</p></div><button class="close" data-close aria-label="Close">×</button></div><div class="detail-meta">${badge(p.status)}<span class="feedback-project">Deadline · ${fmt(p.deadline)}</span><span class="feedback-project">Lead · ${esc(p.lead)}</span></div><p style="color:var(--muted);line-height:1.8">${esc(p.description)}</p><div class="detail-section"><h3>Project progress</h3><div class="progress-line"><span class="progress-track" style="width:80%"><i style="width:${Math.max(0, Math.min(100, p.progress))}%"></i></span>${p.progress}%</div></div>${role === 'team' ? `<div class="detail-section"><h3>Update delivery status</h3><select id="statusUpdate" aria-label="Project status">${statuses.map(s => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select><label style="margin-top:15px">Progress (%)<input id="progressUpdate" type="number" min="0" max="100" value="${p.progress}"></label><button class="primary" id="saveStatus">Save update</button></div>` : ''}<div class="detail-section"><h3>Shared resources</h3>${documents.filter(d => d.project === p.id || (p._id && d.project === p._id)).map(d => `<p>${esc(d.name)} · Available in Resources</p>`).join('') || '<p>No resources have been shared for this project.</p>'}</div>`;
  $('#detailDialog').showModal();
  $('#detailDialog [data-close]').onclick = () => $('#detailDialog').close();
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
  projects = docs.map(doc => ({ ...doc, id: doc.legacyId || doc._id }));
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
  activityItems = docs.map(doc => [doc.actor, doc.action, doc.context]);
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
    body: doc.body
  }));
}

function setBackendState(state, message = '') {
  backendState = state;
  backendError = message;
  $('#connectionState').textContent = { live: 'Live · Convex', connecting: 'Connecting…', pending: 'Waiting for access', error: 'Backend offline', demo: 'Demo workspace' }[state];
  $('#saveState').innerHTML = {
    live: '<i class="online-dot"></i> Changes sync to Convex',
    connecting: 'Connecting to Convex…',
    pending: 'Waiting for a team member to give you access.',
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

function applyViewer(me) {
  const previousRole = viewer?.role;
  viewer = me;
  const hasAccess = me?.role === 'team' || (me?.role === 'client' && Boolean(me.client));

  // Client accounts are locked to the client view; a promotion to team returns to the team view.
  if (me?.role === 'client') role = 'client';
  else if (me?.role === 'team' && previousRole !== 'team') role = 'team';
  $('#role').value = role;

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

  if (me?.role === 'team' && !peopleSub) {
    const sub = backend.onUpdate('users:list', {}, list => {
      if (peopleSub !== sub) return;
      people = list;
      if (page === 'access') renderKeepingFocus();
    }, error => console.warn('[access] Could not load people.', error));
    peopleSub = sub;
  } else if (me?.role !== 'team' && peopleSub) {
    peopleSub();
    peopleSub = null;
    people = [];
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
