document.addEventListener('DOMContentLoaded', () => {
  const API = "https://optramail-backend.vercel.app";

  // ── GET EMAIL ── URL param বা localStorage থেকে
  const params = new URLSearchParams(window.location.search);
  const urlEmail = params.get('email');
  const urlPlan = params.get('plan');
  const email = urlEmail || localStorage.getItem('optramail_email');
  const plan = urlPlan || localStorage.getItem('optramail_plan') || 'free';

  if (urlEmail) localStorage.setItem('optramail_email', urlEmail);
  if (urlPlan) localStorage.setItem('optramail_plan', urlPlan);

  // ── AVATAR ──
  const avatar = document.getElementById('avatar-initial');
  if (avatar && email) avatar.textContent = email.charAt(0).toUpperCase();

  // ── PLAN BADGE ──
  const badge = document.querySelector('.badge-free');
  if (badge) badge.textContent = plan === 'pro' ? 'PRO' : 'FREE';

  // ── LOAD EMAILS ──
  if (email) {
    loadTrackedEmails(email);
  } else {
    renderData([]);
  }

  async function loadTrackedEmails(userEmail) {
    try {
      const res = await fetch(`${API}/api/emails?email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      renderData(data.emails || []);
    } catch {
      renderData([]);
    }
  }

  function renderData(items) {
    const emptyState = document.getElementById('empty-state');
    const dataList = document.getElementById('data-list');
    if (!emptyState || !dataList) return;

    if (items.length === 0) {
      emptyState.style.display = 'block';
      dataList.style.display = 'none';
      emptyState.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;">📭</div>
        <div style="font-size:18px;font-weight:600;margin-bottom:8px;">No tracked emails yet</div>
        <div style="font-size:14px;color:#6b7280;">Go to Gmail and send an email — it will appear here!</div>
      `;
    } else {
      emptyState.style.display = 'none';
      dataList.style.display = 'flex';
      dataList.innerHTML = items.map(item => `
        <div class="data-item">
          <div class="item-left">
            <div class="item-subject">${item.subject || 'No Subject'}</div>
            <div class="item-meta">Sent ${formatTime(item.sentAt)}</div>
          </div>
          <div class="item-right">
            <div class="item-meta">${item.lastOpened ? 'Last opened ' + formatTime(item.lastOpened) : 'Not opened yet'}</div>
            <div class="item-opens" style="${item.openCount > 0 ? '' : 'background:rgba(107,114,128,0.1);color:#6b7280;'}">
              ${item.openCount || 0} Open${item.openCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  function formatTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // ── TABS ──
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // ── UPGRADE BUTTON ──
  const upgradeBtn = document.querySelector('.btn-upgrade');
  if (upgradeBtn) {
    if (plan === 'pro') {
      upgradeBtn.textContent = '⚡ Pro Plan';
      upgradeBtn.style.background = '#7c3aed';
    } else {
      upgradeBtn.addEventListener('click', () => {
        window.open('https://whop.com/compx/optramail-pro/', '_blank');
      });
    }
  }

  // ── LOGOUT ──
  const settingsIcon = document.querySelector('.topbar-icons span:nth-child(3)');
  if (settingsIcon) {
    settingsIcon.title = 'Sign out';
    settingsIcon.style.cursor = 'pointer';
    settingsIcon.addEventListener('click', () => showSignoutModal());
  }
});

// ── SIGNOUT MODAL ──
function showSignoutModal() {
  // Remove existing modal if any
  const existing = document.getElementById('signout-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'signout-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);
    animation:fadeIn .15s ease;
  `;

  modal.innerHTML = `
    <style>
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    </style>
    <div style="
      background:#1a1a2e;border:1px solid #2a2a3e;
      border-radius:16px;padding:32px 28px;width:320px;
      text-align:center;animation:slideUp .2s ease;
      box-shadow:0 24px 60px rgba(0,0,0,0.5);
    ">
      <div style="font-size:36px;margin-bottom:12px;">👋</div>
      <div style="font-family:sans-serif;font-size:17px;font-weight:700;color:#f0f0f8;margin-bottom:8px;">
        Sign out?
      </div>
      <div style="font-size:13px;color:#6b6b8a;margin-bottom:24px;line-height:1.5;">
        You'll need to sign in again to access your dashboard.
      </div>
      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('signout-modal').remove()" style="
          flex:1;padding:11px;border-radius:10px;
          background:transparent;border:1.5px solid #2a2a3e;
          color:#9ca3af;font-size:14px;font-weight:600;
          cursor:pointer;font-family:sans-serif;
          transition:all .15s;
        " onmouseover="this.style.borderColor='#4a4a6e';this.style.color='#f0f0f8'"
           onmouseout="this.style.borderColor='#2a2a3e';this.style.color='#9ca3af'">
          Cancel
        </button>
        <button onclick="doSignout()" style="
          flex:1;padding:11px;border-radius:10px;
          background:linear-gradient(135deg,#ef4444,#dc2626);
          border:none;color:white;font-size:14px;font-weight:600;
          cursor:pointer;font-family:sans-serif;
          box-shadow:0 4px 16px rgba(239,68,68,0.3);
          transition:all .15s;
        " onmouseover="this.style.opacity='.85'"
           onmouseout="this.style.opacity='1'">
          Sign Out
        </button>
      </div>
    </div>
  `;

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

function doSignout() {
  document.getElementById('signout-modal')?.remove();
  localStorage.removeItem('optramail_email');
  localStorage.removeItem('optramail_plan');
  localStorage.removeItem('optramail_token');
  window.location.href = 'auth.html';
}
