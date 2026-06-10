const SERVER = "https://optramail-backend.vercel.app"; // Same origin — Vercel API routes
const ADMIN_EMAIL = "sonjoy.bairagee@gmail.com";
let adminSecret = "";
let allUsers = [];
let allEmails = [];

window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('adminSecret');
  if (saved) {
    adminSecret = saved;
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "flex";
    loadAll();
  }
});

function login() {
  const secret = document.getElementById("secret-input")?.value.trim();
  if (!secret) return;
  adminSecret = secret;

  fetch(`${SERVER}/api/admin?action=stats`, {
    headers: { "x-admin-secret": secret }
  })
  .then(r => { if (r.status === 403) throw new Error("wrong"); return r.json(); })
  .then(() => {
    sessionStorage.setItem('adminSecret', secret);
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app").style.display = "flex";
    loadAll();
  })
  .catch(() => {
    document.getElementById("login-error").style.display = "block";
    adminSecret = "";
  });
}

function logout() {
  adminSecret = "";
  sessionStorage.removeItem('adminSecret');
  location.reload();
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  event.currentTarget.classList.add('active');
  const titles = { overview: 'Overview', users: 'Users', emails: 'Tracked Emails', grant: 'Grant Pro' };
  document.getElementById('page-title').textContent = titles[name];
}

async function loadAll() {
  checkServerStatus();
  await Promise.all([loadStats(), loadUsers(), loadEmails()]);
}

function refreshAll() { loadAll(); showToast("Refreshed!", "success"); }

async function checkServerStatus() {
  try {
    const r = await fetch(`${SERVER}/health`);
    const dot = document.getElementById("status-dot");
    const txt = document.getElementById("status-text");
    if (r.ok) { dot.classList.remove("red"); txt.textContent = "Server online"; }
    else throw new Error();
  } catch {
    document.getElementById("status-dot").classList.add("red");
    document.getElementById("status-text").textContent = "Server offline";
  }
}

async function loadStats() {
  try {
    const r = await fetch(`${SERVER}/api/admin?action=stats`, { headers: { "x-admin-secret": adminSecret } });
    const data = await r.json();
    document.getElementById("stat-total").textContent = data.totalUsers ?? "0";
    document.getElementById("stat-pro").textContent = data.proUsers ?? "0";
    document.getElementById("stat-free").textContent = data.freeUsers ?? "0";
    document.getElementById("stat-emails").textContent = data.totalEmails ?? "0";
    document.getElementById("stat-opens").textContent = data.totalOpens ?? "0";
    document.getElementById("stat-mrr").textContent = `$${((data.proUsers || 0) * 5)}`;
  } catch {}
}

async function loadUsers() {
  try {
    const r = await fetch(`${SERVER}/api/admin?action=users`, { headers: { "x-admin-secret": adminSecret } });
    const data = await r.json();
    allUsers = data.users || [];
    renderUsers(allUsers);
    renderRecentUsers(allUsers.slice(0, 5));
    renderProUsers(allUsers.filter(u => u.isPro));
  } catch {}
}

async function loadEmails() {
  try {
    const r = await fetch(`${SERVER}/api/admin?action=emails`, { headers: { "x-admin-secret": adminSecret } });
    const data = await r.json();
    allEmails = data.emails || [];
    renderEmails(allEmails);
  } catch {}
}

function renderUsers(users) {
  const tbody = document.getElementById("users-table");
  if (!tbody) return;
  if (!users.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty">No users yet</td></tr>`; return; }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td><span class="badge ${u.isPro ? 'pro' : 'free'}">${u.isPro ? '⚡ Pro' : 'Free'}</span></td>
      <td class="mono">${formatDate(u.updatedAt)}</td>
      <td>${u.isPro
        ? `<button class="btn btn-red" onclick="quickRevoke('${u.email}')">Revoke</button>`
        : `<button class="btn btn-green" onclick="quickGrant('${u.email}')">Grant Pro</button>`
      }</td>
    </tr>
  `).join('');
}

function renderRecentUsers(users) {
  const tbody = document.getElementById("recent-users-table");
  if (!tbody) return;
  if (!users.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty">No users yet</td></tr>`; return; }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td><span class="badge ${u.isPro ? 'pro' : 'free'}">${u.isPro ? '⚡ Pro' : 'Free'}</span></td>
      <td class="mono">${formatDate(u.updatedAt)}</td>
      <td>${u.isPro
        ? `<button class="btn btn-red" onclick="quickRevoke('${u.email}')">Revoke</button>`
        : `<button class="btn btn-green" onclick="quickGrant('${u.email}')">Grant Pro</button>`
      }</td>
    </tr>
  `).join('');
}

function renderProUsers(users) {
  const tbody = document.getElementById("pro-users-table");
  if (!tbody) return;
  if (!users.length) { tbody.innerHTML = `<tr><td colspan="3" class="empty">No pro users yet</td></tr>`; return; }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td class="mono">${formatDate(u.updatedAt)}</td>
      <td><button class="btn btn-red" onclick="quickRevoke('${u.email}')">Revoke</button></td>
    </tr>
  `).join('');
}

function renderEmails(emails) {
  const tbody = document.getElementById("emails-table");
  if (!tbody) return;
  if (!emails.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty">No emails yet</td></tr>`; return; }
  tbody.innerHTML = emails.map(e => `
    <tr>
      <td>${e.subject || 'No Subject'}</td>
      <td class="mono">${e.userEmail || '—'}</td>
      <td class="mono">${formatDate(e.sentAt)}</td>
      <td><span class="badge ${e.openCount > 0 ? 'active' : 'free'}">${e.openCount || 0} opens</span></td>
      <td><span class="badge ${e.openCount > 0 ? 'pro' : 'free'}">${e.openCount > 0 ? 'Opened' : 'Pending'}</span></td>
    </tr>
  `).join('');
}

function filterUsers(q) { renderUsers(allUsers.filter(u => u.email.toLowerCase().includes(q.toLowerCase()))); }
function filterEmails(q) { renderEmails(allEmails.filter(e => (e.subject||'').toLowerCase().includes(q.toLowerCase()))); }

async function grantPro() {
  const email = document.getElementById("grant-email").value.trim();
  if (!email) return;
  await callGrantRevoke(email, true);
  document.getElementById("grant-email").value = "";
}

async function revokePro() {
  const email = document.getElementById("grant-email").value.trim();
  if (!email) return;
  await callGrantRevoke(email, false);
  document.getElementById("grant-email").value = "";
}

async function quickGrant(email) { await callGrantRevoke(email, true); }
async function quickRevoke(email) { await callGrantRevoke(email, false); }

async function callGrantRevoke(email, grant) {
  try {
    const r = await fetch(`${SERVER}/api/admin?action=set-pro`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ email, isPro: grant })
    });
    const data = await r.json();
    if (data.ok) {
      showToast(grant ? `✅ Pro granted to ${email}` : `✅ Revoked from ${email}`, "success");
      await loadUsers(); await loadStats();
    } else {
      showToast("❌ Failed", "error");
    }
  } catch { showToast("❌ Server error", "error"); }
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove("show"), 3000);
}
