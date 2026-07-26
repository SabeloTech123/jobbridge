/* ============================================================
   JobBridge — fully client-side job portal (no backend).
   All data lives in this browser's localStorage.
   ============================================================ */

const LS = {
  users: 'jobbridge_users',
  session: 'jobbridge_session',
  jobs: 'jobbridge_jobs',
  applications: 'jobbridge_applications',
  saved: 'jobbridge_saved',
  seekerProfiles: 'jobbridge_seeker_profiles',
  companyProfiles: 'jobbridge_company_profiles'
};

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v === null || v === undefined ? fallback : v;
  } catch (e) { return fallback; }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ============= SEED DATA ============= */
function seedJobsIfEmpty() {
  const existing = readJSON(LS.jobs, null);
  if (existing && existing.length) return;

  const now = Date.now();
  const seed = [
    {
      id: uid(), employerEmail: 'demo-employer@jobbridge.app', companyName: 'Northwind Digital',
      title: 'Senior Frontend Engineer', location: 'Cape Town, ZA', type: 'Full-time', category: 'Engineering',
      salary: 'R55,000 - R70,000 / month',
      description: 'Join our product team building customer-facing dashboards used by thousands of businesses daily. You will own frontend architecture decisions, mentor junior engineers, and collaborate closely with design.',
      postedDate: new Date(now - 2 * 86400000).toISOString()
    },
    {
      id: uid(), employerEmail: 'demo-employer@jobbridge.app', companyName: 'Northwind Digital',
      title: 'Product Marketing Manager', location: 'Remote', type: 'Remote', category: 'Marketing',
      salary: 'R48,000 - R60,000 / month',
      description: 'Own go-to-market strategy for our core product line, working across sales, design, and engineering to launch campaigns that drive adoption.',
      postedDate: new Date(now - 5 * 86400000).toISOString()
    },
    {
      id: uid(), employerEmail: 'demo-employer2@jobbridge.app', companyName: 'Solara Health',
      title: 'UX/UI Designer', location: 'Johannesburg, ZA', type: 'Full-time', category: 'Design',
      salary: 'R40,000 - R52,000 / month',
      description: 'Design intuitive, accessible interfaces for a healthcare platform used by clinics across the country. You will run user research and translate findings into polished, tested designs.',
      postedDate: new Date(now - 1 * 86400000).toISOString()
    },
    {
      id: uid(), employerEmail: 'demo-employer2@jobbridge.app', companyName: 'Solara Health',
      title: 'Customer Success Associate', location: 'Durban, ZA', type: 'Part-time', category: 'Customer Support',
      salary: 'R18,000 - R24,000 / month',
      description: 'Be the first point of contact for our customers, helping them get the most out of our platform through onboarding calls and ongoing support.',
      postedDate: new Date(now - 8 * 86400000).toISOString()
    },
    {
      id: uid(), employerEmail: 'demo-employer@jobbridge.app', companyName: 'Northwind Digital',
      title: 'Backend Engineer (Node.js)', location: 'Cape Town, ZA', type: 'Contract', category: 'Engineering',
      salary: 'R500 - R700 / hour',
      description: 'Build and maintain scalable APIs powering our core product. Strong experience with Node.js, PostgreSQL, and distributed systems required.',
      postedDate: new Date(now - 3 * 86400000).toISOString()
    },
    {
      id: uid(), employerEmail: 'demo-employer2@jobbridge.app', companyName: 'Solara Health',
      title: 'Data Analyst', location: 'Remote', type: 'Remote', category: 'Data',
      salary: 'R35,000 - R45,000 / month',
      description: 'Analyze product and clinical usage data to surface insights that guide our roadmap. SQL and dashboarding experience (Looker/Tableau) preferred.',
      postedDate: new Date(now - 6 * 86400000).toISOString()
    }
  ];
  writeJSON(LS.jobs, seed);
}

async function seedDemoUsersIfMissing() {
  const users = readJSON(LS.users, {});
  if (!users['demo-employer@jobbridge.app']) {
    users['demo-employer@jobbridge.app'] = {
      name: 'Alex Morgan', role: 'employer', companyName: 'Northwind Digital',
      passwordHash: await hashPassword('demopass')
    };
  }
  if (!users['demo-employer2@jobbridge.app']) {
    users['demo-employer2@jobbridge.app'] = {
      name: 'Priya Naidoo', role: 'employer', companyName: 'Solara Health',
      passwordHash: await hashPassword('demopass')
    };
  }
  writeJSON(LS.users, users);
}

