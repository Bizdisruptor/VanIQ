// VANIQ_SESSION_CONTEXT
// Repo: https://raw.githubusercontent.com/Bizdisruptor/VanIQ/refs/heads/main/
// Files: app.js, js/app.js, js/auth.js, js/billing.js, js/config.js, js/db.js
// Van dims: Transit 148 HR vw:78 vl:148 vh:83 | Sprinter 144 HR vw:76 vl:144 vh:79
// Active issues: track here each session
// js/app.js — VanIQ Main Application
// Assembled from v2 rebuild + complete function set

// ── Constants & State ─────────────────────────────────────────────────────────

const CAT = {
  bed:     { label:'Bed/Sleep',     bg:'rgba(93,106,176,.25)',  border:'#5d6ab0', text:'#9ba8e8' },
  galley:  { label:'Galley',        bg:'rgba(82,160,100,.22)',  border:'#52a064', text:'#82c87a' },
  bath:    { label:'Bath',          bg:'rgba(74,176,224,.2)',   border:'#4ab0e0', text:'#7ad0f8' },
  storage: { label:'Storage',       bg:'rgba(200,160,50,.2)',   border:'#c8a032', text:'#e8c860' },
  power:   { label:'Power/Elec',    bg:'rgba(232,100,50,.2)',   border:'#e86432', text:'#ff9466' },
  seating: { label:'Seating',       bg:'rgba(160,90,180,.22)',  border:'#a05ab4', text:'#c882e0' },
  frame:   { label:'Structure',     bg:'rgba(130,130,150,.18)', border:'#828296', text:'#aaaacc' },
  work:    { label:'Work/Office',   bg:'rgba(50,180,200,.2)',   border:'#32b4c8', text:'#64d8ec' },
  garage:  { label:'Garage',        bg:'rgba(180,100,50,.2)',   border:'#b46432', text:'#d8905a' },
};

// ── VAN_MODELS ─────────────────────────────────────────────────────────────────
// All dimensions verified from Upfit Supply measurement guides:
//   https://upfitsupply.com/blogs/measurement-guides
//
// Coordinate system (portrait plan view, CAB at TOP):
//   y = inches from BULKHEAD (0) toward REAR DOORS (vl)
//   x = inches from DRIVER WALL (0) toward PASSENGER WALL (vw)
//
// Wheel well key (from Upfit "Wheel Well Dimensions: W x H x D"):
//   d = W = fore-aft span in inches (along van length)
//   w = D = lateral depth from wall into cargo (NOT height)
//   x = 0 for driver side; (vw - w) for passenger side
//   y = distance from bulkhead to front edge of well (derived from AVC RIG PDF + axle position)
//
// Passenger wall shelf length is shorter than driver because of slide door opening.
// Slide door: yStart ≈ bpillar, yEnd = yStart + sideOpen
//
// Source citations per van type are in `source` field.

const VAN_MODELS = {

  // ── FORD TRANSIT 148 WB (Regular Body) ────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/ford-transit-148-wb-interior-cargo-measurements
  // Wheel Well: 35"W(fore-aft) × 11"H × 7.5"D(lateral) | Between wells: 54"
  // Driver shelf: 126" | Pass shelf: 75" | Side door: 48" | Rear door: 61.5"
  // Interior width: 54 + 7.5 + 7.5 = 69" (nominal 70" with insulation variance)
  'Transit 148 HR': {
    label: 'Ford Transit 148 HR', source: 'upfitsupply.com',
    vw: 70,   // interior width (driver wall to pass wall, post-insulation)
    vl: 145,  // interior cargo length (bulkhead to rear door interior)
    vh: 79, vh_lr: 53, vh_mr: 70, vh_hr: 79,
    partition: 9,       // typical partition depth from bulkhead
    bpillar: 30,        // B-pillar position from bulkhead (approx)
    // Wheel wells: 35"W × 7.5"D, between wells = 54", so x = (70-54)/2 - 7.5 error
    // Correct: vw=70, between=54, so each side = (70-54)/2 = 8" → but spec says 7.5"D
    // Use spec: w=7.5 (rounds to 8 for pixel), x_pass = 70-8 = 62
    // Position: AVC RIG PDF analysis puts well front edge at ~85" from bulkhead
    wheelWellL: { y: 85, d: 35, x: 0,  w: 8 },
    wheelWellR: { y: 85, d: 35, x: 62, w: 8 },
    slideDoor:  { yStart: 30, yEnd: 78 },   // 48" opening
    driverShelf: 126, passShelf: 75,
    sideOpen: 48, rearOpen: 61.5,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144],
    garageStart: 100,
  },

  // ── FORD TRANSIT 148 EXTENDED WB ──────────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/ford-transit-148-extended-wb-interior-cargo-measurements
  // Wheel Well: 35"W × 11"H × 8"D (SRW) | Between wells: 52" (SRW) / 44" (DRW)
  // Driver shelf: 136"-145" | Pass shelf: 103" | Side door: 36" | Rear door: 53"
  'Transit 148 EXT HR': {
    label: 'Ford Transit 148 EXT HR', source: 'upfitsupply.com',
    vw: 70, vl: 170, vh: 79, vh_hr: 79,
    partition: 9, bpillar: 30,
    wheelWellL: { y: 85, d: 35, x: 0,  w: 9 },
    wheelWellR: { y: 85, d: 35, x: 61, w: 9 },
    slideDoor:  { yStart: 30, yEnd: 66 },   // 36" opening
    driverShelf: 140, passShelf: 103,
    sideOpen: 36, rearOpen: 53,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144, 160],
    garageStart: 100,
  },

  // ── FORD TRANSIT 130 WB ────────────────────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/ford-transit-130-wb-interior-cargo-measurements
  // Wheel Well: 35"W × 11"H × 8"D | Between wells: 53"
  // Driver shelf: 92"-101" | Pass shelf: 58" | Side door: 36" | Rear door: 53"
  // Interior width: 53 + 8 + 8 = 69" ≈ 70"
  'Transit 130 LR': {
    label: 'Ford Transit 130 LR', source: 'upfitsupply.com',
    vw: 70, vl: 129, vh: 53, vh_lr: 53, vh_mr: 70,
    partition: 9, bpillar: 28,
    wheelWellL: { y: 65, d: 35, x: 0,  w: 8 },
    wheelWellR: { y: 65, d: 35, x: 62, w: 8 },
    slideDoor:  { yStart: 28, yEnd: 64 },   // 36" opening
    driverShelf: 96, passShelf: 58,
    sideOpen: 36, rearOpen: 53,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128],
    garageStart: 85,
  },
  'Transit 130 MR': {
    label: 'Ford Transit 130 MR', source: 'upfitsupply.com',
    vw: 70, vl: 129, vh: 70, vh_lr: 53, vh_mr: 70,
    partition: 9, bpillar: 28,
    wheelWellL: { y: 65, d: 35, x: 0,  w: 8 },
    wheelWellR: { y: 65, d: 35, x: 62, w: 8 },
    slideDoor:  { yStart: 28, yEnd: 64 },
    driverShelf: 96, passShelf: 58,
    sideOpen: 36, rearOpen: 53,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128],
    garageStart: 85,
  },

  // ── MERCEDES SPRINTER 144 WB ───────────────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/mercedes-benz-sprinter-144wb-interior-cargo-measurements
  // Wheel Well: 36"W × 12"H × 9"D | Between wells: 53.1"
  // Driver shelf: 116" | Pass shelf: 71" | Side door: 51.5" | Rear door: 61"
  // Interior width: 53.1 + 9 + 9 = 71.1" ≈ 71"
  'Sprinter 144 SR': {
    label: 'Sprinter 144 Std Roof', source: 'upfitsupply.com',
    vw: 71, vl: 144, vh: 66, vh_sr: 66, vh_hr: 78,
    partition: 9, bpillar: 28,
    wheelWellL: { y: 73, d: 36, x: 0,  w: 9 },
    wheelWellR: { y: 73, d: 36, x: 62, w: 9 },
    slideDoor:  { yStart: 28, yEnd: 80 },   // 51.5" opening
    driverShelf: 116, passShelf: 71,
    sideOpen: 51.5, rearOpen: 61,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144],
    garageStart: 95,
  },
  'Sprinter 144 HR': {
    label: 'Sprinter 144 High Roof', source: 'upfitsupply.com',
    vw: 71, vl: 144, vh: 78, vh_sr: 66, vh_hr: 78,
    partition: 9, bpillar: 28,
    wheelWellL: { y: 73, d: 36, x: 0,  w: 9 },
    wheelWellR: { y: 73, d: 36, x: 62, w: 9 },
    slideDoor:  { yStart: 28, yEnd: 80 },
    driverShelf: 116, passShelf: 71,
    sideOpen: 51.5, rearOpen: 61,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144],
    garageStart: 95,
  },

  // ── MERCEDES SPRINTER 170 WB ───────────────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/mercedes-benz-sprinter-170wb-interior-cargo-measurements
  // Wheel Well: 36"W × 12"H × 9"D | Between wells: 53.1" (same axle, longer rear overhang)
  // Driver shelf: 155" | Pass shelf: 110" | Side door: 51.5" | Rear door: 61"
  'Sprinter 170 HR': {
    label: 'Sprinter 170 High Roof', source: 'upfitsupply.com',
    vw: 71, vl: 170, vh: 72,
    partition: 9, bpillar: 28,
    wheelWellL: { y: 73, d: 36, x: 0,  w: 9 },
    wheelWellR: { y: 73, d: 36, x: 62, w: 9 },
    slideDoor:  { yStart: 28, yEnd: 80 },
    driverShelf: 155, passShelf: 110,
    sideOpen: 51.5, rearOpen: 61,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144, 160],
    garageStart: 120,
  },

  // ── MERCEDES SPRINTER 170 EXT WB ──────────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/mercedes-benz-sprinter-170-wb-ext-interior-cargo-measurements
  'Sprinter 170 EXT HR': {
    label: 'Sprinter 170 EXT HR', source: 'upfitsupply.com',
    vw: 71, vl: 192, vh: 72,
    partition: 9, bpillar: 28,
    wheelWellL: { y: 73, d: 36, x: 0,  w: 9 },
    wheelWellR: { y: 73, d: 36, x: 62, w: 9 },
    slideDoor:  { yStart: 28, yEnd: 80 },
    driverShelf: 170, passShelf: 128,
    sideOpen: 51.5, rearOpen: 61,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192],
    garageStart: 142,
  },

  // ── RAM PROMASTER 136 WB ───────────────────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/ram-promaster-136-wb-interior-cargo-measurements
  // Wheel Well: 35"W × 17"H × 9"D | Between wells: 56"
  // Driver shelf: 111" | Pass shelf: 62.5" | Side door: 43" | Rear door: 61"
  // Interior width: 56 + 9 + 9 = 74" ≈ 74"  (ProMaster is widest!)
  'ProMaster 136 HR': {
    label: 'Ram ProMaster 136 HR', source: 'upfitsupply.com',
    vw: 74, vl: 136, vh: 72, vh_sr: 68, vh_hr: 77,
    partition: 9, bpillar: 26,
    wheelWellL: { y: 68, d: 35, x: 0,  w: 9 },
    wheelWellR: { y: 68, d: 35, x: 65, w: 9 },
    slideDoor:  { yStart: 26, yEnd: 69 },   // 43" opening
    driverShelf: 111, passShelf: 62.5,
    sideOpen: 43, rearOpen: 61,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128],
    garageStart: 88,
  },

  // ── RAM PROMASTER 159 WB ───────────────────────────────────────────────────
  // Source: https://upfitsupply.com/blogs/measurement-guides/ram-promaster-159-wb-interior-cargo-measurements
  // Wheel Well: 35"W × 17"H × 9"D | Between wells: 56"
  // Driver shelf: 135" | Pass shelf: 85.5" | Side door: 48.5" | Rear door: 61"
  'ProMaster 159 HR': {
    label: 'Ram ProMaster 159 HR', source: 'upfitsupply.com',
    vw: 74, vl: 159, vh: 77, vh_sr: 77, vh_shr: 86,
    partition: 9, bpillar: 26,
    wheelWellL: { y: 68, d: 35, x: 0,  w: 9 },
    wheelWellR: { y: 68, d: 35, x: 65, w: 9 },
    slideDoor:  { yStart: 26, yEnd: 75 },   // 48.5" opening
    driverShelf: 135, passShelf: 85.5,
    sideOpen: 48.5, rearOpen: 61,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144, 160],
    garageStart: 110,
  },

  // ── CUSTOM ─────────────────────────────────────────────────────────────────
  'Custom': {
    label: 'Custom Van', source: 'user-defined',
    vw: 70, vl: 145, vh: 79,
    partition: 9, bpillar: 30,
    wheelWellL: { y: 85, d: 35, x: 0,  w: 8 },
    wheelWellR: { y: 85, d: 35, x: 62, w: 8 },
    slideDoor:  { yStart: 30, yEnd: 78 },
    driverShelf: 126, passShelf: 75,
    sideOpen: 48, rearOpen: 61.5,
    ribs: [16, 32, 48, 64, 80, 96, 112, 128, 144],
    garageStart: 100,
  },
};


let modules   = [];
let selId     = null;
let S         = 3;        // px per inch scale
let VIEW      = 'plan';
let crossY    = 50;
let undoStack = [];
let violationMap = {};    // modId → [string]
let editAnchorPoints = new Set();
let currentDbProjectId = null;  // Supabase project ID when loaded
let autoSaveTimer = null;
const PAD = 70, OY = 50; // ruler padding

// Projects array (in-memory for free users, synced to DB for paid)
let projects = [];
let currentProjectIdx = 0;
let inventory = [];

// ── Toast ─────────────────────────────────────────────────────────────────────

