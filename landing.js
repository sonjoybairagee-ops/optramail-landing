// ── SCROLL ANIMATIONS ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── HASH SCROLL ──
window.addEventListener('load', () => {
  const hash = window.location.hash;
  if (hash) {
    setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }
  // ✅ landing page এ কোনো redirect নেই — user নিজে navigate করবে
});

// ── BILLING TOGGLE ──
let isYearly = false;
const PAYMENT_URL = "https://whop.com/compx/optramail-pro/";

function toggleBilling() {
  isYearly = !isYearly;
  const track = document.getElementById('billing-toggle');
  const priceEl = document.getElementById('pro-price');
  const periodEl = document.getElementById('pro-period');
  const yearlyNote = document.getElementById('yearly-note');
  const labelMonthly = document.getElementById('label-monthly');
  const labelYearly = document.getElementById('label-yearly');

  if (isYearly) {
    track.classList.add('active');
    priceEl.textContent = '54';
    periodEl.textContent = 'per year';
    yearlyNote.style.display = 'block';
    labelMonthly.style.color = 'var(--muted)';
    labelYearly.style.color = 'var(--text)';
  } else {
    track.classList.remove('active');
    priceEl.textContent = '5';
    periodEl.textContent = 'per month';
    yearlyNote.style.display = 'none';
    labelMonthly.style.color = 'var(--text)';
    labelYearly.style.color = 'var(--muted)';
  }
}

function handleFreePlan() {
  alert("Download the Chrome Extension and sign in to get started for free!");
}

function handleProPlan() {
  window.open(PAYMENT_URL, '_blank');
}