/* ============= AUTH ============= */
const authScreen = document.getElementById('authScreen');
const appShell = document.getElementById('appShell');
const tabSignup = document.getElementById('tabSignup');
const tabLogin = document.getElementById('tabLogin');
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const signupError = document.getElementById('signupError');
const loginError = document.getElementById('loginError');
const roleSeeker = document.getElementById('roleSeeker');
const roleEmployer = document.getElementById('roleEmployer');
const companyNameField = document.getElementById('companyNameField');

let selectedRole = 'seeker';

function showAuthTab(tab) {
  const su = tab === 'signup';
  tabSignup.classList.toggle('active', su);
  tabLogin.classList.toggle('active', !su);
  signupForm.style.display = su ? 'flex' : 'none';
  loginForm.style.display = su ? 'none' : 'flex';
}
tabSignup.addEventListener('click', () => showAuthTab('signup'));
tabLogin.addEventListener('click', () => showAuthTab('login'));
document.getElementById('goToLogin').addEventListener('click', e => { e.preventDefault(); showAuthTab('login'); });
document.getElementById('goToSignup').addEventListener('click', e => { e.preventDefault(); showAuthTab('signup'); });

roleSeeker.addEventListener('click', () => {
  selectedRole = 'seeker';
  roleSeeker.classList.add('active');
  roleEmployer.classList.remove('active');
  companyNameField.style.display = 'none';
});
roleEmployer.addEventListener('click', () => {
  selectedRole = 'employer';
  roleEmployer.classList.add('active');
  roleSeeker.classList.remove('active');
  companyNameField.style.display = 'flex';
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signupError.textContent = '';
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;
  const companyName = document.getElementById('signupCompany').value.trim();

  if (!name || !email || password.length < 6) {
    signupError.textContent = 'Please fill in every field (password needs 6+ characters).';
    return;
  }
  if (selectedRole === 'employer' && !companyName) {
    signupError.textContent = 'Please enter your company name.';
    return;
  }
  const users = readJSON(LS.users, {});
  if (users[email]) {
    signupError.textContent = 'An account with that email already exists. Try logging in instead.';
    return;
  }
  users[email] = {
    name, role: selectedRole,
    companyName: selectedRole === 'employer' ? companyName : undefined,
    passwordHash: await hashPassword(password)
  };
  writeJSON(LS.users, users);

  showToast('Account created! Please log in to continue.');
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = '';
  showAuthTab('login');
  signupForm.reset();
  roleSeeker.click();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const users = readJSON(LS.users, {});
  const user = users[email];
  if (!user || user.passwordHash !== await hashPassword(password)) {
    loginError.textContent = 'Incorrect email or password.';
    return;
  }
  logIn(email);
});

document.getElementById('loadDemoBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  const email = 'demo-seeker@jobbridge.app';
  const users = readJSON(LS.users, {});
  if (!users[email]) {
    users[email] = { name: 'Jordan Lee', role: 'seeker', passwordHash: await hashPassword('demopass') };
    writeJSON(LS.users, users);
  }
  logIn(email);
});

function logIn(email) {
  writeJSON(LS.session, { email });
  showToast('Welcome back!');
  enterApp();
}

document.getElementById('signOutBtn').addEventListener('click', () => {
  localStorage.removeItem(LS.session);
  appShell.classList.remove('active');
  authScreen.style.display = 'flex';
  showToast('You have been logged out.');
});

/* ============= TOAST ============= */
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 3000);
}

/* ============= NAVIGATION ============= */
const seekerNav = document.getElementById('seekerNav');
const employerNav = document.getElementById('employerNav');

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });

  document.querySelector('.sidebar').classList.remove('open');
  renderPage(pageId);
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});
document.querySelectorAll('[data-nav]').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
});

document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

/* ============= CURRENT USER HELPERS ============= */
function getSession() { return readJSON(LS.session, null); }
function getUsers() { return readJSON(LS.users, {}); }
function currentUser() {
  const s = getSession();
  if (!s) return null;
  const users = getUsers();
  return users[s.email] ? { email: s.email, ...users[s.email] } : null;
}

