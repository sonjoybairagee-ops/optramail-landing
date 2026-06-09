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
    settingsIcon.addEventListener('click', () => {
      if (confirm('Sign out of OptraMail?')) {
        localStorage.removeItem('optramail_email');
        localStorage.removeItem('optramail_plan');
        window.location.href = 'index.html';
      }
    });
  }
});