let _toastTimer = null;
function showToast(msg, type = '') {
  let t = document.getElementById('vaniq-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vaniq-toast';
    t.className = 'vaniq-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'vaniq-toast ' + type;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── User Menu ─────────────────────────────────────────────────────────────────

function toggleUserDropdown() {
  document.getElementById('user-dropdown')?.classList.toggle('open');
}

document.addEventListener('click', e => {
  const wrap = document.getElementById('user-menu-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('user-dropdown')?.classList.remove('open');
  }
});

function updateAuthUI() {
  const user    = getCurrentUser();
  const profile = getCurrentProfile();
  const plan    = getUserPlan();

  const signinBtn    = document.getElementById('signin-btn');
  const userAvatar   = document.getElementById('user-avatar');
  const userMenuWrap = document.getElementById('user-menu-wrap');
  const freeBanner   = document.getElementById('free-banner');

  if (user) {
    if (signinBtn)    signinBtn.style.display = 'none';
    if (userAvatar) {
      const initials = (profile?.full_name || user.email || 'U')
        .split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      userAvatar.textContent = initials;
      userMenuWrap.style.display = 'block';
    }
    document.getElementById('ud-name').textContent  = profile?.full_name || user.email;
    document.getElementById('ud-email').textContent = user.email;
    document.getElementById('ud-plan').textContent  = VANIQ_CONFIG.plans[plan]?.label || 'Free';

    if (freeBanner) freeBanner.style.display = plan === 'free' ? 'flex' : 'none';
  } else {
    if (signinBtn)    signinBtn.style.display = 'block';
    if (userMenuWrap) userMenuWrap.style.display = 'none';
    if (freeBanner)   freeBanner.style.display = 'flex';
  }

  // Save button state
  const saveBtn = document.querySelector('.abtn.green');
  if (saveBtn) {
    saveBtn.title = canSave() ? 'Save (Ctrl+S)' : 'Sign in & upgrade to save';
    saveBtn.style.opacity = canSave() ? '1' : '0.5';
  }
  renderPlanBadge?.();
}

// ── Undo ──────────────────────────────────────────────────────────────────────

function pushUndo() {
  undoStack.push(JSON.parse(JSON.stringify(modules)));
  if (undoStack.length > 40) undoStack.shift();
  updateUndoBtn();
}

function undo() {
  if (!undoStack.length) return;
  modules = undoStack.pop();
  runConstraints();
  renderCurrentView();
  renderModList();
  updateUndoBtn();
}

function updateUndoBtn() {
  const b = document.getElementById('btn-undo');
  if (b) b.disabled = undoStack.length === 0;
}

// ── Van References ────────────────────────────────────────────────────────────

function getTransitRefs() {
  const proj = projects[currentProjectIdx];
  const model = VAN_MODELS[proj?.vanModel] || VAN_MODELS['Transit 148 HR'];
  return model;
}

// ── Project Management (in-memory + DB sync) ──────────────────────────────────

function getProjects()  { return projects; }

async function saveLayout() {
  if (!canSave()) {
    showUpgradeModal('save');
    return;
  }
  const btn = document.querySelector('.abtn.green');
  if (btn) { btn.classList.add('saving'); btn.textContent = '⏳'; }

  try {
    const proj = projects[currentProjectIdx];
    const payload = {
      id: currentDbProjectId || undefined,
      name: proj.name || 'My Van Build',
      van_model: proj.vanModel || 'Transit 148 HR',
      modules: modules,
      systems: getSystems(),
      settings: { scale: S, crossY, view: VIEW }
    };

    const saved = await dbSaveProject(payload);
    currentDbProjectId = saved.id;
    showToast('💾 Build saved!', 'success');
    scheduleAutoSave(false); // cancel pending autosave since we just saved
  } catch(e) {
    if (e.message === 'UPGRADE_REQUIRED')    showUpgradeModal('UPGRADE_REQUIRED');
    else if (e.message === 'PROJECT_LIMIT_REACHED') showUpgradeModal('PROJECT_LIMIT_REACHED');
    else { showToast('Save failed: ' + e.message, 'error'); console.error(e); }
  } finally {
    if (btn) { btn.classList.remove('saving'); btn.textContent = '💾'; }
  }
}

function scheduleAutoSave(enable = true) {
  clearTimeout(autoSaveTimer);
  if (enable && canSave() && currentDbProjectId) {
    autoSaveTimer = setTimeout(saveLayout, 30000); // autosave every 30s after change
  }
}

function getSystems() {
  // Collect system checkbox states
  const sys = {};
  document.querySelectorAll('[data-sys]').forEach(el => {
    sys[el.dataset.sys] = el.checked;
  });
  return sys;
}

function saveProj() { /* compatibility shim */ saveLayout(); }

function projectSnapshot() {
  return { modules: JSON.parse(JSON.stringify(modules)), ts: Date.now() };
}

async function loadProjectById(id) {
  if (!canSave()) return;
  const proj = await dbGetProject(id);
  if (!proj) return;
  currentDbProjectId = proj.id;
  modules = proj.modules || [];
  if (proj.settings) {
    S = proj.settings.scale || S;
    crossY = proj.settings.crossY || crossY;
    VIEW = proj.settings.view || VIEW;
  }
  runConstraints();
  renderCurrentView();
  renderModList();
  showToast('📂 Project loaded');
}

async function renderProjectSelect() {
  const sel = document.getElementById('project-select');
  if (!sel) return;
  sel.innerHTML = '';

  if (!getCurrentUser() || !canSave()) {
    const opt = document.createElement('option');
    opt.textContent = projects[0]?.name || 'Current Build';
    sel.appendChild(opt);
    return;
  }

  const dbProjects = await dbGetProjects();
  if (dbProjects.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'No saved projects';
    sel.appendChild(opt);
    return;
  }
  dbProjects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === currentDbProjectId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function switchProject(id) {
  if (id) loadProjectById(id);
}

function getVanDefaults(model) {
  return VAN_MODELS[model] || VAN_MODELS['Transit 148 HR'];
}

function syncDimInputs() {
  const refs = getTransitRefs();
  ['vw','vl','vh'].forEach(k => {
    const el = document.getElementById('inp-' + k);
    if (el) el.value = refs[k];
  });
}

// ── Van Model Switcher (live dropdown on topbar) ──────────────────────────────

function switchVanModel(model) {
  if (!model || !VAN_MODELS[model]) return;
  if (!projects[currentProjectIdx]) return;
  projects[currentProjectIdx].vanModel = model;
  syncDimInputs();
  runConstraints();
  autoFitScale();
  renderCurrentView();
  recalc();
  closeVanPicker();
  showToast('Van model → ' + model);
  scheduleAutoSave();
}

function openVanPicker() {
  let ov = document.getElementById('van-picker-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'van-picker-overlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:8000;';
    ov.addEventListener('click', e => { if (e.target === ov) closeVanPicker(); });

    const panel = document.createElement('div');
    panel.style.cssText = 'position:absolute;top:38px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:1px solid rgba(255,255,255,.18);border-radius:8px;min-width:260px;padding:8px 0;box-shadow:0 8px 32px rgba(0,0,0,.6);font-family:"Space Mono",monospace;font-size:.72rem;z-index:8001;';

    const groups = {
      'Ford Transit':       ['Transit 130 LR','Transit 130 MR','Transit 148 HR','Transit 148 EXT HR'],
      'Mercedes Sprinter':  ['Sprinter 144 SR','Sprinter 144 HR','Sprinter 170 HR','Sprinter 170 EXT HR'],
      'Ram ProMaster':      ['ProMaster 136 HR','ProMaster 159 HR'],
      'Custom':             ['Custom'],
    };

    Object.entries(groups).forEach(([groupName, models]) => {
      const hdr = document.createElement('div');
      hdr.style.cssText = 'padding:4px 14px;font-size:.62rem;color:rgba(255,255,255,.3);letter-spacing:.08em;text-transform:uppercase;';
      hdr.textContent = groupName;
      panel.appendChild(hdr);

      models.forEach(m => {
        const btn = document.createElement('button');
        btn.style.cssText = 'display:block;width:100%;padding:6px 16px;background:none;border:none;color:rgba(255,255,255,.75);cursor:pointer;text-align:left;font-family:"Space Mono",monospace;font-size:.72rem;white-space:nowrap;';
        const mRefs = VAN_MODELS[m];
        btn.textContent = (VAN_MODELS[m]?.label || m);
        if (mRefs) {
          const sub = document.createElement('span');
          sub.style.cssText = 'display:block;font-size:.6rem;color:rgba(255,255,255,.3);';
          sub.textContent = `${mRefs.vl}"L × ${mRefs.vw}"W × ${mRefs.vh}"H`;
          btn.appendChild(sub);
        }
        btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,.07)';
        btn.onmouseleave = () => btn.style.background = 'none';
        const isCurrent = projects[currentProjectIdx]?.vanModel === m;
        if (isCurrent) {
          btn.style.color = '#f5a623';
          btn.style.borderLeft = '2px solid #f5a623';
          btn.style.paddingLeft = '14px';
        }
        btn.onclick = () => switchVanModel(m);
        panel.appendChild(btn);
      });
    });

    ov.appendChild(panel);
    document.body.appendChild(ov);
  }
  ov.style.display = 'block';
}

function closeVanPicker() {
  const ov = document.getElementById('van-picker-overlay');
  if (ov) {
    ov.style.display = 'none';
    ov.remove(); // remove so it rebuilds fresh next time (to update selection highlight)
  }
}

function syncSysCheckboxes() { /* populated from project data */ }
function applyInsulPreset(val) { /* insulation preset logic */ }
function clearInsulPreset() { /* clear insul preset */ }

// ── Calculations ──────────────────────────────────────────────────────────────

function recalc() {
  const refs = getTransitRefs();
  const VW = refs.vw, VL = refs.vl;
  const used = modules.reduce((sum, m) => sum + (m.w * m.d), 0);
  const total = VW * VL;
  const pct = total > 0 ? Math.round(100 * used / total) : 0;
  const cost = modules.reduce((sum, m) => sum + (m.cost || 0), 0);
  const slideOK = checkSlideDoor();

  el('tb-van', v => {
    const model = projects[currentProjectIdx]?.vanModel || 'Transit 148 HR';
    // Preserve the ▾ arrow child span
    const arrow = v.querySelector('#tb-van-arrow');
    v.textContent = model;
    if (arrow) v.appendChild(arrow);
  });
  el('tb-usable', v => v.textContent = `${pct}% used · ${(used/144).toFixed(1)} sqft`);
  el('tb-slide',  v => { v.textContent = slideOK ? '✓ Slide OK' : '⚠ Slide'; v.style.borderColor = slideOK ? '' : 'var(--error)'; });
  el('tb-cost',   v => v.textContent = `$${cost.toLocaleString()}`);

  const errCount = Object.values(violationMap).reduce((s,a) => s + a.length, 0);
  el('tb-errors', v => {
    v.style.display = errCount > 0 ? 'flex' : 'none';
    v.textContent = `⚠ ${errCount} issue${errCount !== 1 ? 's' : ''}`;
  });
  el('ib-err-n', v => v.textContent = errCount);
  el('ib-err-count', v => v.style.display = errCount > 0 ? 'inline' : 'none');
}

function el(id, fn) {
  const e = document.getElementById(id);
  if (e) fn(e);
}

function checkSlideDoor() {
  const refs = getTransitRefs();
  const bpillar = refs.bpillar || 42;
  // Any module on passenger side within 24" of B-pillar?
  const passMods = modules.filter(m => m.side === 'pass' || m.x > refs.vw / 2);
  return !passMods.some(m => m.y < bpillar + 24 && m.y + m.d > bpillar);
}

function setScale(v) {
  S = Math.max(1, Math.min(8, parseFloat(v) || 3));
  renderCurrentView();
}

function autoFitScale() {
  const refs = getTransitRefs();
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const availW = wrap.clientWidth - PAD - 20;
  const availH = wrap.clientHeight - OY - 20;
  const sx = availW / refs.vl;
  const sy = availH / refs.vw;
  S = Math.max(1, Math.min(6, Math.floor(Math.min(sx, sy) * 10) / 10));
  renderCurrentView();
}

function setCrossY(v) {
  crossY = parseInt(v) || 50;
  if (VIEW === 'cross') renderCurrentView();
}

function setView(v) {
  VIEW = v;
  document.querySelectorAll('.vtab').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('tab-' + v);
  if (tab) tab.classList.add('active');
  renderCurrentView();
}

// ── Canvas Helpers ────────────────────────────────────────────────────────────

function px(inches) { return Math.round(inches * S); }

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN VIEW — Portrait orientation (North-South), AVC RIG style
//
// COORDINATE SYSTEM (portrait, like AVC RIG PDF):
//   Canvas X axis = VAN WIDTH   (DRIVER=left, PASSENGER=right)
//   Canvas Y axis = VAN LENGTH  (CAB/BULKHEAD=top, REAR DOORS=bottom)
//
//   ox, oy  = top-left corner of INTERIOR CARGO FLOOR
//   px(n)   = inches → pixels
//
// Refs fields mapped to canvas:
//   VW (interior width)   → canvas width  (x axis)
//   VL (interior length)  → canvas height (y axis)
//   wheelWellL: driver side   → left side of canvas
//   wheelWellR: pass side     → right side of canvas
//   ww.y  = distance from BULKHEAD along LENGTH → canvas y: oy + px(ww.y)
//   ww.x  = distance from DRIVER wall → canvas x: ox + px(ww.x) [0=driver=left, 59=pass=right]
//   ww.d  = fore-aft depth (LENGTH)   → canvas height: px(ww.d)
//   ww.w  = wall intrusion (WIDTH)    → canvas width: px(ww.w)
//
//   slideDoor: on PASSENGER (right) wall
//     yStart/yEnd measured from BULKHEAD → canvas y: oy + px(yStart) / oy + px(yEnd)
//   bpillar, cPillar, dPillar: distance from BULKHEAD → canvas y: oy + px(pillar)
// ═══════════════════════════════════════════════════════════════════════════════

// ── PLAN VIEW — Transit top-down blueprint ─────────────────────────────────────
// Layout constants (padding around the interior cargo floor):
const PLAN_PAD_L = 68;   // left:  length ruler + "DRIVER" label
const PLAN_PAD_T = 52;   // top:   width ruler + "BULKHEAD" label
const PLAN_PAD_R = 72;   // right: slide door label + exterior body overhang
const PLAN_PAD_B = 68;   // bottom: rear door labels + exterior body overhang

// Body wall: how far exterior outline extends beyond interior floor edge (each side)
const PLAN_WALL = 5;  // inches — exterior body is 5" wider per side than interior floor

function renderPlan() {
  const refs = getTransitRefs();
  const VW = refs.vw, VL = refs.vl;
  const iw = px(VW), il = px(VL);
  const WE = px(PLAN_WALL);   // wall extent in px

  const W = iw + PLAN_PAD_L + PLAN_PAD_R + WE * 2;
  const H = il + PLAN_PAD_T + PLAN_PAD_B + WE * 2;

  // Interior cargo floor origin
  const ox = PLAN_PAD_L + WE;
  const oy = PLAN_PAD_T + WE;

  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.position = 'relative';
  wrap.style.minWidth  = W + 'px';
  wrap.style.minHeight = H + 'px';

  const cvs = makeCanvas(W, H);
  const ctx = cvs.getContext('2d');
  cvs.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(cvs);

  // Draw everything on canvas
  drawPlanBlueprint(ctx, refs, ox, oy, iw, il, WE, W, H);

  // SVG overlay for structural annotations (B-pillar, wheel well zone, etc.)
  const showRefs = document.getElementById('s-refs')?.checked !== false;
  if (showRefs) {
    const svg = makeSVG(W, H);
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    wrap.appendChild(svg);

    // B-pillar line (dark blue on white)
    if (refs.bpillar) {
      const bY = oy + px(refs.bpillar);
      svg.appendChild(svgEl('line', {x1:ox,y1:bY,x2:ox+iw,y2:bY,
        stroke:'rgba(0,60,160,0.55)','stroke-width':1.5,'stroke-dasharray':'7,4'}));
      svg.appendChild(svgText(ox+4, bY-3, 'B-PILLAR  '+refs.bpillar+'"',
        'rgba(0,60,160,0.7)', Math.max(7,S*1.0), 'start'));
    }

    // Partition zone (light red fill from oy to partition depth)
    if (refs.partition) {
      const pY = oy + px(refs.partition);
      svg.appendChild(svgEl('rect', {x:ox,y:oy,width:iw,height:px(refs.partition),
        fill:'rgba(200,0,0,0.04)',stroke:'none'}));
      svg.appendChild(svgEl('line', {x1:ox,y1:pY,x2:ox+iw,y2:pY,
        stroke:'rgba(180,0,0,0.5)','stroke-width':1.2,'stroke-dasharray':'5,3'}));
      svg.appendChild(svgText(ox+4, pY+10, 'PARTITION ZONE  '+refs.partition+'"',
        'rgba(180,0,0,0.6)', Math.max(7,S*0.9), 'start'));
    }

    // Driver shelf zone annotation (green zone on driver wall)
    if (refs.driverShelf) {
      const shelfTop = oy + px(VL - refs.driverShelf);
      svg.appendChild(svgEl('line', {x1:ox,y1:shelfTop,x2:ox,y2:oy+il,
        stroke:'rgba(0,120,60,0.5)','stroke-width':4}));
      svg.appendChild(svgText(ox+4, shelfTop+12, '← DRIVER SHELF  '+refs.driverShelf+'"',
        'rgba(0,100,50,0.7)', Math.max(7,S*0.9), 'start'));
    }

    // Passenger shelf zone (green on pass side, shorter due to slide door)
    if (refs.passShelf) {
      const psTop = oy + px(VL - refs.passShelf);
      svg.appendChild(svgEl('line', {x1:ox+iw,y1:psTop,x2:ox+iw,y2:oy+il,
        stroke:'rgba(0,120,60,0.4)','stroke-width':4}));
    }

    // Slide clearance zone — light green fill over cargo floor
    if (refs.slideDoor) {
      const sd = refs.slideDoor;
      svg.appendChild(svgEl('rect', {
        x:ox+iw-px(24), y:oy+px(sd.yStart),
        width:px(24), height:px(sd.yEnd-sd.yStart),
        fill:'rgba(0,166,81,0.06)', stroke:'rgba(0,166,81,0.2)',
        'stroke-width':0.8, 'stroke-dasharray':'4,3'
      }));
    }
  }

  // Module dropzone (exactly over interior cargo floor)
  const dz = document.createElement('div');
  dz.id = 'plan-dropzone';
  dz.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;width:${iw}px;height:${il}px;`;
  wrap.appendChild(dz);

  modules.filter(m => m.layer === 'floor').forEach(m => addPlanMod(m, dz, VW, VL));
  modules.filter(m => m.layer !== 'floor').forEach(m => addPlanMod(m, dz, VW, VL));

  // Legend (dark text on white background)
  const leg = document.createElement('div');
  leg.style.cssText = `position:absolute;left:${ox}px;top:${oy+il+WE+54}px;`+
    `display:flex;gap:16px;flex-wrap:wrap;font:9px Arial,sans-serif;`+
    `color:#555;pointer-events:none;background:#fff;padding:4px 0;`;
  leg.innerHTML =
    '<span style="color:#888">▨ Wheel well (hatched)</span>'+
    '<span style="color:#00a651">━ Slide door</span>'+
    '<span style="color:rgba(0,60,160,0.7)">- - B-pillar</span>'+
    '<span style="color:rgba(50,100,200,0.6)">── Floor ribs (16")</span>'+
    '<span style="color:rgba(0,60,160,0.2)">··· 1" / 6" / 12" grid</span>';
  wrap.appendChild(leg);

  // Specs button — show Upfit Supply measurements
  const specsBtn = document.createElement('button');
  specsBtn.textContent = '📐 Van Specs';
  specsBtn.style.cssText = `position:absolute;left:${ox+iw-90}px;top:${oy+il+WE+52}px;`+
    `padding:4px 10px;font:11px Arial;background:#1a1a2e;color:#fff;`+
    `border:1px solid #333;border-radius:4px;cursor:pointer;z-index:10;`;
  specsBtn.onclick = () => showVanSpecs(refs);
  wrap.appendChild(specsBtn);

  recalc();
}

// ── Van Specs Modal ───────────────────────────────────────────────────────────
function showVanSpecs(refs) {
  const existing = document.getElementById('van-specs-modal');
  if (existing) { existing.remove(); return; }
  const modal = document.createElement('div');
  modal.id = 'van-specs-modal';
  modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'
    +'background:#fff;border:2px solid #1a1a2e;border-radius:8px;padding:20px 24px;'
    +'z-index:9999;min-width:340px;max-width:500px;box-shadow:0 8px 32px rgba(0,0,0,0.3);'
    +'font-family:Arial,sans-serif;color:#1a1a2e;';
  const rows = [
    ['Interior Width', refs.vw + '"'],
    ['Interior Length (Cargo)', refs.vl + '"'],
    ['Inside Roof Height', refs.vh ? refs.vh + '"' : (refs.vh_lr||'?')+'" LR / '+(refs.vh_mr||'?')+'" MR / '+(refs.vh_hr||'?')+'" HR'],
    ['Wheel Well Dimensions', refs.wheelWellL ? refs.wheelWellL.d+'" W × '+refs.wheelWellL.w+'" D' : '—'],
    ['Distance Between Wheel Wells', refs.wheelWellR ? (refs.wheelWellR.x - refs.wheelWellL.w)+'"' : '—'],
    ['Wall Space — Driver Side', (refs.driverShelf||'—') + '"'],
    ['Wall Space — Passenger Side', (refs.passShelf||'—') + '"'],
    ['Slide Door Opening Width', (refs.sideOpen||'—') + '"'],
    ['Rear Door Opening Width', (refs.rearOpen||'—') + '"'],
    ['Typical Partition Depth', (refs.partition||9) + '"'],
  ];
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <h3 style="margin:0;font-size:15px;">${refs.label || 'Van Specs'}</h3>
    <button onclick="document.getElementById('van-specs-modal').remove()"
      style="background:none;border:none;font-size:18px;cursor:pointer;color:#555">✕</button>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <tr style="background:#f0f2f5;"><th style="text-align:left;padding:5px 8px;border-bottom:2px solid #1a1a2e;">Measurement</th>
    <th style="text-align:right;padding:5px 8px;border-bottom:2px solid #1a1a2e;">Value</th></tr>`;
  rows.forEach(([k,v],i) => {
    html += `<tr style="background:${i%2?'#f8f9fb':'#fff'}">
      <td style="padding:5px 8px;border-bottom:1px solid #e0e4ea;">${k}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #e0e4ea;text-align:right;font-weight:bold;">${v}</td></tr>`;
  });
  if (refs.source && refs.source !== 'user-defined') {
    html += `</table><p style="margin:10px 0 0;font-size:10px;color:#888;">Source: ${refs.source}</p>`;
  } else { html += '</table>'; }
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

// ── Core blueprint drawing — white background, professional engineering style ───
// Matches Upfit Supply / AVC RIG aesthetic: clean white, black lines, colored annotations
function drawPlanBlueprint(ctx, refs, ox, oy, iw, il, WE, W, H) {
  const VW = refs.vw, VL = refs.vl;

  // ── 0. White background ──────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Light rule lines outside cargo area (for rulers to land on)
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0, 0, W, H);

  // ── 1. Exterior van body ─────────────────────────────────────────────────────
  const bx = ox - WE, by = oy - WE, bw = iw + WE*2, bh = il + WE*2;
  const rTop = Math.max(px(5), WE + px(1));
  const rBot = Math.max(2, WE * 0.3);

  function bodyPath() {
    ctx.beginPath();
    ctx.moveTo(bx + rTop, by);
    ctx.lineTo(bx + bw - rTop, by);
    ctx.quadraticCurveTo(bx+bw, by,      bx+bw, by+rTop);
    ctx.lineTo(bx+bw, by+bh-rBot);
    ctx.quadraticCurveTo(bx+bw, by+bh,   bx+bw-rBot, by+bh);
    ctx.lineTo(bx+rBot, by+bh);
    ctx.quadraticCurveTo(bx, by+bh,      bx, by+bh-rBot);
    ctx.lineTo(bx, by+rTop);
    ctx.quadraticCurveTo(bx, by,         bx+rTop, by);
    ctx.closePath();
  }

  // Body fill (very light gray — van body skin visible vs white background)
  ctx.fillStyle = '#f0f2f5';
  bodyPath(); ctx.fill();

  // Body outline
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2.5;
  bodyPath(); ctx.stroke();

  // ── 2. Wheel arch bumps (exterior fender protrusions) ────────────────────────
  const BUMP = px(9);
  const AR   = px(4);

  function drawArchBump(ww, side) {
    if (!ww) return;
    const at = oy + px(ww.y), al = px(ww.d), ab = at + al;
    const wx = side === 'L' ? bx : bx + bw;
    const tx = side === 'L' ? bx - BUMP : bx + bw + BUMP;
    const sign = side === 'L' ? 1 : -1;

    ctx.fillStyle = '#e4e8ef';
    ctx.beginPath();
    ctx.moveTo(wx, at);
    ctx.lineTo(tx + sign*AR, at);
    ctx.quadraticCurveTo(tx, at, tx, at + AR);
    ctx.lineTo(tx, ab - AR);
    ctx.quadraticCurveTo(tx, ab, tx + sign*AR, ab);
    ctx.lineTo(wx, ab);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx, at);
    ctx.lineTo(tx + sign*AR, at);
    ctx.quadraticCurveTo(tx, at, tx, at + AR);
    ctx.lineTo(tx, ab - AR);
    ctx.quadraticCurveTo(tx, ab, tx + sign*AR, ab);
    ctx.lineTo(wx, ab); ctx.stroke();

    // Tire detail (small arc inside bump)
    const tireR = al * 0.38;
    const tireX = side === 'L' ? tx + px(3) : tx - px(3);
    const tireMid = (at + ab) / 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tireX + sign * tireR, tireMid, tireR, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawArchBump(refs.wheelWellL, 'L');
  drawArchBump(refs.wheelWellR, 'R');

  // ── 3. Interior cargo floor ───────────────────────────────────────────────────
  // Clean white floor — the canvas for the grid
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ox, oy, iw, il);

  // 1" minor grid (very fine — matches AVC RIG "1 square = 1 inch")
  ctx.strokeStyle = 'rgba(0,100,200,0.08)';
  ctx.lineWidth = 0.4;
  for (let x = 0; x <= VW; x++) {
    const xp = ox + px(x);
    ctx.beginPath(); ctx.moveTo(xp, oy); ctx.lineTo(xp, oy+il); ctx.stroke();
  }
  for (let y = 0; y <= VL; y++) {
    const yp = oy + px(y);
    ctx.beginPath(); ctx.moveTo(ox, yp); ctx.lineTo(ox+iw, yp); ctx.stroke();
  }

  // 6" grid (light blue)
  ctx.strokeStyle = 'rgba(0,80,180,0.12)';
  ctx.lineWidth = 0.55;
  for (let x = 0; x <= VW; x += 6) {
    const xp = ox + px(x);
    ctx.beginPath(); ctx.moveTo(xp, oy); ctx.lineTo(xp, oy+il); ctx.stroke();
  }
  for (let y = 0; y <= VL; y += 6) {
    const yp = oy + px(y);
    ctx.beginPath(); ctx.moveTo(ox, yp); ctx.lineTo(ox+iw, yp); ctx.stroke();
  }

  // 12" major grid (medium blue)
  ctx.strokeStyle = 'rgba(0,60,160,0.22)';
  ctx.lineWidth = 0.8;
  for (let x = 0; x <= VW; x += 12) {
    const xp = ox + px(x);
    ctx.beginPath(); ctx.moveTo(xp, oy); ctx.lineTo(xp, oy+il); ctx.stroke();
  }
  for (let y = 0; y <= VL; y += 12) {
    const yp = oy + px(y);
    ctx.beginPath(); ctx.moveTo(ox, yp); ctx.lineTo(ox+iw, yp); ctx.stroke();
  }

  // Interior floor border (bold black)
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, iw, il);

  // ── 4. Floor ribs (structural cross-members every 16") ───────────────────────
  // Drawn as solid thick lines with end caps — clearly visible for builders
  (refs.ribs || []).forEach(r => {
    if (r === 0 || r >= VL) return;
    const ry = oy + px(r);
    // Rib label on left
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold ' + Math.max(5, px(0.75)) + 'px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('R' + r, ox - 3, ry + 3);
    // Rib line
    ctx.strokeStyle = 'rgba(50,100,200,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(ox + 1, ry); ctx.lineTo(ox + iw - 1, ry); ctx.stroke();
    // End marks
    ctx.strokeStyle = 'rgba(50,100,200,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, ry-3); ctx.lineTo(ox, ry+3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox+iw, ry-3); ctx.lineTo(ox+iw, ry+3); ctx.stroke();
  });

  // ── 5. Wheel well cutouts (inside cargo floor) ───────────────────────────────
  // Cross-hatched gray boxes — standard engineering drawing notation for solid object
  [[refs.wheelWellL, 'L'], [refs.wheelWellR, 'R']].forEach(([ww, side]) => {
    if (!ww) return;
    const wy  = oy + px(ww.y);
    const wl  = px(ww.d);
    const wdp = px(ww.w);
    const wxL = side === 'L' ? ox : ox + iw - wdp;

    // Gray fill
    ctx.fillStyle = '#d0d5de';
    ctx.fillRect(wxL, wy, wdp, wl);

    // Cross-hatch (45° engineering hatching)
    ctx.save();
    ctx.beginPath(); ctx.rect(wxL, wy, wdp, wl); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    const step = 6;
    for (let i = -wl; i < wdp + wl; i += step) {
      ctx.beginPath(); ctx.moveTo(wxL + i, wy); ctx.lineTo(wxL + i + wl, wy + wl); ctx.stroke();
    }
    ctx.restore();

    // Well border (bold)
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1.8; ctx.setLineDash([]);
    ctx.strokeRect(wxL, wy, wdp, wl);

    // Dimension labels inside well
    const midY = wy + wl / 2;
    const midX = wxL + wdp / 2;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold ' + Math.max(6, px(1.1)) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WW', midX, midY - 4);
    if (px(ww.d) > 28) {
      ctx.font = Math.max(5, px(0.9)) + 'px Arial';
      ctx.fillText(ww.d + '"×' + ww.w + '"', midX, midY + 8);
    }
  });

  // ── 6. Partition line (typical partition depth annotation) ────────────────────
  if (refs.partition) {
    const partY = oy + px(refs.partition);
    ctx.strokeStyle = 'rgba(180,0,0,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(ox, partY); ctx.lineTo(ox+iw, partY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(180,0,0,0.6)';
    ctx.font = Math.max(6, px(0.9)) + 'px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('PARTITION ' + refs.partition + '"', ox + 3, partY - 3);
  }

  // ── 7. Bulkhead (top — cab end) ───────────────────────────────────────────────
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 4; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox+iw, oy); ctx.stroke();
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold ' + Math.max(8, px(1.1)) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('BULKHEAD / CAB END', ox+iw/2, oy - 10);

  // ── 8. Rear doors (bottom) ────────────────────────────────────────────────────
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(ox, oy+il); ctx.lineTo(ox+iw, oy+il); ctx.stroke();
  // Center split
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(ox+iw/2, oy+il); ctx.lineTo(ox+iw/2, oy+il+px(4)); ctx.stroke();
  ctx.setLineDash([]);
  // Door swing arcs
  const swR = Math.min(px(VW/2), px(36));
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1; ctx.setLineDash([2,4]);
  ctx.beginPath(); ctx.arc(ox, oy+il, swR, -Math.PI/2, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(ox+iw, oy+il, swR, Math.PI, -Math.PI/2); ctx.stroke();
  ctx.setLineDash([]);
  // Rear door dimension callout
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold ' + Math.max(7, px(1.0)) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('REAR DOORS  ' + (refs.rearOpen || '') + '" WIDE', ox+iw/2, oy+il+WE+18);

  // ── 9. Slide door (passenger / right side) ────────────────────────────────────
  if (refs.slideDoor) {
    const sd = refs.slideDoor;
    const sdY1 = oy + px(sd.yStart);
    const sdY2 = oy + px(sd.yEnd);
    const sdLen = sd.yEnd - sd.yStart;
    const sdMid = (sdY1 + sdY2) / 2;

    // Green bar on right wall edge
    ctx.strokeStyle = '#00a651'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(ox+iw, sdY1); ctx.lineTo(ox+iw, sdY2); ctx.stroke();

    // Jamb tick marks
    [sdY1, sdY2].forEach(ty => {
      ctx.strokeStyle = '#00a651'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ox+iw-px(6), ty); ctx.lineTo(ox+iw+14, ty); ctx.stroke();
    });

    // Label (rotated)
    ctx.save();
    ctx.fillStyle = '#00a651';
    ctx.font = 'bold ' + Math.max(7, px(1.05)) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.translate(ox+iw+WE+22, sdMid); ctx.rotate(Math.PI/2);
    ctx.fillText('SLIDE  ' + sdLen + '"', 0, 0);
    ctx.restore();
  }

  // ── 10. Driver shelf annotation ───────────────────────────────────────────────
  if (refs.driverShelf) {
    const shelfEnd = oy + px(VL);
    const shelfStart = oy + px(VL - refs.driverShelf);
    // Dimension line on driver (left) exterior
    const dlX = bx - BUMP - 18;
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dlX, shelfStart); ctx.lineTo(dlX, shelfEnd); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dlX-4, shelfStart); ctx.lineTo(dlX+4, shelfStart); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dlX-4, shelfEnd); ctx.lineTo(dlX+4, shelfEnd); ctx.stroke();
    ctx.save(); ctx.fillStyle = '#444';
    ctx.font = Math.max(7, px(1.0)) + 'px Arial'; ctx.textAlign = 'center';
    ctx.translate(dlX-10, (shelfStart+shelfEnd)/2); ctx.rotate(-Math.PI/2);
    ctx.fillText('SHELF ' + refs.driverShelf + '"', 0, 0); ctx.restore();
  }

  // ── 11. Centerline ────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,60,160,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([8,4]);
  ctx.beginPath(); ctx.moveTo(ox+iw/2, oy); ctx.lineTo(ox+iw/2, oy+il); ctx.stroke();
  ctx.setLineDash([]);

  // ── 12. Width ruler (top, offset from center) ────────────────────────────────
  const halfW = VW / 2;
  const step = S >= 3 ? 6 : 12;
  ctx.textAlign = 'center';
  for (let x = 0; x <= VW; x += step) {
    const xp = ox + px(x);
    const off = Math.round(x - halfW);
    const isMajor = (x % 12 === 0);
    ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth = isMajor ? 1 : 0.6;
    ctx.beginPath(); ctx.moveTo(xp, oy - (isMajor ? 10 : 6)); ctx.lineTo(xp, oy); ctx.stroke();
    if (isMajor) {
      const lbl = off === 0 ? '0' : (off > 0 ? '+'+off : ''+off);
      ctx.fillStyle = off === 0 ? '#0050c8' : '#333';
      ctx.font = (off === 0 ? 'bold ' : '') + Math.max(7, px(1.2)) + 'px Arial';
      ctx.fillText(lbl + '"', xp, oy - 14);
    }
  }

  // ── 13. Length ruler (left side, bulkhead = 0") ───────────────────────────────
  ctx.textAlign = 'right';
  const ystep = S >= 3 ? 12 : 24;
  for (let y = 0; y <= VL; y += ystep) {
    const yp = oy + px(y);
    const isMajor = (y % 12 === 0);
    ctx.strokeStyle = isMajor ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth = isMajor ? 1 : 0.6;
    ctx.beginPath(); ctx.moveTo(ox-(isMajor?10:6), yp); ctx.lineTo(ox, yp); ctx.stroke();
    if (isMajor) {
      ctx.fillStyle = '#333';
      ctx.font = Math.max(7, px(1.1)) + 'px Arial';
      ctx.fillText(y + '"', ox - 13, yp + 4);
    }
  }

  // ── 14. Dimension annotation — interior width + length ────────────────────────
  // Width: horizontal arrow across top
  const arrowY = oy - 32;
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(ox, arrowY); ctx.lineTo(ox+iw, arrowY); ctx.stroke();
  [[ox, -1],[ox+iw, 1]].forEach(([x,d]) => {
    ctx.beginPath(); ctx.moveTo(x,arrowY); ctx.lineTo(x+d*8,arrowY-3); ctx.moveTo(x,arrowY); ctx.lineTo(x+d*8,arrowY+3); ctx.stroke();
  });
  ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold ' + Math.max(8, px(1.2)) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.fillRect(ox+iw/2-20, arrowY-8, 40, 12);
  ctx.fillStyle = '#1a1a2e'; ctx.fillText(VW + '"', ox+iw/2, arrowY+3);

  // Length: vertical arrow on right side
  const arrX = ox + iw + WE + (refs.slideDoor ? 52 : 22);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(arrX, oy); ctx.lineTo(arrX, oy+il); ctx.stroke();
  [[oy,-1],[oy+il,1]].forEach(([y,d]) => {
    ctx.beginPath(); ctx.moveTo(arrX,y); ctx.lineTo(arrX-3,y+d*8); ctx.moveTo(arrX,y); ctx.lineTo(arrX+3,y+d*8); ctx.stroke();
  });
  ctx.fillStyle = '#fff'; ctx.fillRect(arrX-12, oy+il/2-8, 24, 14);
  ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold ' + Math.max(8, px(1.2)) + 'px Arial';
  ctx.textAlign = 'center'; ctx.save();
  ctx.translate(arrX+14, oy+il/2); ctx.rotate(Math.PI/2);
  ctx.fillText(VL + '"', 0, 0); ctx.restore();

  // ── 15. Side labels (DRIVER / PASSENGER) ─────────────────────────────────────
  ctx.fillStyle = '#555'; ctx.font = 'bold ' + Math.max(7, px(0.95)) + 'px Arial';
  ctx.save(); ctx.translate(bx - BUMP - 6, oy + il/2); ctx.rotate(-Math.PI/2);
  ctx.textAlign = 'center'; ctx.fillText('DRIVER', 0, 0); ctx.restore();
  ctx.save(); ctx.translate(bx+bw + BUMP + 6, oy + il/2); ctx.rotate(Math.PI/2);
  ctx.textAlign = 'center'; ctx.fillText('PASSENGER', 0, 0); ctx.restore();

  // ── 16. Scale label & title ───────────────────────────────────────────────────
  ctx.fillStyle = '#555'; ctx.font = Math.max(7, px(0.9)) + 'px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(
    '1 square = 1"  ·  ' + (refs.label || 'Van Blueprint') + '  ·  Scale ' + S + 'px/in',
    ox, oy + il + WE + 46
  );

  // ── 17. Between-wells dimension (horizontal) ──────────────────────────────────
  if (refs.wheelWellL && refs.wheelWellR) {
    const wwY = refs.wheelWellL.y;
    const midWW = oy + px(wwY + refs.wheelWellL.d / 2);
    const wwLR = ox + px(refs.wheelWellL.w);
    const wwRR = ox + px(refs.wheelWellR.x);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(wwLR, midWW); ctx.lineTo(wwRR, midWW); ctx.stroke();
    [[wwLR,-1],[wwRR,1]].forEach(([x,d]) => {
      ctx.beginPath(); ctx.moveTo(x,midWW); ctx.lineTo(x+d*5,midWW-3); ctx.moveTo(x,midWW); ctx.lineTo(x+d*5,midWW+3); ctx.stroke();
    });
    const bwLabel = refs.wheelWellR.x - refs.wheelWellL.w;
    ctx.fillStyle = '#fff'; ctx.fillRect((wwLR+wwRR)/2-16, midWW-8, 32, 12);
    ctx.fillStyle = '#444'; ctx.font = Math.max(6, px(0.9)) + 'px Arial'; ctx.textAlign = 'center';
    ctx.fillText(bwLabel + '" apart', (wwLR+wwRR)/2, midWW+3);
  }
}