/* ============= ENTER APP ============= */
function enterApp() {
  const user = currentUser();
  if (!user) return;

  authScreen.style.display = 'none';
  appShell.classList.add('active');

  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('userNameLabel').textContent = user.name.split(' ')[0];

  if (user.role === 'employer') {
    seekerNav.style.display = 'none';
    employerNav.style.display = 'flex';
    document.getElementById('employerWelcomeName').textContent = user.name.split(' ')[0];
    navigateTo('employerDashboard');
  } else {
    employerNav.style.display = 'none';
    seekerNav.style.display = 'flex';
    document.getElementById('seekerWelcomeName').textContent = user.name.split(' ')[0];
    navigateTo('seekerDashboard');
  }
}

/* ============= JOB HELPERS ============= */
function getJobs() { return readJSON(LS.jobs, []); }
function getApplications() { return readJSON(LS.applications, []); }
function getSavedMap() { return readJSON(LS.saved, {}); }
function getSavedIds(email) { return getSavedMap()[email] || []; }

function jobIconSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
}
function bookmarkSvg(filled) {
  return `<svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.7"><path d="M6 4h12v17l-6-4-6 4V4z"/></svg>`;
}

function statusPillHTML(status) {
  const map = {
    'Applied': 'status-applied',
    'Reviewing': 'status-reviewing',
    'Interview': 'status-interview',
    'Offer': 'status-offer',
    'Rejected': 'status-rejected'
  };
  return `<span class="status-pill ${map[status] || 'status-applied'}">${status}</span>`;
}

function hasApplied(jobId, email) {
  return getApplications().some(a => a.jobId === jobId && a.seekerEmail === email);
}

