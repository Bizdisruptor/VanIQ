// js/billing.js — VanIQ Stripe Billing
// Uses Stripe Checkout (redirect flow) — no secret keys needed client-side

let _stripe = null;

function getStripe() {
  if (!_stripe && window.Stripe) {
    _stripe = window.Stripe(VANIQ_CONFIG.stripe.publishableKey);
  }
  return _stripe;
}

// ── Checkout ──────────────────────────────────────────────────────────────────

// NOTE: Stripe Checkout requires a server-side session creation.
// For a static Netlify deploy, use Netlify Functions or Stripe Payment Links.
// This implementation uses Stripe Payment Links (simplest for static sites).
// Set these URLs in your Stripe dashboard → Payment Links.

const PAYMENT_LINKS = {
  // Replace with your actual Stripe Payment Links after creating them
  // in Stripe Dashboard → Payment Links
  // Make sure to add ?client_reference_id={USER_ID} to track the user
  singleBuild: 'https://buy.stripe.com/REPLACE_SINGLE_BUILD_LINK',
  builder:     'https://buy.stripe.com/REPLACE_BUILDER_LINK'
};

function openCheckout(productKey) {
  const user = getCurrentUser();
  if (!user) {
    showAuthModal('signin', 'Sign in to upgrade your plan.');
    return;
  }

  const baseUrl = PAYMENT_LINKS[productKey];
  if (!baseUrl || baseUrl.includes('REPLACE')) {
    // Fallback: show upgrade modal with instructions
    showUpgradeModal(productKey);
    return;
  }

  // Append user ID so webhook can match the purchase to the account
  const url = `${baseUrl}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email)}`;
  window.open(url, '_blank');
}

// ── Upgrade Prompt ────────────────────────────────────────────────────────────

function showUpgradeModal(reason) {
  const existing = document.getElementById('upgrade-modal-overlay');
  if (existing) existing.remove();

  const messages = {
    save:                 'Save your build to pick up where you left off.',
    export:               'Export your build as a PDF or image.',
    share:                'Share your build with a link.',
    PROJECT_LIMIT_REACHED:'You\'ve used your 1 saved project. Upgrade for unlimited builds.',
    UPGRADE_REQUIRED:     'Upgrade to save, export, and share your builds.'
  };

  const msg = messages[reason] || messages.UPGRADE_REQUIRED;

  const overlay = document.createElement('div');
  overlay.id = 'upgrade-modal-overlay';
  overlay.className = 'auth-overlay';
  overlay.innerHTML = `
    <div class="auth-modal upgrade-modal">
      <div class="auth-logo">🚐 VanIQ</div>
      <h2 class="upgrade-title">Upgrade Your Plan</h2>
      <p class="upgrade-msg">${msg}</p>

      <div class="upgrade-plans">
        <div class="upgrade-plan">
          <div class="upgrade-plan-name">Single Build</div>
          <div class="upgrade-plan-price">$39 <span>one-time</span></div>
          <ul class="upgrade-plan-features">
            <li>✓ Save 1 project</li>
            <li>✓ Export PDF / image</li>
            <li>✓ Share build link</li>
            <li>✓ Lifetime access to that build</li>
          </ul>
          <button class="upgrade-btn secondary" onclick="openCheckout('singleBuild'); hideUpgradeModal()">
            Buy Single Build — $39
          </button>
        </div>

        <div class="upgrade-plan featured">
          <div class="upgrade-plan-badge">Best Value</div>
          <div class="upgrade-plan-name">Builder</div>
          <div class="upgrade-plan-price">$159 <span>/ year</span></div>
          <ul class="upgrade-plan-features">
            <li>✓ Unlimited saved projects</li>
            <li>✓ Export PDF / image</li>
            <li>✓ Share build links</li>
            <li>✓ All future features</li>
            <li>✓ Priority support</li>
          </ul>
          <button class="upgrade-btn primary" onclick="openCheckout('builder'); hideUpgradeModal()">
            Get Builder — $159/yr
          </button>
        </div>
      </div>

      <div class="auth-close" onclick="hideUpgradeModal()">✕</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) hideUpgradeModal(); });
}

function hideUpgradeModal() {
  const el = document.getElementById('upgrade-modal-overlay');
  if (el) el.remove();
}

// ── Plan Badge in UI ──────────────────────────────────────────────────────────

function renderPlanBadge() {
  const el = document.getElementById('plan-badge');
  if (!el) return;
  const plan = getUserPlan();
  const labels = { free: 'Free', single: 'Single Build', builder: 'Builder' };
  const colors = { free: '#666', single: '#0a84ff', builder: '#ff9f0a' };
  el.textContent = labels[plan] || 'Free';
  el.style.color = colors[plan] || '#666';
  el.style.display = getCurrentUser() ? 'inline' : 'none';
}

// ── Post-payment success ──────────────────────────────────────────────────────
// Called when user returns from Stripe with ?upgraded=true in URL
// The webhook should have already updated the profile plan in Supabase
async function handlePostPayment() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('upgraded') === 'true') {
    // Reload profile to get updated plan
    await loadProfile();
    renderPlanBadge();
    showToast('🎉 Upgrade successful! Your plan has been activated.', 'success');
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
  }
}