function makeSVG(w, h) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', w); svg.setAttribute('height', h);
  svg.style.position = 'absolute'; svg.style.top = '0'; svg.style.left = '0';
  return svg;
}

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function svgLine(x1, y1, x2, y2, stroke, sw = 1) {
  return svgEl('line', { x1, y1, x2, y2, stroke, 'stroke-width': sw });
}

function svgText(x, y, text, fill, fs = 9, anchor = 'middle') {
  const t = svgEl('text', { x, y, fill, 'font-size': fs, 'text-anchor': anchor,
    'font-family': "'Space Mono', monospace" });
  t.textContent = text;
  return t;
}

// ── Plan View ─────────────────────────────────────────────────────────────────

function addPlanMod(m, dz, VW, VL) {
  const c = CAT[m.cat] || CAT.frame;
  const modPxH = px(m.d);
  const modPxW = px(m.w);
  const showDims = modPxH >= 28 && modPxW >= 40;
  const showSubs = modPxH >= 52 && modPxW >= 44;
  const nameFS = Math.max(7, Math.min(S * 1.8, modPxW / 5));
  const dimFS  = Math.max(6, S * 1.3);
  const hasViolation = (violationMap[m.id] || []).length > 0;

  const subsHTML = (showSubs && m.contents && m.contents.length > 0)
    ? `<div class="mod-subs">${m.contents.slice(0,4).map(s=>`<div class="mod-sub" style="border-color:${c.text}">${s}</div>`).join('')}</div>`
    : '';

  // Deploy ghost
  const dep = m.deploy;
  if (dep && dep.enabled && dep.deployed) {
    const ghost = document.createElement('div');
    ghost.className = 'deploy-ghost';
    const gExtraW = dep.extraW || 0, gExtraD = dep.extraD || 0;
    let gx = m.x, gy = m.y, gw = m.w, gd = m.d;
    if (dep.dir === 'right')  { gw += gExtraW; }
    if (dep.dir === 'left')   { gx -= gExtraW; gw += gExtraW; }
    if (dep.dir === 'rear')   { gd += gExtraD; }
    if (dep.dir === 'front')  { gy -= gExtraD; gd += gExtraD; }
    ghost.style.cssText = `position:absolute;left:${px(gx)}px;top:${px(gy)}px;width:${px(gw)}px;height:${px(gd)}px;`;
    dz.appendChild(ghost);
  }

  const el = document.createElement('div');
  el.id = 'pm-' + m.id;
  el.className = 'mod' + (hasViolation ? ' violation' : '') + (m.anchor?.enabled ? ' anchored' : '');
  el.dataset.mid = m.id;

  const borderColor = hasViolation ? 'var(--error)' : c.border;
  const bgColor = hasViolation ? 'rgba(216,80,80,.12)' : c.bg;

  el.style.cssText = `
    left:${px(m.x)}px;top:${px(m.y)}px;
    width:${px(m.w)}px;height:${px(m.d)}px;
    background:${bgColor};border:1.5px solid ${borderColor};
    position:absolute;box-sizing:border-box;cursor:move;user-select:none;
    border-radius:2px;overflow:hidden;
  `;

  el.innerHTML = `
    ${hasViolation ? `<div class="mod-violation-badge" title="${(violationMap[m.id]||[]).join('\n')}">!</div>` : ''}
    ${m.anchor?.enabled ? '<div class="mod-anchor-badge" title="Anchored">⚓</div>' : ''}
    <div class="mod-name" style="font-size:${nameFS}px;color:${c.text}">${m.name}</div>
    ${showDims ? `<div class="mod-dim" style="font-size:${dimFS}px">${m.w}"×${m.d}"</div>` : ''}
    ${subsHTML}
  `;

  el.addEventListener('click', e => { e.stopPropagation(); selMod(m.id); });
  el.addEventListener('dblclick', e => { e.stopPropagation(); selMod(m.id); openEdit(); });

  dz.appendChild(el);
  makeDraggable(el, m, dz, VW, VL);
  makeResizable(el, m, dz, VW, VL);
}