function buildJobCard(job, mode, user) {
  const saved = mode === 'browse' || mode === 'saved' ? getSavedIds(user.email).includes(job.id) : false;
  const applied = mode !== 'manage' && hasApplied(job.id, user.email);

  let actionsHTML = '';
  if (mode === 'manage') {
    actionsHTML = `
      <div class="job-card-manage">
        <button class="btn btn-secondary" data-edit-job="${job.id}">Edit</button>
        <button class="btn btn-secondary" data-view-applicants="${job.id}">Applicants</button>
        <button class="btn btn-secondary" data-delete-job="${job.id}">Delete</button>
      </div>`;
  } else {
    actionsHTML = `
      <div class="job-card-actions">
        <button class="btn ${applied ? 'btn-secondary' : 'btn-primary'}" data-apply-job="${job.id}" ${applied ? 'disabled' : ''}>
          ${applied ? 'Applied ✓' : 'Apply'}
        </button>
      </div>`;
  }

  const saveButtonHTML = mode === 'manage' ? '' : `
    <button class="save-btn ${saved ? 'saved' : ''}" data-save-job="${job.id}" aria-label="Save job">
      ${bookmarkSvg(saved)}
    </button>`;

  return `
    <div class="job-card">
      <div class="job-card-top">
        <div class="job-icon">${jobIconSvg()}</div>
        ${saveButtonHTML}
      </div>
      <p class="job-title">${escapeHTML(job.title)}</p>
      <p class="job-company">${escapeHTML(job.companyName)} · ${escapeHTML(job.location)}</p>
      <div class="job-tags">
        <span class="job-tag">${escapeHTML(job.type)}</span>
        <span class="job-tag">${escapeHTML(job.category)}</span>
      </div>
      <p class="job-desc">${escapeHTML(job.description)}</p>
      ${actionsHTML}
    </div>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ============= RENDER: BROWSE JOBS ============= */
function populateFilterOptions() {
  const jobs = getJobs();
  const locations = [...new Set(jobs.map(j => j.location))].sort();
  const categories = [...new Set(jobs.map(j => j.category))].sort();

  const locSel = document.getElementById('filterLocation');
  const catSel = document.getElementById('filterCategory');
  const currentLoc = locSel.value;
  const currentCat = catSel.value;

  locSel.innerHTML = '<option value="">All Locations</option>' + locations.map(l => `<option value="${escapeHTML(l)}">${escapeHTML(l)}</option>`).join('');
  catSel.innerHTML = '<option value="">All Categories</option>' + categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');

  locSel.value = currentLoc;
  catSel.value = currentCat;
}

function renderBrowseJobs() {
  const user = currentUser();
  populateFilterOptions();

  const search = document.getElementById('jobSearchInput').value.toLowerCase().trim();
  const loc = document.getElementById('filterLocation').value;
  const type = document.getElementById('filterType').value;
  const cat = document.getElementById('filterCategory').value;

  const jobs = getJobs().filter(j => {
    if (search && !(j.title.toLowerCase().includes(search) || j.description.toLowerCase().includes(search))) return false;
    if (loc && j.location !== loc) return false;
    if (type && j.type !== type) return false;
    if (cat && j.category !== cat) return false;
    return true;
  }).sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));

  const grid = document.getElementById('jobsGrid');
  const empty = document.getElementById('jobsEmpty');
  grid.innerHTML = jobs.map(j => buildJobCard(j, 'browse', user)).join('');
  empty.style.display = jobs.length ? 'none' : 'block';
  wireJobCardEvents(grid);
}

/* ============= RENDER: SAVED JOBS ============= */
function renderSavedJobs() {
  const user = currentUser();
  const savedIds = getSavedIds(user.email);
  const jobs = getJobs().filter(j => savedIds.includes(j.id));

  const grid = document.getElementById('savedJobsGrid');
  const empty = document.getElementById('savedJobsEmpty');
  grid.innerHTML = jobs.map(j => buildJobCard(j, 'saved', user)).join('');
  empty.style.display = jobs.length ? 'none' : 'block';
  wireJobCardEvents(grid);
}

/* ============= RENDER: MANAGE POSTINGS ============= */
let editingJobId = null;

function renderManagePostings() {
  const user = currentUser();
  const jobs = getJobs().filter(j => j.employerEmail === user.email)
    .sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));

  const grid = document.getElementById('managePostingsGrid');
  const empty = document.getElementById('managePostingsEmpty');
  grid.innerHTML = jobs.map(j => buildJobCard(j, 'manage', user)).join('');
  empty.style.display = jobs.length ? 'none' : 'block';
  wireJobCardEvents(grid);
}

function wireJobCardEvents(container) {
  container.querySelectorAll('[data-apply-job]').forEach(btn => {
    btn.addEventListener('click', () => openJobModal(btn.dataset.applyJob));
  });
  container.querySelectorAll('[data-save-job]').forEach(btn => {
    btn.addEventListener('click', () => toggleSaveJob(btn.dataset.saveJob));
  });
  container.querySelectorAll('[data-delete-job]').forEach(btn => {
    btn.addEventListener('click', () => deleteJob(btn.dataset.deleteJob));
  });
  container.querySelectorAll('[data-edit-job]').forEach(btn => {
    btn.addEventListener('click', () => editJob(btn.dataset.editJob));
  });
  container.querySelectorAll('[data-view-applicants]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo('applications');
    });
  });
}

function toggleSaveJob(jobId) {
  const user = currentUser();
  const savedMap = getSavedMap();
  const list = savedMap[user.email] || [];
  const idx = list.indexOf(jobId);
  if (idx >= 0) { list.splice(idx, 1); } else { list.push(jobId); }
  savedMap[user.email] = list;
  writeJSON(LS.saved, savedMap);

  const activePage = document.querySelector('.page.active').id;
  if (activePage === 'page-browseJobs') renderBrowseJobs();
  if (activePage === 'page-savedJobs') renderSavedJobs();
}

function deleteJob(jobId) {
  if (!confirm('Delete this job posting? This cannot be undone.')) return;
  const jobs = getJobs().filter(j => j.id !== jobId);
  writeJSON(LS.jobs, jobs);
  const apps = getApplications().filter(a => a.jobId !== jobId);
  writeJSON(LS.applications, apps);
  showToast('Job posting deleted.');
  renderManagePostings();
}

function editJob(jobId) {
  const job = getJobs().find(j => j.id === jobId);
  if (!job) return;
  editingJobId = jobId;
  document.getElementById('jobTitle').value = job.title;
  document.getElementById('jobLocation').value = job.location;
  document.getElementById('jobType').value = job.type;
  document.getElementById('jobCategory').value = job.category;
  document.getElementById('jobSalary').value = job.salary;
  document.getElementById('jobDescription').value = job.description;
  document.querySelector('#postJobForm button[type="submit"]').textContent = 'Save Changes';
  navigateTo('postJob');
}

/* ============= JOB MODAL (apply) ============= */
const jobModalOverlay = document.getElementById('jobModalOverlay');
let modalJobId = null;

function openJobModal(jobId) {
  const job = getJobs().find(j => j.id === jobId);
  if (!job) return;
  modalJobId = jobId;
  document.getElementById('modalCompany').textContent = job.companyName;
  document.getElementById('modalJobTitle').textContent = job.title;
  document.getElementById('modalDescription').textContent = job.description;
  document.getElementById('modalTags').innerHTML =
    `<span class="job-tag">${escapeHTML(job.location)}</span><span class="job-tag">${escapeHTML(job.type)}</span><span class="job-tag">${escapeHTML(job.category)}</span>${job.salary ? `<span class="job-tag">${escapeHTML(job.salary)}</span>` : ''}`;
  document.getElementById('coverNote').value = '';
  jobModalOverlay.classList.add('open');
}
function closeJobModal() {
  jobModalOverlay.classList.remove('open');
  modalJobId = null;
}
document.getElementById('jobModalClose').addEventListener('click', closeJobModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeJobModal);
jobModalOverlay.addEventListener('click', (e) => { if (e.target === jobModalOverlay) closeJobModal(); });

document.getElementById('modalApplyBtn').addEventListener('click', () => {
  const user = currentUser();
  if (!modalJobId || hasApplied(modalJobId, user.email)) { closeJobModal(); return; }

  const apps = getApplications();
  apps.push({
    id: uid(),
    jobId: modalJobId,
    seekerEmail: user.email,
    seekerName: user.name,
    status: 'Applied',
    appliedDate: new Date().toISOString(),
    coverNote: document.getElementById('coverNote').value.trim()
  });
  writeJSON(LS.applications, apps);
  closeJobModal();
  showToast('Application submitted!');

  const activePage = document.querySelector('.page.active').id;
  if (activePage === 'page-browseJobs') renderBrowseJobs();
  if (activePage === 'page-savedJobs') renderSavedJobs();
});

/* ============= FILTER EVENTS ============= */
document.getElementById('jobSearchInput').addEventListener('input', renderBrowseJobs);
document.getElementById('filterLocation').addEventListener('change', renderBrowseJobs);
document.getElementById('filterType').addEventListener('change', renderBrowseJobs);
document.getElementById('filterCategory').addEventListener('change', renderBrowseJobs);

/* ============= SEEKER: DASHBOARD ============= */
function renderSeekerDashboard() {
  const user = currentUser();
  const myApps = getApplications().filter(a => a.seekerEmail === user.email);
  const jobs = getJobs();

  document.getElementById('statApplications').textContent = myApps.length;
  document.getElementById('statInterviews').textContent = myApps.filter(a => a.status === 'Interview').length;
  document.getElementById('statSaved').textContent = getSavedIds(user.email).length;

  const profile = readJSON(LS.seekerProfiles, {})[user.email] || {};
  let filled = 1; // name always present
  if (profile.headline) filled++;
  if (profile.skills) filled++;
  if (profile.bio) filled++;
  document.getElementById('statProfile').textContent = Math.round((filled / 4) * 100) + '%';

  const recent = [...myApps].sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)).slice(0, 5);
  const tbody = document.querySelector('#recentApplicationsTable tbody');
  const empty = document.getElementById('recentApplicationsEmpty');
  tbody.innerHTML = recent.map(a => {
    const job = jobs.find(j => j.id === a.jobId);
    return `<tr>
      <td>${escapeHTML(job ? job.title : 'Job removed')}</td>
      <td>${escapeHTML(job ? job.companyName : '—')}</td>
      <td>${formatDate(a.appliedDate)}</td>
      <td>${statusPillHTML(a.status)}</td>
    </tr>`;
  }).join('');
  document.getElementById('recentApplicationsTable').style.display = recent.length ? 'table' : 'none';
  empty.style.display = recent.length ? 'none' : 'block';
}

/* ============= SEEKER: MY APPLICATIONS ============= */
function renderMyApplications() {
  const user = currentUser();
  const jobs = getJobs();
  const myApps = getApplications().filter(a => a.seekerEmail === user.email)
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  const tbody = document.querySelector('#applicationsTable tbody');
  const empty = document.getElementById('applicationsEmpty');
  tbody.innerHTML = myApps.map(a => {
    const job = jobs.find(j => j.id === a.jobId);
    return `<tr>
      <td>${escapeHTML(job ? job.title : 'Job removed')}</td>
      <td>${escapeHTML(job ? job.companyName : '—')}</td>
      <td>${formatDate(a.appliedDate)}</td>
      <td>${statusPillHTML(a.status)}</td>
    </tr>`;
  }).join('');
  document.getElementById('applicationsTable').style.display = myApps.length ? 'table' : 'none';
  empty.style.display = myApps.length ? 'none' : 'block';
}

/* ============= SEEKER: PROFILE ============= */
function renderSeekerProfile() {
  const user = currentUser();
  const profile = readJSON(LS.seekerProfiles, {})[user.email] || {};
  document.getElementById('profileName').value = user.name;
  document.getElementById('profileHeadline').value = profile.headline || '';
  document.getElementById('profileSkills').value = profile.skills || '';
  document.getElementById('profileBio').value = profile.bio || '';
}

document.getElementById('seekerProfileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = currentUser();
  const profiles = readJSON(LS.seekerProfiles, {});
  profiles[user.email] = {
    headline: document.getElementById('profileHeadline').value.trim(),
    skills: document.getElementById('profileSkills').value.trim(),
    bio: document.getElementById('profileBio').value.trim()
  };
  writeJSON(LS.seekerProfiles, profiles);

  const newName = document.getElementById('profileName').value.trim();
  if (newName && newName !== user.name) {
    const users = getUsers();
    users[user.email].name = newName;
    writeJSON(LS.users, users);
    document.getElementById('userNameLabel').textContent = newName.split(' ')[0];
    document.getElementById('userAvatar').textContent = newName.charAt(0).toUpperCase();
    document.getElementById('seekerWelcomeName').textContent = newName.split(' ')[0];
  }
  showToast('Profile saved.');
});

/* ============= EMPLOYER: DASHBOARD ============= */
function renderEmployerDashboard() {
  const user = currentUser();
  const myJobs = getJobs().filter(j => j.employerEmail === user.email);
  const myJobIds = myJobs.map(j => j.id);
  const myApps = getApplications().filter(a => myJobIds.includes(a.jobId));
  const weekAgo = Date.now() - 7 * 86400000;

  document.getElementById('statActivePostings').textContent = myJobs.length;
  document.getElementById('statTotalApplicants').textContent = myApps.length;
  document.getElementById('statNewWeek').textContent = myApps.filter(a => new Date(a.appliedDate).getTime() > weekAgo).length;
  document.getElementById('statInterviewing').textContent = myApps.filter(a => a.status === 'Interview').length;

  const recent = [...myApps].sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate)).slice(0, 5);
  const tbody = document.querySelector('#recentApplicantsTable tbody');
  const empty = document.getElementById('recentApplicantsEmpty');
  tbody.innerHTML = recent.map(a => {
    const job = myJobs.find(j => j.id === a.jobId);
    return `<tr>
      <td>${escapeHTML(a.seekerName)}</td>
      <td>${escapeHTML(job ? job.title : 'Job removed')}</td>
      <td>${formatDate(a.appliedDate)}</td>
      <td>${statusPillHTML(a.status)}</td>
    </tr>`;
  }).join('');
  document.getElementById('recentApplicantsTable').style.display = recent.length ? 'table' : 'none';
  empty.style.display = recent.length ? 'none' : 'block';
}

/* ============= EMPLOYER: POST / EDIT JOB ============= */
document.getElementById('postJobForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = currentUser();
  const jobData = {
    title: document.getElementById('jobTitle').value.trim(),
    location: document.getElementById('jobLocation').value.trim(),
    type: document.getElementById('jobType').value,
    category: document.getElementById('jobCategory').value.trim(),
    salary: document.getElementById('jobSalary').value.trim(),
    description: document.getElementById('jobDescription').value.trim()
  };

  const jobs = getJobs();
  if (editingJobId) {
    const job = jobs.find(j => j.id === editingJobId);
    if (job) Object.assign(job, jobData);
    showToast('Job posting updated.');
    editingJobId = null;
  } else {
    jobs.push({
      id: uid(),
      employerEmail: user.email,
      companyName: user.companyName || user.name,
      postedDate: new Date().toISOString(),
      ...jobData
    });
    showToast('Job published!');
  }
  writeJSON(LS.jobs, jobs);
  document.getElementById('postJobForm').reset();
  document.querySelector('#postJobForm button[type="submit"]').textContent = 'Publish Job';
  navigateTo('managePostings');
});

/* ============= EMPLOYER: APPLICATIONS ============= */
function renderEmployerApplications() {
  const user = currentUser();
  const myJobs = getJobs().filter(j => j.employerEmail === user.email);
  const myJobIds = myJobs.map(j => j.id);
  const apps = getApplications().filter(a => myJobIds.includes(a.jobId))
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  const tbody = document.querySelector('#employerApplicationsTable tbody');
  const empty = document.getElementById('employerApplicationsEmpty');
  const statuses = ['Applied', 'Reviewing', 'Interview', 'Offer', 'Rejected'];

  tbody.innerHTML = apps.map(a => {
    const job = myJobs.find(j => j.id === a.jobId);
    return `<tr>
      <td>${escapeHTML(a.seekerName)}${a.coverNote ? `<span class="cell-sub">"${escapeHTML(a.coverNote.slice(0, 60))}${a.coverNote.length > 60 ? '…' : ''}"</span>` : ''}</td>
      <td>${escapeHTML(job ? job.title : 'Job removed')}</td>
      <td>${formatDate(a.appliedDate)}</td>
      <td>
        <select class="status-select" data-app-id="${a.id}">
          ${statuses.map(s => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('employerApplicationsTable').style.display = apps.length ? 'table' : 'none';
  empty.style.display = apps.length ? 'none' : 'block';

  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const appsAll = getApplications();
      const app = appsAll.find(a => a.id === sel.dataset.appId);
      if (app) {
        app.status = sel.value;
        writeJSON(LS.applications, appsAll);
        showToast(`Status updated to "${sel.value}".`);
      }
    });
  });
}

