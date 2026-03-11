// js/auth.js — VanIQ Authentication
// Handles: Google OAuth, Email+Password, session management, plan detection

let _supabase = null;
let _currentUser = null;
let _currentProfile = null;
let _authListeners = [];

function getSupabase() {
  if (!_supabase) {
    _supabase = window.supabase.createClient(
      VANIQ_CONFIG.supabase.url,
      VANIQ_CONFIG.supabase.anonKey
    );
  }
  return _supabase;
}

// ── Session ──────────────────────────────────────────────────────────────────

async function initAuth() {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    _currentUser = session.user;
    await loadProfile();
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      _currentUser = session.user;
      await loadProfile();
      _authListeners.forEach(fn => fn('signed_in', _currentUser, _currentProfile));
    } else if (event === 'SIGNED_OUT') {
      _currentUser = null;
      _currentProfile = null;
      _authListeners.forEach(fn => fn('signed_out', null, null));
    } else if (event === 'TOKEN_REFRESHED') {
      _currentUser = session?.user || null;
    }
  });

  return { user: _currentUser, profile: _currentProfile };
}

function onAuthChange(fn) {
  _authListeners.push(fn);
}

// ── Profile ───────────────────────────────────────────────────────────────────

async function loadProfile() {
  if (!_currentUser) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', _currentUser.id)
    .single();
  if (!error && data) _currentProfile = data;
  return _currentProfile;
}

function getCurrentUser()    { return _currentUser; }
function getCurrentProfile() { return _currentProfile; }

function getUserPlan() {
  return _currentProfile?.plan || 'free';
}

function canSave()   { return VANIQ_CONFIG.plans[getUserPlan()]?.canSave   || false; }
function canExport() { return VANIQ_CONFIG.plans[getUserPlan()]?.canExport || false; }
function canShare()  { return VANIQ_CONFIG.plans[getUserPlan()]?.canShare  || false; }

function maxProjects() {
  const max = VANIQ_CONFIG.plans[getUserPlan()]?.maxProjects;
  return max === undefined ? 0 : max; // -1 = unlimited
}

// ── Sign In ───────────────────────────────────────────────────────────────────

async function signInWithGoogle() {
  const sb = getSupabase();
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
}

async function signInWithEmail(email, password) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUpWithEmail(email, password, fullName) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const sb = getSupabase();
  await sb.auth.signOut();
}

async function resetPassword(email) {
  const sb = getSupabase();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '?reset=true'
  });
  if (error) throw error;
}

// ── Auth Modal UI ─────────────────────────────────────────────────────────────

function showAuthModal(mode = 'signin', message = '') {
  const existing = document.getElementById('auth-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'auth-modal-overlay';
  overlay.className = 'auth-overlay';
  overlay.innerHTML = `
    <div class="auth-modal" id="auth-modal">
      <div class="auth-logo">🚐 VanIQ</div>
      ${message ? `<div class="auth-message">${message}</div>` : ''}

      <div class="auth-tabs">
        <button class="auth-tab ${mode==='signin'?'active':''}" onclick="authSwitchTab('signin')">Sign In</button>
        <button class="auth-tab ${mode==='signup'?'active':''}" onclick="authSwitchTab('signup')">Create Account</button>
      </div>

      <!-- SIGN IN -->
      <div id="auth-signin-panel" class="${mode==='signup'?'auth-hidden':''}">
        <button class="auth-google-btn" onclick="authGoogleClick()">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>
        <div class="auth-divider"><span>or</span></div>
        <input class="auth-input" type="email" id="signin-email" placeholder="Email address" />
        <input class="auth-input" type="password" id="signin-password" placeholder="Password" />
        <div id="auth-signin-error" class="auth-error"></div>
        <button class="auth-submit-btn" onclick="authSignInClick()">Sign In</button>
        <div class="auth-forgot"><a href="#" onclick="authForgotClick(event)">Forgot password?</a></div>
      </div>

      <!-- SIGN UP -->
      <div id="auth-signup-panel" class="${mode==='signin'?'auth-hidden':''}">
        <button class="auth-google-btn" onclick="authGoogleClick()">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Sign up with Google
        </button>
        <div class="auth-divider"><span>or</span></div>
        <input class="auth-input" type="text" id="signup-name" placeholder="Full name" />
        <input class="auth-input" type="email" id="signup-email" placeholder="Email address" />
        <input class="auth-input" type="password" id="signup-password" placeholder="Password (min 8 chars)" />
        <div id="auth-signup-error" class="auth-error"></div>
        <button class="auth-submit-btn" onclick="authSignUpClick()">Create Account</button>
      </div>

      <div class="auth-close" onclick="hideAuthModal()">✕</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) hideAuthModal(); });
}

function hideAuthModal() {
  const el = document.getElementById('auth-modal-overlay');
  if (el) el.remove();
}

function authSwitchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('[id^="auth-signin-panel"],[id^="auth-signup-panel"]').forEach(p => p.classList.add('auth-hidden'));
  document.querySelector(`.auth-tab:${tab==='signin'?'first':'last'}-child`)?.classList.add('active');
  document.getElementById(`auth-${tab}-panel`)?.classList.remove('auth-hidden');
}

async function authGoogleClick() {
  try { await signInWithGoogle(); }
  catch(e) { console.error(e); }
}

async function authSignInClick() {
  const email = document.getElementById('signin-email')?.value.trim();
  const password = document.getElementById('signin-password')?.value;
  const errEl = document.getElementById('auth-signin-error');
  if (!email || !password) { errEl.textContent = 'Please enter email and password.'; return; }
  try {
    errEl.textContent = '';
    await signInWithEmail(email, password);
    hideAuthModal();
  } catch(e) {
    errEl.textContent = e.message || 'Sign in failed.';
  }
}

async function authSignUpClick() {
  const name  = document.getElementById('signup-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const pass  = document.getElementById('signup-password')?.value;
  const errEl = document.getElementById('auth-signup-error');
  if (!name || !email || !pass) { errEl.textContent = 'All fields required.'; return; }
  if (pass.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }
  try {
    errEl.textContent = '';
    await signUpWithEmail(email, pass, name);
    errEl.style.color = '#4caf50';
    errEl.textContent = 'Account created! Check your email to verify.';
  } catch(e) {
    errEl.style.color = '';
    errEl.textContent = e.message || 'Sign up failed.';
  }
}

async function authForgotClick(e) {
  e.preventDefault();
  const email = document.getElementById('signin-email')?.value.trim();
  if (!email) { document.getElementById('auth-signin-error').textContent = 'Enter your email first.'; return; }
  try {
    await resetPassword(email);
    document.getElementById('auth-signin-error').style.color = '#4caf50';
    document.getElementById('auth-signin-error').textContent = 'Password reset email sent!';
  } catch(err) {
    document.getElementById('auth-signin-error').textContent = err.message;
  }
}