// ── Draggable / Resizable ─────────────────────────────────────────────────────

function makeDraggable(el, m, dz, VW, VL) {
  let startX, startY, startMX, startMY;

  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('resize-handle')) return;
    e.preventDefault();
    startX = e.clientX; startY = e.clientY;
    startMX = m.x; startMY = m.y;
    selMod(m.id);

    const onMove = ev => {
      const dx = (ev.clientX - startX) / S;
      const dy = (ev.clientY - startY) / S;

      // Anchor constraints
      const anchor = m.anchor;
      let nx = startMX + dx;
      let ny = startMY + dy;

      if (anchor?.enabled && anchor.points) {
        const pts = Array.isArray(anchor.points) ? anchor.points : [...anchor.points];
        if (pts.includes('front') || pts.includes('rear')) ny = startMY;    // freeze Y
        if (pts.includes('driver') || pts.includes('pass')) nx = startMX;   // freeze X
        if (pts.includes('center-x')) nx = (VW - m.w) / 2;
        if (pts.includes('center-y')) ny = startMY; // keep centered on Y
      }

      // Clamp to van bounds
      nx = Math.max(0, Math.min(VL - m.w, Math.round(nx)));
      ny = Math.max(0, Math.min(VW - m.d, Math.round(ny)));

      m.x = nx; m.y = ny;
      el.style.left = px(nx) + 'px';
      el.style.top  = px(ny) + 'px';
      updateAnchorHud(m);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      pushUndo();
      runConstraints();
      recalc();
      scheduleAutoSave();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function makeResizable(el, m, dz, VW, VL) {
  const handle = document.createElement('div');
  handle.className = 'resize-handle';
  handle.style.cssText = `
    position:absolute;bottom:0;right:0;width:14px;height:14px;cursor:se-resize;
    background:linear-gradient(135deg, transparent 40%, rgba(255,255,255,.5) 40%, rgba(255,255,255,.5) 60%, transparent 60%),
               linear-gradient(135deg, transparent 60%, rgba(255,255,255,.5) 60%);
    border-radius:0 0 2px 0;
    opacity:0;transition:opacity .15s;
    z-index:10;
  `;
  el.appendChild(handle);
  el.addEventListener('mouseenter', () => handle.style.opacity = '1');
  el.addEventListener('mouseleave', () => handle.style.opacity = '0');

  handle.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = m.w, startD = m.d;

    const onMove = ev => {
      const dw = Math.round((ev.clientX - startX) / S);
      const dd = Math.round((ev.clientY - startY) / S);
      m.w = Math.max(6, Math.min(VL - m.x, startW + dw));
      m.d = Math.max(6, Math.min(VW - m.y, startD + dd));
      el.style.width  = px(m.w) + 'px';
      el.style.height = px(m.d) + 'px';
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      pushUndo(); runConstraints(); recalc(); scheduleAutoSave();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Violation Engine ──────────────────────────────────────────────────────────

function runConstraints() {
  const refs = getTransitRefs();
  const VW = refs.vw, VL = refs.vl;
  const bpillar = refs.bpillar || 42;
  violationMap = {};

  modules.forEach(m => {
    const errs = [];

    // Out of bounds
    if (m.x < 0 || m.y < 0)             errs.push('Module out of bounds (front/driver edge)');
    if (m.x + m.w > VL)                  errs.push('Module extends past rear wall');
    if (m.y + m.d > VW)                  errs.push('Module extends past passenger wall');

    // Slide door clearance: modules on pass side (y > VW/2) near B-pillar
    if (m.y > VW / 2 && m.cat !== 'frame') {
      const overlapFront = m.x;
      const overlapRear  = m.x + m.w;
      const clearStart   = bpillar;
      const clearEnd     = bpillar + 24;
      if (overlapFront < clearEnd && overlapRear > clearStart) {
        errs.push(`Blocks 24" slide door clearance (B-pillar at ${bpillar}")`);
      }
    }

    if (m.cat === 'galley' && m.w < 18) errs.push('Galley too narrow (min 18")');
    if (m.cat === 'bed' && m.w < 24)    errs.push('Bed too narrow (min 24")');

    if (errs.length) violationMap[m.id] = errs;
  });

  applyViolationStyles();
  renderModList();
  recalc();
}

function applyViolationStyles() {
  modules.forEach(m => {
    const el = document.getElementById('pm-' + m.id);
    if (!el) return;
    const hasV = (violationMap[m.id] || []).length > 0;
    el.classList.toggle('violation', hasV);

    let badge = el.querySelector('.mod-violation-badge');
    if (hasV && !badge) {
      badge = document.createElement('div');
      badge.className = 'mod-violation-badge';
      badge.textContent = '!';
      el.appendChild(badge);
    } else if (!hasV && badge) {
      badge.remove();
    }
    if (badge) badge.title = (violationMap[m.id] || []).join('\n');
  });
}

// ── Module Selection ──────────────────────────────────────────────────────────

function selMod(id) {
  selId = id;
  document.querySelectorAll('.mod').forEach(e => e.classList.remove('selected'));
  const el = document.getElementById('pm-' + id);
  if (el) el.classList.add('selected');

  const m = modules.find(x => x.id === id);
  if (m) {
    highlightModCard(id);
  }
}

function desel() {
  selId = null;
  document.querySelectorAll('.mod').forEach(e => e.classList.remove('selected'));
  hideAnchorHud();
}

function highlightModCard(id) {
  document.querySelectorAll('.mcard').forEach(c => c.classList.remove('active'));
  const card = document.querySelector(`.mcard[data-mid="${id}"]`);
  if (card) {
    card.classList.add('active');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function jumpToViolation(modId) {
  selMod(modId);
  lTab('mods');
  const card = document.querySelector(`.mcard[data-mid="${modId}"]`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Module CRUD ───────────────────────────────────────────────────────────────

// Roof rack quick-add preset — auto-centered on van roof
function addRoofRack() {
  const refs = getTransitRefs();
  const VL = refs.vl, VW = refs.vw;
  // Typical roof rack: 60" long × 50" wide (spans roof gutters to gutters)
  const rw = Math.min(54, VW - 4);   // width = van interior width minus gutter margin
  const rd = Math.min(80, VL - 10);  // depth (fore-aft) = most of the roof
  const rx = Math.round((VW - rw) / 2); // centered on van width
  const ry = Math.round((VL - rd) / 2); // centered fore-aft
  const mod = {
    id: 'mod_' + Date.now(),
    name: 'Roof Rack',
    cat: 'frame',
    layer: 'roof',
    w: rw,
    d: rd,
    h: 4,
    x: rx,
    y: ry,
    cost: 600,
    notes: 'Roof rack — centered on van roof',
    anchor: { enabled: false, points: [] }
  };
  pushUndo();
  modules.push(mod);
  selId = mod.id;
  runConstraints();
  setView('roof');
  renderCurrentView();
  renderModList();
  showToast('✅ Roof Rack added — centered on roof');
  scheduleAutoSave();
}

function openAdd() {
  selId = null;
  resetEditForm();
  document.getElementById('moverlay').classList.add('open');
  document.getElementById('modal-title').textContent = '+ Add Module';
  document.getElementById('modal-del-btn').style.display = 'none';
  document.getElementById('modal-dup-btn').style.display = 'none';
}

function openEdit() {
  const m = modules.find(x => x.id === selId);
  if (!m) return;
  populateEditForm(m);
  document.getElementById('moverlay').classList.add('open');
  document.getElementById('modal-title').textContent = 'Edit: ' + m.name;
  document.getElementById('modal-del-btn').style.display = 'inline-block';
  document.getElementById('modal-dup-btn').style.display = 'inline-block';
  toggleAnchorFields();
}

function closeEdit() {
  document.getElementById('moverlay').classList.remove('open');
}

function closeModalOut(e) {
  if (e.target === document.getElementById('moverlay')) closeEdit();
}

function resetEditForm() {
  ['mod-name','mod-cat','mod-w','mod-d','mod-h','mod-x','mod-y','mod-layer','mod-cost','mod-notes']
    .forEach(id => { const e = document.getElementById(id); if (e) e.value = e.tagName === 'SELECT' ? e.options[0]?.value : ''; });
  document.getElementById('anchor-enabled')?.checked === false;
  editAnchorPoints.clear();
  renderAnchorPointBtns();
}

function populateEditForm(m) {
  const f = id => document.getElementById(id);
  if (f('mod-name'))  f('mod-name').value  = m.name || '';
  if (f('mod-cat'))   f('mod-cat').value   = m.cat  || 'storage';
  if (f('mod-w'))     f('mod-w').value     = m.w    || 24;
  if (f('mod-d'))     f('mod-d').value     = m.d    || 24;
  if (f('mod-h'))     f('mod-h').value     = m.h    || 0;
  if (f('mod-x'))     f('mod-x').value     = m.x    || 0;
  if (f('mod-y'))     f('mod-y').value     = m.y    || 0;
  if (f('mod-layer')) f('mod-layer').value = m.layer|| 'floor';
  if (f('mod-cost'))  f('mod-cost').value  = m.cost || 0;
  if (f('mod-notes')) f('mod-notes').value = m.notes|| '';

  // Anchor
  const anchorEnabled = m.anchor?.enabled || false;
  if (f('anchor-enabled')) f('anchor-enabled').checked = anchorEnabled;
  editAnchorPoints = new Set(m.anchor?.points || []);
  renderAnchorPointBtns();
  toggleAnchorFields();
}

function saveMod() {
  const f = id => document.getElementById(id);
  const anchorEnabled = f('anchor-enabled')?.checked || false;

  const data = {
    name:  f('mod-name')?.value.trim() || 'Module',
    cat:   f('mod-cat')?.value  || 'storage',
    w:     parseFloat(f('mod-w')?.value)  || 24,
    d:     parseFloat(f('mod-d')?.value)  || 24,
    h:     parseFloat(f('mod-h')?.value)  || 0,
    x:     parseFloat(f('mod-x')?.value)  || 0,
    y:     parseFloat(f('mod-y')?.value)  || 0,
    layer: f('mod-layer')?.value || 'floor',
    cost:  parseFloat(f('mod-cost')?.value) || 0,
    notes: f('mod-notes')?.value.trim() || '',
    anchor: {
      enabled: anchorEnabled,
      points: [...editAnchorPoints],
      x: parseFloat(f('anchor-x')?.value) || 0,
      y: parseFloat(f('anchor-y')?.value) || 0,
    }
  };

  if (selId) {
    const idx = modules.findIndex(m => m.id === selId);
    if (idx >= 0) modules[idx] = { ...modules[idx], ...data };
  } else {
    data.id = 'mod_' + Date.now();
    modules.push(data);
    selId = data.id;
  }

  pushUndo();
  runConstraints();
  renderCurrentView();
  renderModList();
  closeEdit();
  scheduleAutoSave();
}

function delMod() {
  if (!selId) return;
  if (!confirm('Delete this module?')) return;
  modules = modules.filter(m => m.id !== selId);
  selId = null;
  hideAnchorHud();
  pushUndo();
  runConstraints();
  renderCurrentView();
  renderModList();
  scheduleAutoSave();
}

function dupMod() {
  if (!selId) return;
  const orig = modules.find(m => m.id === selId);
  if (!orig) return;
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = 'mod_' + Date.now();
  copy.x  = Math.min(orig.x + 6, getTransitRefs().vl - orig.w);
  copy.y  = Math.min(orig.y + 6, getTransitRefs().vw - orig.d);
  copy.name = orig.name + ' (copy)';
  modules.push(copy);
  selId = copy.id;
  pushUndo();
  runConstraints();
  renderCurrentView();
  renderModList();
  scheduleAutoSave();
}

// ── Module List (Sidebar) ─────────────────────────────────────────────────────

function renderModList() {
  const list = document.getElementById('mod-list');
  if (!list) return;

  if (!modules.length) {
    list.innerHTML = '<div style="color:rgba(255,255,255,.25);font-size:.72rem;text-align:center;padding:20px">No modules yet.<br>Click + Add Module</div>';
    return;
  }

  list.innerHTML = modules.map(m => {
    const c = CAT[m.cat] || CAT.frame;
    const errs = violationMap[m.id] || [];
    const errHTML = errs.length
      ? `<div class="mc-err-list">${errs.map(e =>
          `<div class="mc-err-item" onclick="jumpToViolation('${m.id}')">⚠ ${e}</div>`
        ).join('')}</div>`
      : '';
    return `
      <div class="mcard ${errs.length ? 'has-error' : ''} ${m.id === selId ? 'active' : ''}" data-mid="${m.id}"
           onclick="selMod('${m.id}')" ondblclick="selMod('${m.id}');openEdit()">
        <div class="mc-swatch" style="background:${c.border}"></div>
        <div class="mc-body">
          <div class="mc-name">${m.name}</div>
          <div class="mc-meta">${c.label} · ${m.w}"×${m.d}" · $${(m.cost||0).toLocaleString()}</div>
          ${errHTML}
        </div>
        <div class="mc-actions">
          <button onclick="event.stopPropagation();selMod('${m.id}');openEdit()" title="Edit">✏</button>
          <button onclick="event.stopPropagation();selMod('${m.id}');dupMod()" title="Duplicate">⧉</button>
          <button onclick="event.stopPropagation();selMod('${m.id}');delMod()" title="Delete" style="color:var(--error)">✕</button>
        </div>
      </div>`;
  }).join('');
}

// ── Anchor HUD ────────────────────────────────────────────────────────────────

function showAnchorHud(m) {
  const hud = document.getElementById('anchor-hud');
  if (!hud) return;

  const anchor = m.anchor || { enabled: false, points: [] };
  const pts = new Set(anchor.points || []);

  hud.style.display = 'block';
  hud.innerHTML = `
    <div class="anchor-hud-header" onmousedown="startHudDrag(event)">
      ⚓ Anchor — <span style="color:rgba(255,255,255,.5);font-size:.65rem">${m.name}</span>
    </div>
    <div class="anchor-hud-body">
      <div class="anchor-hud-row">
        <span>Anchor</span>
        <label class="anchor-toggle">
          <input type="checkbox" id="hud-anchor-on" ${anchor.enabled?'checked':''} onchange="hudToggleAnchor('${m.id}',this.checked)"/>
          <span></span>
        </label>
      </div>
      <div class="anchor-hud-grid" id="hud-pt-grid">
        ${['front','rear','driver','pass','center-x','center-y'].map(pt => `
          <button class="anchor-pt-btn ${pts.has(pt)?'locked':''}" onclick="hudTogglePt('${m.id}','${pt}',this)"
                  title="${pt}">${pts.has(pt)?'🔒':'🔓'} ${pt}</button>
        `).join('')}
      </div>
      <div class="anchor-hud-pos">
        <span>x: ${Math.round(m.x)}"</span>
        <span>y: ${Math.round(m.y)}"</span>
        <span style="color:rgba(74,176,224,.8)">CL±${Math.round(m.y + m.d/2 - getTransitRefs().vw/2)}"</span>
      </div>
    </div>
  `;

  let hudX = parseInt(hud.style.left) || 10;
  let hudY = parseInt(hud.style.top)  || 200;
  hud.style.left = hudX + 'px';
  hud.style.top  = hudY + 'px';
}

function hideAnchorHud() {
  const hud = document.getElementById('anchor-hud');
  if (hud) hud.style.display = 'none';
}

function startHudDrag(e) {
  e.preventDefault();
  const hud = document.getElementById('anchor-hud');
  const startX = e.clientX - parseInt(hud.style.left || 10);
  const startY = e.clientY - parseInt(hud.style.top  || 200);

  const move = ev => {
    hud.style.left = (ev.clientX - startX) + 'px';
    hud.style.top  = (ev.clientY - startY) + 'px';
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

function hudToggleAnchor(modId, enabled) {
  const m = modules.find(x => x.id === modId);
  if (!m) return;
  if (!m.anchor) m.anchor = { points: [] };
  m.anchor.enabled = enabled;
  const el = document.getElementById('pm-' + modId);
  if (el) el.classList.toggle('anchored', enabled);
}

function hudTogglePt(modId, pt, btn) {
  const m = modules.find(x => x.id === modId);
  if (!m) return;
  if (!m.anchor) m.anchor = { enabled: true, points: [] };
  if (!Array.isArray(m.anchor.points)) m.anchor.points = [...(m.anchor.points || new Set())];

  const idx = m.anchor.points.indexOf(pt);
  if (idx >= 0) {
    m.anchor.points.splice(idx, 1);
    btn.classList.remove('locked');
    btn.textContent = `🔓 ${pt}`;
  } else {
    m.anchor.points.push(pt);
    btn.classList.add('locked');
    btn.textContent = `🔒 ${pt}`;
  }
}

function updateAnchorHud(m) {
  const posEl = document.querySelector('.anchor-hud-pos');
  if (!posEl) return;
  posEl.innerHTML = `
    <span>x: ${Math.round(m.x)}"</span>
    <span>y: ${Math.round(m.y)}"</span>
    <span style="color:rgba(74,176,224,.8)">CL±${Math.round(m.y + m.d/2 - getTransitRefs().vw/2)}"</span>
  `;
}

// ── Anchor Modal (inside Edit) ────────────────────────────────────────────────

function toggleAnchorFields() {
  const enabled = document.getElementById('anchor-enabled')?.checked;
  const section = document.getElementById('anchor-section');
  if (section) section.style.display = enabled ? 'block' : 'none';
}

function renderAnchorPointBtns() {
  const grid = document.getElementById('anchor-pts-grid');
  if (!grid) return;
  const pts = ['front','rear','driver','pass','center-x','center-y'];
  grid.innerHTML = pts.map(pt => `
    <button class="anchor-pt-btn ${editAnchorPoints.has(pt)?'locked':''}"
            onclick="toggleAnchorPt('${pt}',this)">
      ${editAnchorPoints.has(pt)?'🔒':'🔓'} ${pt}
    </button>
  `).join('');
}

function toggleAnchorPt(pt, btn) {
  if (editAnchorPoints.has(pt)) {
    editAnchorPoints.delete(pt);
    btn.classList.remove('locked');
    btn.textContent = `🔓 ${pt}`;
  } else {
    editAnchorPoints.add(pt);
    btn.classList.add('locked');
    btn.textContent = `🔒 ${pt}`;
  }
}

// ── Elevation / Cross / Roof / Systems Views ──────────────────────────────────

function renderElev(side = 'driver') {
  const refs = getTransitRefs();
  const VL = refs.vl, VH = refs.vh, VW = refs.vw;
  const W = px(VL) + PAD + 20;
  const H = px(VH) + OY + 30;
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.minWidth = W + 'px'; wrap.style.minHeight = H + 'px';

  const cvs = makeCanvas(W, H);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#12121a'; ctx.fillRect(0,0,W,H);

  const ox = PAD, oy = OY;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= VL; x += 12) { ctx.beginPath(); ctx.moveTo(ox+px(x),oy); ctx.lineTo(ox+px(x),oy+px(VH)); ctx.stroke(); }
  for (let y = 0; y <= VH; y += 12) { ctx.beginPath(); ctx.moveTo(ox,oy+px(y)); ctx.lineTo(ox+px(VL),oy+px(y)); ctx.stroke(); }

  // Van shell outline
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(ox, oy, px(VL), px(VH));

  // Floor line
  ctx.strokeStyle = 'rgba(232,160,32,.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ox, oy + px(VH)); ctx.lineTo(ox + px(VL), oy + px(VH)); ctx.stroke();

  // Side label
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.font = '500 ' + Math.max(9, S*1.8) + 'px Barlow Condensed, sans-serif';
  ctx.fillText(side === 'driver' ? '◀ DRIVER SIDE (looking inward →)' : '◀ PASSENGER SIDE (looking inward →)', ox + 6, oy - 6);

  // Draw ruler marks
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  ctx.font = (Math.max(7, S*1.2)) + 'px Space Mono, monospace';
  for (let x = 0; x <= VL; x += 24) {
    ctx.fillText(x + '"', ox + px(x) + 2, oy - 4);
  }

  const svg = makeSVG(W, H);

  // Filter modules for this side:
  // driver side: show modules with side='driver' or side='both'
  // pass side: show modules with side='pass' or side='both'
  // Also show floor-layer modules
  const visibleMods = modules.filter(m => {
    if (!m.h) return false;
    if (side === 'driver') return m.side === 'driver' || m.side === 'both' || !m.side;
    if (side === 'pass')   return m.side === 'pass'   || m.side === 'both' || !m.side;
    return true;
  });

  visibleMods.forEach(m => {
    const mh = m.h || 24;
    const mz = m.z || 0;
    // x position = front-to-back position (m.x = distance from front)
    const rx = ox + px(m.x);
    // y position = from floor up, z is floor offset
    const ry = oy + px(VH) - px(mh + mz);
    const rw = Math.max(4, px(m.w));
    const rh = Math.max(4, px(mh));

    const r = svgEl('rect', {
      x: rx, y: ry, width: rw, height: rh,
      fill: (CAT[m.cat]||CAT.frame).bg,
      stroke: (CAT[m.cat]||CAT.frame).border,
      'stroke-width': 1.5, rx: 2
    });
    svg.appendChild(r);

    if (rw > 20 && rh > 12) {
      const t = svgText(rx + rw/2, ry + rh/2 + 4, m.name, (CAT[m.cat]||CAT.frame).text, Math.max(7, S*1.4));
      svg.appendChild(t);
    }
  });

  cvs.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(cvs);
  svg.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(svg);
}

function renderCross() {
  const refs = getTransitRefs();
  const VW = refs.vw, VH = refs.vh;
  const W = px(VW) + PAD + 20;
  const H = px(VH) + OY + 30;
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.minWidth = W + 'px'; wrap.style.minHeight = H + 'px';

  const cvs = makeCanvas(W, H);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#12121a'; ctx.fillRect(0,0,W,H);

  const ox = PAD, oy = OY;
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(ox, oy, px(VW), px(VH));

  const svg = makeSVG(W, H);
  const slice = modules.filter(m => m.x <= crossY && m.x + m.w >= crossY);
  slice.forEach(m => {
    if (!m.h) return;
    const r = svgEl('rect', {
      x: ox + px(m.y), y: oy + px(VH - m.h),
      width: px(m.d), height: px(m.h),
      fill: (CAT[m.cat]||CAT.frame).bg,
      stroke: (CAT[m.cat]||CAT.frame).border,
      'stroke-width': 1.5, rx: 2
    });
    svg.appendChild(r);
  });

  svg.appendChild(svgLine(ox + px(VW/2), oy, ox + px(VW/2), oy + px(VH), 'rgba(74,176,224,.4)', 1));

  cvs.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(cvs);
  svg.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(svg);

  const lbl = document.createElement('div');
  lbl.style.cssText = 'position:absolute;top:6px;left:' + (ox+px(VW/2)-20) + 'px;color:rgba(74,176,224,.7);font-size:.65rem;font-family:monospace';
  lbl.textContent = `@ ${crossY}"`;
  wrap.appendChild(lbl);
}

function renderRoof() {
  const refs = getTransitRefs();
  const VL = refs.vl, VW = refs.vw;
  const GUTTER = 28; // extra canvas space around van for labels/overhangs
  const W = px(VL) + PAD + GUTTER + 20;
  const H = px(VW) + OY + GUTTER + 30;
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.position = 'relative';
  wrap.style.minWidth = W + 'px'; wrap.style.minHeight = H + 'px';

  const cvs = makeCanvas(W, H);
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#0b0b18'; ctx.fillRect(0,0,W,H);

  const ox = PAD, oy = OY;
  const vw_px = px(VW), vl_px = px(VL);
  const r = Math.min(px(4), 10); // corner radius

  // ── Grid ──
  ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= VL; x += 12) {
    ctx.beginPath(); ctx.moveTo(ox+px(x), oy-4); ctx.lineTo(ox+px(x), oy+vw_px+4); ctx.stroke();
  }
  for (let y = 0; y <= VW; y += 12) {
    ctx.beginPath(); ctx.moveTo(ox-4, oy+px(y)); ctx.lineTo(ox+vl_px+4, oy+px(y)); ctx.stroke();
  }

  // ── Roof panel fill (the actual roof skin) ──
  ctx.fillStyle = 'rgba(40,44,68,.6)';
  ctx.beginPath();
  ctx.moveTo(ox + r, oy);
  ctx.lineTo(ox + vl_px - r, oy);
  ctx.quadraticCurveTo(ox + vl_px, oy, ox + vl_px, oy + r);
  ctx.lineTo(ox + vl_px, oy + vw_px - r);
  ctx.quadraticCurveTo(ox + vl_px, oy + vw_px, ox + vl_px - r, oy + vw_px);
  ctx.lineTo(ox + r, oy + vw_px);
  ctx.quadraticCurveTo(ox, oy + vw_px, ox, oy + vw_px - r);
  ctx.lineTo(ox, oy + r);
  ctx.quadraticCurveTo(ox, oy, ox + r, oy);
  ctx.closePath();
  ctx.fill();

  // ── Rain channel gutters (sides of roof) ──
  const gutterW = px(2.5);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  ctx.fillRect(ox, oy, vl_px, gutterW);               // driver side gutter
  ctx.fillRect(ox, oy + vw_px - gutterW, vl_px, gutterW); // pass side gutter
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
  ctx.strokeRect(ox, oy, vl_px, gutterW);
  ctx.strokeRect(ox, oy + vw_px - gutterW, vl_px, gutterW);

  // ── Roof ribs (structural cross-members, approx every 16") ──
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1.5;
  [16,32,48,64,80,96,112,128].forEach(r_pos => {
    if (r_pos >= VL) return;
    const rx = ox + px(r_pos);
    ctx.beginPath(); ctx.moveTo(rx, oy + gutterW); ctx.lineTo(rx, oy + vw_px - gutterW); ctx.stroke();
  });

  // ── Cab/bulkhead notch on front (right side) — shows cab cutoff ──
  const cabDepth = px(6), cabInset = vw_px * 0.28;
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  // Driver-side cab notch
  ctx.fillRect(ox + vl_px - cabDepth, oy, cabDepth, cabInset);
  // Pass-side cab notch
  ctx.fillRect(ox + vl_px - cabDepth, oy + vw_px - cabInset, cabDepth, cabInset);
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(ox + vl_px - cabDepth, oy, cabDepth, cabInset);
  ctx.strokeRect(ox + vl_px - cabDepth, oy + vw_px - cabInset, cabDepth, cabInset);

  // ── Windshield line ──
  ctx.strokeStyle = 'rgba(74,176,224,.3)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath();
  ctx.moveTo(ox + vl_px - cabDepth, oy + cabInset);
  ctx.lineTo(ox + vl_px - cabDepth, oy + vw_px - cabInset);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Pillar lines on roof ──
  const bpillar = refs.bpillar || 42;
  const pillars = [
    { pos: bpillar, label: 'B', color: 'rgba(74,176,224,.45)' },
    ...(refs.cPillar ? [{ pos: refs.cPillar, label: 'C', color: 'rgba(74,176,224,.3)' }] : []),
    ...(refs.dPillar ? [{ pos: refs.dPillar, label: 'D', color: 'rgba(74,176,224,.25)' }] : []),
  ];
  pillars.forEach(p => {
    const px_ = ox + px(p.pos);
    ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(px_, oy); ctx.lineTo(px_, oy + vw_px); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = p.color;
    ctx.font = 'bold ' + Math.max(7, S*1.2) + "px 'Space Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(p.label, px_, oy - 5);
  });

  // ── Centerline ──
  ctx.strokeStyle = 'rgba(74,176,224,.35)'; ctx.lineWidth = 1;
  ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(ox, oy + px(VW/2)); ctx.lineTo(ox + vl_px, oy + px(VW/2)); ctx.stroke();
  ctx.setLineDash([]);
  // CL label
  ctx.fillStyle = 'rgba(74,176,224,.5)';
  ctx.font = Math.max(6, S*1.1) + "px 'Space Mono', monospace";
  ctx.textAlign = 'left';
  ctx.fillText('CL', ox + vl_px + 4, oy + px(VW/2) + 3);

  // ── Van shell outline — thick border ──
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(ox + r, oy);
  ctx.lineTo(ox + vl_px - r, oy);
  ctx.quadraticCurveTo(ox + vl_px, oy, ox + vl_px, oy + r);
  ctx.lineTo(ox + vl_px, oy + vw_px - r);
  ctx.quadraticCurveTo(ox + vl_px, oy + vw_px, ox + vl_px - r, oy + vw_px);
  ctx.lineTo(ox + r, oy + vw_px);
  ctx.quadraticCurveTo(ox, oy + vw_px, ox, oy + vw_px - r);
  ctx.lineTo(ox, oy + r);
  ctx.quadraticCurveTo(ox, oy, ox + r, oy);
  ctx.closePath();
  ctx.stroke();

  // ── Rear door line ──
  ctx.strokeStyle = 'rgba(232,160,32,.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ox, oy + r); ctx.lineTo(ox, oy + vw_px - r); ctx.stroke();
  ctx.fillStyle = 'rgba(232,160,32,.5)';
  ctx.font = 'bold ' + Math.max(5, S*0.9) + "px 'Space Mono', monospace";
  ctx.textAlign = 'center';
  ctx.save(); ctx.translate(ox - 14, oy + vw_px/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('REAR', 0, 0); ctx.restore();

  // ── Bulkhead label ──
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.font = 'bold ' + Math.max(5, S*0.9) + "px 'Space Mono', monospace";
  ctx.textAlign = 'center';
  ctx.save(); ctx.translate(ox + vl_px + 14, oy + vw_px/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('BULKHEAD', 0, 0); ctx.restore();

  // ── DRIVER / PASS labels on sides ──
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.font = Math.max(6, S*1.1) + "px 'Space Mono', monospace";
  ctx.textAlign = 'center';
  ctx.save(); ctx.translate(ox + vl_px/2, oy - 16); ctx.fillText('← REAR   FRONT →', 0, 0); ctx.restore();
  ctx.save(); ctx.translate(ox - 36, oy + vw_px/2); ctx.rotate(-Math.PI/2);
  ctx.fillText('DRIVER', 0, 0); ctx.restore();
  ctx.save(); ctx.translate(ox + vl_px + 36, oy + vw_px/2); ctx.rotate(Math.PI/2);
  ctx.fillText('PASS', 0, 0); ctx.restore();

  // ── Top ruler ──
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.font = Math.max(7, S*1.2) + "px 'Space Mono', monospace";
  for (let x = 0; x <= VL; x += (S < 2 ? 48 : S < 3 ? 24 : 12)) {
    const xp = ox + px(x);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(xp, oy - 8, 1, 8);
    if (x % 24 === 0) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillText(x + '"', xp, oy - 11); }
  }

  // ── Side ruler ──
  ctx.textAlign = 'right';
  for (let y = 0; y <= VW; y += (S < 3 ? 12 : 6)) {
    const yp = oy + px(y);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(ox - 8, yp, 8, 1);
    if (y % 12 === 0) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillText(y + '"', ox - 10, yp + 3); }
  }

  // ── View label ──
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.font = '600 ' + Math.max(9, S*2) + "px 'Barlow Condensed', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText('ROOF PLAN  (top-down view)', ox + 4, oy + vw_px + 18);

  cvs.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(cvs);

  // ── SVG overlay for modules ──
  const svg = makeSVG(W, H);

  const roofMods = modules.filter(m => m.layer === 'roof');
  roofMods.forEach(m => {
    const rw = Math.max(4, px(m.w));
    const rd = Math.max(4, px(m.d || m.w));
    const rx = ox + px(m.x);
    const ry = oy + px(m.y);
    const c  = CAT[m.cat] || CAT.frame;
    const rect = svgEl('rect', { x:rx, y:ry, width:rw, height:rd,
      fill:c.bg, stroke:c.border, 'stroke-width':1.5, rx:3 });
    svg.appendChild(rect);
    if (rw > 24) {
      svg.appendChild(svgText(rx+rw/2, ry+rd/2+4, m.name, c.text, Math.max(7, S*1.4)));
      if (rd > 20) {
        svg.appendChild(svgText(rx+rw/2, ry+rd/2+4+Math.max(8,S*1.5),
          m.w+'×'+(m.d||m.w)+'"', 'rgba(255,255,255,.35)', Math.max(6,S*1.1)));
      }
    }
  });

  if (roofMods.length === 0) {
    const t = svgEl('text', { x: ox+vl_px/2, y: oy+vw_px/2+4,
      fill:'rgba(255,255,255,.18)', 'text-anchor':'middle',
      'font-size': Math.max(9,S*1.6), 'font-family':"'Space Mono', monospace" });
    t.textContent = 'No roof modules — add a module and set Layer = Roof';
    svg.appendChild(t);
  }

  svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
  wrap.appendChild(svg);
}

function renderSystems() {
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
    <div style="padding:20px;font-family:'Space Mono',monospace;font-size:.75rem;color:rgba(255,255,255,.6)">
      <div style="color:#fff;font-weight:700;margin-bottom:12px">Systems Overview</div>
      ${modules.filter(m => m.cat === 'power' || m.cat === 'bath').map(m =>
        `<div style="margin-bottom:8px;padding:8px;background:rgba(255,255,255,.04);border-radius:4px">
          <div style="color:${(CAT[m.cat]||CAT.frame).text};font-weight:600">${m.name}</div>
          <div style="font-size:.65rem;opacity:.6">${m.notes || 'No notes'}</div>
        </div>`
      ).join('') || '<div style="opacity:.4">No power/bath modules added yet.</div>'}
    </div>
  `;
}

function renderCurrentView() {
  if      (VIEW === 'plan')                      renderPlan();
  else if (VIEW === 'driver' || VIEW === 'elev') renderElev('driver');
  else if (VIEW === 'pass')                      renderElev('pass');
  else if (VIEW === 'cross')                     renderCross();
  else if (VIEW === 'roof')                      renderRoof();
  else if (VIEW === 'systems')                   renderSystems();
}

// ── Sidebar Tabs ──────────────────────────────────────────────────────────────

function lTab(tab) {
  document.querySelectorAll('.lptab').forEach(t => {
    t.classList.toggle('active', t.id === 'lptab-' + tab);
  });
  document.querySelectorAll('.lp-panel').forEach(p => {
    const pid = p.id?.replace('lp-', '');
    p.classList.toggle('active', pid === tab);
    p.style.display = pid === tab ? 'flex' : 'none';
  });
}

// ── Share ─────────────────────────────────────────────────────────────────────

async function shareLayout() {
  if (!canShare()) { showUpgradeModal('share'); return; }
  if (!currentDbProjectId) {
    await saveLayout();
  }
  if (currentDbProjectId) {
    const url = `${window.location.origin}?share=${currentDbProjectId}`;
    navigator.clipboard?.writeText(url);
    showToast('🔗 Share link copied!', 'success');
  }
}

// ── Export / Import Build ─────────────────────────────────────────────────────

function exportBuild() {
  const proj = projects[currentProjectIdx] || {};
  const payload = {
    vaniq_version: '2.0',
    exported_at: new Date().toISOString(),
    project: {
      name: proj.name || 'My Van Build',
      vanModel: proj.vanModel || 'Transit 148 HR',
    },
    modules: modules,
    inventory: inventory || [],
    settings: {
      scale: S,
      crossY: crossY,
      view: VIEW
    }
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const name = (proj.name || 'vaniq-build').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  a.href     = url;
  a.download = `${name}-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('⬇ Build exported as JSON', 'success');
}

function importBuild() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';

  input.onchange = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);

        if (!data.modules || !Array.isArray(data.modules)) {
          showToast('⚠ Invalid file — no modules found', 'error');
          return;
        }

        const modCount = data.modules.length;
        const projName = data.project?.name || 'Imported Build';
        if (!confirm(`Import "${projName}" with ${modCount} module(s)?\n\nThis will replace your current layout.`)) return;

        modules = data.modules;

        if (data.project?.vanModel && projects[currentProjectIdx]) {
          projects[currentProjectIdx].vanModel = data.project.vanModel;
          projects[currentProjectIdx].name     = data.project.name || projects[currentProjectIdx].name;
        }

        if (data.settings) {
          if (data.settings.scale)  S      = data.settings.scale;
          if (data.settings.crossY) crossY = data.settings.crossY;
          if (data.settings.view)   VIEW   = data.settings.view;
        }

        if (data.inventory && Array.isArray(data.inventory)) {
          inventory = data.inventory;
          renderInvList?.();
        }

        pushUndo();
        runConstraints();
        renderCurrentView();
        renderModList();
        renderProjectSelect();
        showToast(`✅ Imported "${projName}" — ${modCount} modules loaded`, 'success');

      } catch (err) {
        console.error('Import error:', err);
        showToast('⚠ Failed to parse JSON file: ' + err.message, 'error');
      }
    };

    reader.onerror = () => {
      showToast('⚠ Could not read file', 'error');
    };

    reader.readAsText(file);
  };

  input.style.display = 'none';
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// ── CSV Asset Import ──────────────────────────────────────────────────────────
// importCSV()          — open file picker, parse CSV, add items to canvas
// downloadCSVTemplate() — download blank template for users
//
// Accepted schemas:
//   A) VanIQ standard:  name*, category*, width*, depth*, height, cost, notes, status, url
//   B) Build-list:      Item*, Phase*, Cost, Notes, Status, Brand/Link, URL
//   (* = required)
//
// category values: bed, galley, bath, power, frame, garage, seating, work, storage
// ─────────────────────────────────────────────────────────────────────────────

function importCSV() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.csv,text/csv,application/csv';
  input.style.display = 'none';

  input.onchange = function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const raw   = evt.target.result.replace(/^\uFEFF/, ''); // strip BOM
        const rows  = _parseCSVtoRows(raw);
        if (rows.length < 2) { showToast('CSV appears empty', 'error'); return; }

        const headers = rows[0].map(function(h) { return h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); });

        const isStandard  = headers.includes('name') &&
          (headers.includes('category') || headers.includes('cat')) &&
          (headers.includes('width') || headers.includes('w'));
        const isBuildList = headers.includes('item') && headers.includes('phase');

        if (!isStandard && !isBuildList) {
          showToast('CSV needs: name/item, category/phase, width, depth — or download the template', 'error');
          return;
        }

        function colIdx() {
          var aliases = Array.prototype.slice.call(arguments);
          for (var a = 0; a < aliases.length; a++) {
            var i = headers.findIndex(function(h) { return h === aliases[a] || h.startsWith(aliases[a]); });
            if (i >= 0) return i;
          }
          return -1;
        }
        function str(row) {
          var aliases = Array.prototype.slice.call(arguments, 1);
          var i = colIdx.apply(null, aliases);
          return i >= 0 ? (row[i] || '').trim() : '';
        }
        function num(row, def) {
          var aliases = Array.prototype.slice.call(arguments, 2);
          return parseFloat(str.apply(null, [row].concat(aliases))) || def;
        }

        var CAT_MAP = {
          bed:'bed', sleep:'bed',
          galley:'galley', kitchen:'galley', cook:'galley',
          bath:'bath', plumb:'bath', heat:'bath', water:'bath',
          power:'power', elec:'power', solar:'power',
          frame:'frame', wall:'frame', ceil:'frame', insul:'frame', struct:'frame',
          garage:'garage', bike:'garage', gear:'garage',
          seat:'seating', chair:'seating',
          work:'work', office:'work', desk:'work',
          storage:'storage', addon:'storage', roof:'storage', interior:'storage'
        };
        function mapCat(raw) {
          var key = (raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          var match = Object.keys(CAT_MAP).find(function(k) { return key.includes(k); });
          return match ? CAT_MAP[match] : 'storage';
        }

        var imported = [], skipped = 0;
        rows.slice(1).forEach(function(row, idx) {
          var name, cat, w, d, h, cost, notes, status, url;
          if (isStandard) {
            name   = str(row, 'name');
            cat    = mapCat(str(row, 'category', 'cat'));
            w      = num(row, 24, 'width', 'w');
            d      = num(row, 24, 'depth', 'd');
            h      = num(row, 0,  'height', 'h');
            cost   = num(row, 0,  'cost', 'price');
            notes  = str(row, 'notes', 'note');
            status = str(row, 'status');
            url    = str(row, 'url', 'link');
          } else {
            name   = str(row, 'item');
            cat    = mapCat(str(row, 'phase'));
            w = 24; d = 24; h = 0;
            cost   = num(row, 0,  'cost', 'price');
            notes  = str(row, 'notes', 'note');
            status = str(row, 'status');
            url    = str(row, 'url', 'link', 'brand');
            var brand     = str(row, 'brand');
            var powerNote = str(row, 'power');
            if (brand)     notes = [notes, 'Brand: ' + brand].filter(Boolean).join(' | ');
            if (powerNote) notes = [notes, 'Power: ' + powerNote].filter(Boolean).join(' | ');
          }
          if (!name || /^https?:\/\//.test(name)) { skipped++; return; }
          imported.push({
            id:     'csv_' + Date.now() + '_' + idx,
            name: name, cat: cat,
            w: Math.max(6, w), d: Math.max(6, d), h: h,
            cost: cost, notes: notes,
            status: status || 'To Buy',
            url: url,
            x: (idx % 4) * 26,
            y: Math.floor(idx / 4) * 26,
            layer: 'floor',
            anchor: { enabled: false, points: [] }
          });
        });

        if (imported.length === 0) { showToast('No valid items found — check column names', 'error'); return; }

        var totalCost = imported.reduce(function(s, m) { return s + (m.cost || 0); }, 0);
        var msg = 'Import ' + imported.length + ' items from CSV?' +
          (skipped ? '\n(' + skipped + ' blank rows skipped)' : '') +
          (totalCost ? '\nEstimated total: $' + totalCost.toLocaleString() : '');

        if (!confirm(msg)) return;

        modules.push.apply(modules, imported);
        if (typeof pushUndo === 'function') pushUndo();
        if (typeof runConstraints === 'function') runConstraints();
        if (typeof renderCurrentView === 'function') renderCurrentView();
        if (typeof renderModList === 'function') renderModList();
        if (typeof scheduleAutoSave === 'function') scheduleAutoSave();
        showToast('Imported ' + imported.length + ' items · $' + totalCost.toLocaleString() + ' total', 'success');

      } catch(err) {
        console.error('VanIQ CSV import error:', err);
        showToast('CSV parse failed: ' + err.message, 'error');
      }
    };
    reader.onerror = function() { showToast('Could not read file', 'error'); };
    reader.readAsText(file);
  };

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// RFC-4180 CSV parser — handles quoted fields, embedded commas, embedded newlines
function _parseCSVtoRows(text) {
  var rows = [], row = [], field = '', inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { field += '"'; i++; }
      else if (c === '"')         { inQ = false; }
      else                        { field += c; }
    } else {
      if      (c === '"')  { inQ = true; }
      else if (c === ',')  { row.push(field); field = ''; }
      else if (c === '\n') {
        row.push(field); field = '';
        if (row.some(function(f) { return f.trim(); })) rows.push(row);
        row = [];
      } else if (c !== '\r') { field += c; }
    }
  }
  row.push(field);
  if (row.some(function(f) { return f.trim(); })) rows.push(row);
  return rows;
}