/* ============= EMPLOYER: COMPANY PROFILE ============= */
function renderCompanyProfile() {
  const user = currentUser();
  const profiles = readJSON(LS.companyProfiles, {});
  const profile = profiles[user.email] || {};
  document.getElementById('companyProfileName').value = user.companyName || '';
  document.getElementById('companyWebsite').value = profile.website || '';
  document.getElementById('companyAbout').value = profile.about || '';
}

document.getElementById('companyProfileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = currentUser();
  const profiles = readJSON(LS.companyProfiles, {});
  profiles[user.email] = {
    website: document.getElementById('companyWebsite').value.trim(),
    about: document.getElementById('companyAbout').value.trim()
  };
  writeJSON(LS.companyProfiles, profiles);

  const newCompanyName = document.getElementById('companyProfileName').value.trim();
  if (newCompanyName) {
    const users = getUsers();
    users[user.email].companyName = newCompanyName;
    writeJSON(LS.users, users);
    const jobs = getJobs();
    jobs.forEach(j => { if (j.employerEmail === user.email) j.companyName = newCompanyName; });
    writeJSON(LS.jobs, jobs);
  }
  showToast('Company profile saved.');
});

/* ============= PAGE ROUTER ============= */
function renderPage(pageId) {
  switch (pageId) {
    case 'seekerDashboard': renderSeekerDashboard(); break;
    case 'browseJobs': renderBrowseJobs(); break;
    case 'myApplications': renderMyApplications(); break;
    case 'savedJobs': renderSavedJobs(); break;
    case 'seekerProfile': renderSeekerProfile(); break;
    case 'employerDashboard': renderEmployerDashboard(); break;
    case 'managePostings': renderManagePostings(); break;
    case 'applications': renderEmployerApplications(); break;
    case 'companyProfile': renderCompanyProfile(); break;
  }
}

/* ============= INIT ============= */
(async function init() {
  seedJobsIfEmpty();
  await seedDemoUsersIfMissing();

  const session = getSession();
  if (session && currentUser()) {
    enterApp();
  } else {
    authScreen.style.display = 'flex';
  }
})();