function downloadCSVTemplate() {
  var rows = [
    ['name','category','width','depth','height','cost','notes','status','url'],
    ['Queen Bed Platform','bed','60','80','12','400','Storage drawers below','To Buy',''],
    ['Galley Counter','galley','70','28','36','1800','Sink + induction top','To Buy',''],
    ['EcoFlow Power Hub','power','13','16','18','1200','10kWh LiFePO4','To Buy',''],
    ['Garage Zone','garage','70','60','24','0','E-bike + gear storage','To Buy',''],
    ['Water Tank','bath','32','14','16','300','29gal under bed','To Buy',''],
    ['Air Heater','bath','10','10','8','1500','Webasto or Espar','To Buy',''],
    ['Vent Fan','storage','14','14','6','500','MaxxAir or Fan-Tastic','To Buy',''],
    ['Swivel Seats','seating','22','22','4','400','Driver + passenger','To Buy',''],
    ['Work Desk','work','30','20','0','200','Lagun table or fold-out','To Buy','']
  ];
  function esc(f) { return f.includes(',') ? '"' + f + '"' : f; }
  var csv = rows.map(function(r) { return r.map(esc).join(','); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vaniq-build-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  showToast('Template downloaded — open in Excel or Google Sheets', 'success');
}


// ── Project Modal ─────────────────────────────────────────────────────────────

function openProjectModal() {
  document.getElementById('proj-overlay').classList.add('open');
  renderProjList();
}

function closeProjModal() {
  document.getElementById('proj-overlay').classList.remove('open');
}

function closeProjModalOut(e) {
  if (e.target === document.getElementById('proj-overlay')) closeProjModal();
}

async function renderProjList() {
  const list = document.getElementById('proj-list');
  if (!list) return;

  if (!getCurrentUser() || !canSave()) {
    list.innerHTML = `<div style="color:rgba(255,255,255,.4);font-size:.73rem;text-align:center;padding:16px">
      <a style="color:#0a84ff;cursor:pointer" onclick="closeProjModal();showUpgradeModal('save')">Upgrade to save and manage projects →</a>
    </div>`;
    return;
  }

  list.innerHTML = '<div style="color:rgba(255,255,255,.3);font-size:.7rem;padding:8px">Loading…</div>';
  const dbProjects = await dbGetProjects();
  if (!dbProjects.length) {
    list.innerHTML = '<div style="color:rgba(255,255,255,.3);font-size:.7rem;padding:8px">No saved projects yet.</div>';
    return;
  }
  list.innerHTML = dbProjects.map(p => `
    <div class="proj-card" style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:6px;background:rgba(255,255,255,.04);margin-bottom:4px">
      <div>
        <div style="color:#fff;font-size:.78rem;font-weight:600">${p.name}</div>
        <div style="color:rgba(255,255,255,.35);font-size:.65rem">${p.van_model} · ${new Date(p.updated_at).toLocaleDateString()}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="abtn" onclick="loadProjectById('${p.id}');closeProjModal()">Load</button>
        <button class="abtn" style="color:var(--error)" onclick="confirmDeleteProject('${p.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

async function createProject() {
  const name     = document.getElementById('proj-new-name')?.value.trim() || 'My Van Build';
  const vanModel = document.getElementById('proj-new-van')?.value || 'Transit 148 HR';
  modules = [];
  selId = null;
  currentDbProjectId = null;
  projects[currentProjectIdx] = { name, vanModel };
  runConstraints();
  renderCurrentView();
  renderModList();
  renderProjectSelect();
  closeProjModal();
  showToast('New project created');
  if (canSave()) await saveLayout();
}

async function confirmDeleteProject(id) {
  if (!confirm('Delete this project? This cannot be undone.')) return;
  await dbDeleteProject(id);
  if (id === currentDbProjectId) {
    currentDbProjectId = null;
    modules = [];
    renderCurrentView();
    renderModList();
  }
  renderProjList();
  showToast('Project deleted');
}

// ── Library Modal ─────────────────────────────────────────────────────────────

const MODULE_LIBRARY = [
  { name:'Queen Bed Platform', cat:'bed',    w:60, d:80, h:12,  cost:400,  contents:['Mattress','Storage below'] },
  { name:'Full Bed Platform',  cat:'bed',    w:54, d:75, h:12,  cost:350,  contents:['Mattress','Storage below'] },
  { name:'Galley Kitchen',     cat:'galley', w:78, d:28, h:36,  cost:1800, contents:['Sink','2-burner','Fridge','Counter'] },
  { name:'Compact Galley',     cat:'galley', w:48, d:22, h:34,  cost:1200, contents:['Sink','1-burner','Mini fridge'] },
  { name:'Wet Bath',           cat:'bath',   w:30, d:36, h:80,  cost:1500, contents:['Shower','Toilet','Sink'] },
  { name:'Cassette Toilet',    cat:'bath',   w:18, d:20, h:30,  cost:400,  contents:['Toilet'] },
  { name:'Garage Zone',        cat:'garage', w:48, d:36, h:24,  cost:200,  contents:['E-bike','Gear storage'] },
  { name:'E-Bike Slide',       cat:'garage', w:28, d:30, h:14,  cost:600,  contents:['Bike track','Pullout'] },
  { name:'Power Station',      cat:'power',  w:18, d:16, h:18,  cost:1200, contents:['EcoFlow 2000','100Ah'] },
  { name:'Overhead Cabinets',  cat:'storage',w:78, d:12, h:14,  cost:600,  contents:['Cabinets x3'] },
  { name:'Wardrobe',           cat:'storage',w:20, d:20, h:60,  cost:350,  contents:['Hanging','Drawers'] },
  { name:'Dinette',            cat:'seating',w:48, d:36, h:30,  cost:800,  contents:['Table','2 benches'] },
  { name:'Swivel Seat',        cat:'seating',w:22, d:22, h:36,  cost:300,  contents:['Passenger swivel'] },
  { name:'Work Desk',          cat:'work',   w:30, d:20, h:30,  cost:400,  contents:['Desk','Monitor mount'] },
];

function openLibrary() {
  document.getElementById('lib-overlay').classList.add('open');
  renderLibrary();
}

function closeLibrary() {
  document.getElementById('lib-overlay').classList.remove('open');
}

function renderLibrary() {
  const list = document.getElementById('lib-list');
  if (!list) return;
  list.innerHTML = MODULE_LIBRARY.map((m, i) => {
    const c = CAT[m.cat] || CAT.frame;
    return `
      <div class="lib-item" onclick="addFromLibrary(${i})" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;cursor:pointer;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);margin-bottom:3px;transition:.1s">
        <div style="width:8px;height:8px;border-radius:50%;background:${c.border};flex-shrink:0"></div>
        <div style="flex:1">
          <div style="color:#fff;font-size:.78rem;font-weight:600">${m.name}</div>
          <div style="color:rgba(255,255,255,.35);font-size:.65rem">${c.label} · ${m.w}"×${m.d}" · $${m.cost.toLocaleString()}</div>
        </div>
        <div style="color:rgba(255,255,255,.3);font-size:.7rem">＋</div>
      </div>`;
  }).join('');
}

function addFromLibrary(idx) {
  const template = MODULE_LIBRARY[idx];
  const m = {
    ...template,
    id: 'mod_' + Date.now(),
    x: 6, y: 6,
    layer: 'floor',
    notes: '',
    anchor: { enabled: false, points: [] }
  };
  modules.push(m);
  selId = m.id;
  pushUndo();
  runConstraints();
  renderCurrentView();
  renderModList();
  closeLibrary();
  scheduleAutoSave();
}

// ── Resources ─────────────────────────────────────────────────────────────────

function toggleResMenu() {
  const menu = document.getElementById('res-menu');
  const btn  = document.getElementById('res-btn');
  if (!menu) return;
  const isOpen = menu.classList.toggle('open');
  if (btn) btn.classList.toggle('open', isOpen);
}

document.addEventListener('click', e => {
  const wrap = document.getElementById('res-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('res-menu')?.classList.remove('open');
    document.getElementById('res-btn')?.classList.remove('open');
  }
});

async function loadGithubResources() {
  const inp = document.getElementById('res-gh-url');
  if (!inp?.value.trim()) return;
  let url = inp.value.trim();
  if (!url.startsWith('http')) url = `https://api.github.com/repos/${url}/contents/`;

  const section = document.getElementById('res-dynamic-section');
  if (section) section.innerHTML = '<div style="font-size:.68rem;color:rgba(255,255,255,.3);padding:6px">Loading…</div>';

  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    const files = await res.json();
    if (!Array.isArray(files)) throw new Error('Invalid response');

    const htmlFiles = files.filter(f => f.name.endsWith('.html'));
    if (!htmlFiles.length) {
      section.innerHTML = '<div style="font-size:.68rem;color:rgba(255,255,255,.3);padding:6px">No HTML files found.</div>';
      return;
    }

    section.innerHTML = `
      <div class="res-section">GitHub: ${url.split('/')[5] || 'Resources'}</div>
      ${htmlFiles.map(f => `
        <a class="res-item" href="${f.html_url.replace('/blob/','/raw/')}" target="_blank">
          <span class="ri">📄</span>
          <span><div>${f.name.replace('.html','').replace(/-/g,' ')}</div><div class="rd">GitHub · ${(f.size/1024).toFixed(1)}KB</div></span>
        </a>
      `).join('')}
    `;
  } catch(e) {
    section.innerHTML = `<div style="font-size:.68rem;color:var(--error);padding:6px">Load failed: ${e.message}</div>`;
  }
}

// ── Doc Viewer — iframe modal for HTML resource files ────────────────────────

function openDocViewer(url, title) {
  let overlay = document.getElementById('doc-viewer-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'doc-viewer-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;box-sizing:border-box;';
    overlay.innerHTML =
      '<div style="background:#12121e;border:1px solid rgba(255,255,255,.12);border-radius:8px;width:100%;max-width:900px;height:calc(100vh - 40px);display:flex;flex-direction:column;overflow:hidden;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.1);flex-shrink:0">' +
          '<span id="doc-viewer-title" style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:.85rem;color:#fff;letter-spacing:.04em"></span>' +
          '<div style="display:flex;gap:8px;align-items:center">' +
            '<a id="doc-viewer-newwin" href="#" target="_blank" style="font-size:.65rem;color:rgba(255,255,255,.4);text-decoration:none;font-family:\'Space Mono\',monospace">⬡ open tab</a>' +
            '<button onclick="closeDocViewer()" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:1.1rem;cursor:pointer;line-height:1;padding:2px 6px;">&#x2715;</button>' +
          '</div>' +
        '</div>' +
        '<iframe id="doc-viewer-frame" style="flex:1;border:none;background:#fff;" sandbox="allow-same-origin allow-scripts allow-popups"></iframe>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeDocViewer(); });
  }
  document.getElementById('doc-viewer-title').textContent = title || 'Document';
  document.getElementById('doc-viewer-frame').src = url;
  const link = document.getElementById('doc-viewer-newwin');
  link.href = url;
  overlay.style.display = 'flex';
}

function closeDocViewer() {
  const ov = document.getElementById('doc-viewer-overlay');
  if (ov) { ov.style.display = 'none'; document.getElementById('doc-viewer-frame').src = 'about:blank'; }
}

function openLocalResource(evt) {
  if (evt && evt.target && evt.target.files && evt.target.files[0]) {
    const file = evt.target.files[0];
    const url = URL.createObjectURL(file);
    openDocViewer(url, file.name.replace('.html',''));
  } else {
    const inp = document.getElementById('local-res-input');
    if (inp) inp.click();
  }
}

// ── Guide ─────────────────────────────────────────────────────────────────────

function openGuide() {
  let ov = document.getElementById('guide-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'guide-overlay';
    ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:flex-start;justify-content:center;padding:24px;box-sizing:border-box;overflow-y:auto;';
    ov.innerHTML = `
<div style="background:#12121e;border:1px solid rgba(255,255,255,.12);border-radius:10px;width:100%;max-width:820px;font-family:'Barlow Condensed',sans-serif;overflow:hidden;margin:auto;">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.1);background:#0e0e1a;">
    <span style="font-weight:700;font-size:1.1rem;color:#fff;letter-spacing:.04em">📖 VanIQ User Guide</span>
    <button onclick="closeGuide()" style="background:none;border:none;color:rgba(255,255,255,.5);font-size:1.2rem;cursor:pointer;padding:4px 10px;">✕</button>
  </div>
  <div style="padding:24px 28px;font-size:.82rem;color:rgba(255,255,255,.75);line-height:1.7;font-family:'Space Mono',monospace;">

    <h2 style="color:#f5a623;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;margin:0 0 6px;">VIEWS</h2>
    <p><b style="color:#fff">PLAN</b> — Top-down floor plan of the van. Drag modules around, resize with the handle (bottom-right corner). <b style="color:#f5a623">Orange boxes</b> = wheel wells. <b style="color:rgba(82,200,122,.9)">Green line</b> = slide door opening. <b style="color:rgba(74,176,224,.7)">Blue lines</b> = B/C/D pillars.</p>
    <p><b style="color:#fff">DRIVER / PASS ELEV</b> — Side elevation views showing what mounts on the driver or passenger wall.</p>
    <p><b style="color:#fff">SECTION</b> — Cross-section cut at a chosen position. Shows available height and aisle.</p>
    <p><b style="color:#fff">ROOF</b> — Top-down view of the roof skin. Add roof racks, solar panels, fans, etc. with <em>Layer = Roof</em>.</p>

    <h2 style="color:#f5a623;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;margin:16px 0 6px;">ADDING MODULES</h2>
    <p>Click <b style="color:#fff">+ Add Module</b> (or press the Modules tab → +). Fill in Name, Category, Width (W), Depth (D), Layer, and position. Drag it on the canvas to reposition. Double-click to edit.</p>
    <p>Use <b style="color:#fff">IMPORT → CSV</b> to bulk-import a build list. Download a template first with the <b style="color:#fff">TEMPLATE</b> button.</p>

    <h2 style="color:#f5a623;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;margin:16px 0 6px;">ROOF RACK</h2>
    <p>Click <b style="color:#fff">Resources → Add Roof Rack</b> to insert a pre-centered roof rack. It auto-fills the roof width and centers fore-aft. Edit width/depth to match your specific rack. Set Layer = Roof to see it in the Roof view.</p>

    <h2 style="color:#f5a623;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;margin:16px 0 6px;">DIMENSIONS & COORDS</h2>
    <p>All dimensions in <b style="color:#fff">inches</b>. <b>X</b> = position from driver wall (left). <b>Y</b> = position from rear doors (front = higher numbers). The centerline (CL) is the width midpoint of the van.</p>

    <h2 style="color:#f5a623;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;margin:16px 0 6px;">SAVING & PROJECTS</h2>
    <p>Sign in and upgrade to save projects to the cloud. Free users can use Export/Import (JSON) to save locally. Use <b>Ctrl+S</b> (or ⌘S on Mac) to save.</p>

    <h2 style="color:#f5a623;font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;margin:16px 0 6px;">KEYBOARD SHORTCUTS</h2>
    <p><b style="color:#fff">1–6</b> = Switch views &nbsp;|&nbsp; <b style="color:#fff">Del</b> = Delete selected &nbsp;|&nbsp; <b style="color:#fff">E</b> = Edit selected &nbsp;|&nbsp; <b style="color:#fff">Ctrl+Z</b> = Undo &nbsp;|&nbsp; <b style="color:#fff">Ctrl+S</b> = Save &nbsp;|&nbsp; <b style="color:#fff">Esc</b> = Close modal</p>

  </div>
</div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) closeGuide(); });
  }
  ov.style.display = 'flex';
}
function closeGuide() {
  const ov = document.getElementById('guide-overlay');
  if (ov) ov.style.display = 'none';
}

// ── Panel Toggle ──────────────────────────────────────────────────────────────

function togglePanel() {
  const panel = document.querySelector('.lpanel');
  const btn   = document.getElementById('panel-toggle');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  const collapsed = panel.classList.contains('collapsed');
  if (btn) btn.textContent = collapsed ? '◀ Show' : '▶ Hide';
}

// ── Keyboard Shortcuts ────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveLayout(); }
  if (e.key === 'Escape') { desel(); closeEdit(); hideAuthModal?.(); hideUpgradeModal?.(); }
  if (e.key === 'Delete' && selId && !document.getElementById('moverlay')?.classList.contains('open')) {
    delMod();
  }
});

// ── Initialization ────────────────────────────────────────────────────────────

async function init() {
  projects = [{
    name: 'My Van Build',
    vanModel: 'Transit 148 HR',
    id: 'local_default'
  }];

  await initAuth();
  updateAuthUI();

  onAuthChange(async (event, user, profile) => {
    updateAuthUI();
    if (event === 'signed_in') {
      renderProjectSelect();
      const dbProjects = await dbGetProjects();
      if (dbProjects.length > 0) {
        await loadProjectById(dbProjects[0].id);
      }
    }
  });

  handlePostPayment?.();

  const params  = new URLSearchParams(window.location.search);
  const shareId = params.get('share');
  if (shareId) {
    const shared = await dbGetSharedProject(shareId);
    if (shared) {
      modules = shared.modules || [];
      showToast('📎 Viewing shared build: ' + shared.name);
    }
  }

  setView('plan');
  renderModList();
  syncDimInputs();

  // ── Wire up tb-van as a live van model switcher ──
  requestAnimationFrame(() => {
    const tbVan = document.getElementById('tb-van');
    if (tbVan && !tbVan._vanPickerWired) {
      tbVan._vanPickerWired = true;
      tbVan.title = 'Click to change van model';
      tbVan.style.cursor = 'pointer';
      tbVan.style.userSelect = 'none';
      // Add dropdown arrow
      const arrow = document.createElement('span');
      arrow.id = 'tb-van-arrow';
      arrow.textContent = ' ▾';
      arrow.style.cssText = 'font-size:.65em;opacity:.6;';
      tbVan.appendChild(arrow);
      tbVan.addEventListener('click', openVanPicker);
    }
  });

  // ── Inject "Add Roof Rack" into Resources menu ──
  requestAnimationFrame(() => {
    const resMenu = document.getElementById('res-menu');
    if (resMenu && !document.getElementById('res-roof-rack-btn')) {
      const divider = document.createElement('div');
      divider.className = 'res-section';
      divider.textContent = 'Quick Add';
      const rrBtn = document.createElement('button');
      rrBtn.id = 'res-roof-rack-btn';
      rrBtn.className = 'res-item';
      rrBtn.style.cssText = 'width:100%;text-align:left;background:none;border:none;cursor:pointer;color:inherit;padding:0;';
      rrBtn.innerHTML = '<span class="ri">🏗</span><span><div>Add Roof Rack</div><div class="rd">Auto-centered · Layer = Roof</div></span>';
      rrBtn.onclick = () => { toggleResMenu(); addRoofRack(); };
      resMenu.insertBefore(rrBtn, resMenu.firstChild);
      resMenu.insertBefore(divider, resMenu.firstChild);
    }
  });

  // Defer autoFitScale so canvas-wrap has real clientWidth after layout paints
  requestAnimationFrame(() => requestAnimationFrame(() => {
    autoFitScale();
    renderCurrentView();
  }));

  if (!canSave()) {
    setTimeout(() => {
      const banner = document.getElementById('free-banner');
      if (banner) banner.style.display = 'flex';
    }, 3000);
  }
}

window.addEventListener('load', init);
