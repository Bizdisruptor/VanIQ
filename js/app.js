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

const VAN_MODELS = {
  'Transit 130 LR':       { vw:78,  vl:130, vh:55,  bpillar:38, cargo:'LR', label:'Transit 130 Low Roof' },
  'Transit 130 MR':       { vw:78,  vl:130, vh:72,  bpillar:38, cargo:'MR', label:'Transit 130 Med Roof' },
  'Transit 148 HR': { vw:78, vl:148, vh:83, bpillar:42, cargo:'HR', label:'Transit 148 High Roof',
    // Structural references (inches from front bulkhead, driver wall)
    ribs:      [0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 148],   // floor ribs
    wheelWellL: { y:78, d:36, x:0,  w:9  },   // driver wheel well (x from driver wall, y from front)
    wheelWellR: { y:78, d:36, x:69, w:9  },   // pass wheel well
    frameRails: [3, 75],                        // x positions of frame rails from driver wall
    garageStart: 84,                            // where garage zone begins from front
    cPillar:   108,                             // C-pillar position
    dPillar:   132,                             // D-pillar position
  },
  'Transit 148 EXT HR':   { vw:78,  vl:170, vh:83,  bpillar:42, cargo:'HR', label:'Transit 148 EXT HR' },
  'Sprinter 144 SR':      { vw:76,  vl:144, vh:67,  bpillar:40, cargo:'SR', label:'Sprinter 144 Std Roof' },
  'Sprinter 144 HR':      { vw:76,  vl:144, vh:79,  bpillar:40, cargo:'HR', label:'Sprinter 144 High Roof' },
  'Sprinter 170 HR':      { vw:76,  vl:170, vh:79,  bpillar:40, cargo:'HR', label:'Sprinter 170 High Roof' },
  'Sprinter 170 EXT HR':  { vw:76,  vl:192, vh:79,  bpillar:40, cargo:'HR', label:'Sprinter 170 EXT HR' },
  'ProMaster 136 HR':     { vw:82,  vl:136, vh:74,  bpillar:38, cargo:'HR', label:'ProMaster 136 HR' },
  'ProMaster 159 HR':     { vw:82,  vl:159, vh:74,  bpillar:38, cargo:'HR', label:'ProMaster 159 HR' },
  'Custom':               { vw:78,  vl:148, vh:83,  bpillar:42, cargo:'HR', label:'Custom' },
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
  if (!canSave()) return; // free users can't load
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

  el('tb-van',    v => v.textContent = projects[currentProjectIdx]?.vanModel || 'Transit 148 HR');
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

function drawGrid(ctx, VW, VL) {
  const W = px(VL) + PAD;
  const H = px(VW) + OY + 20;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas') || '#12121a';
  ctx.fillRect(0, 0, W, H);

  const ox = PAD, oy = OY;

  // Minor grid (6")
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= VL; x += 6) { ctx.beginPath(); ctx.moveTo(ox + px(x), oy); ctx.lineTo(ox + px(x), oy + px(VW)); ctx.stroke(); }
  for (let y = 0; y <= VW; y += 6) { ctx.beginPath(); ctx.moveTo(ox, oy + px(y)); ctx.lineTo(ox + px(VL), oy + px(y)); ctx.stroke(); }

  // Major grid (12" / 1 ft)
  ctx.strokeStyle = 'rgba(255,255,255,.09)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= VL; x += 12) { ctx.beginPath(); ctx.moveTo(ox + px(x), oy); ctx.lineTo(ox + px(x), oy + px(VW)); ctx.stroke(); }
  for (let y = 0; y <= VW; y += 12) { ctx.beginPath(); ctx.moveTo(ox, oy + px(y)); ctx.lineTo(ox + px(VL), oy + px(y)); ctx.stroke(); }

  // Centerline X (driver/pass midpoint)
  const cxPx = ox + px(VW / 2);
  ctx.strokeStyle = 'rgba(74,176,224,.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(ox, oy + px(VW/2)); ctx.lineTo(ox + px(VL), oy + px(VW/2)); ctx.stroke();
  ctx.setLineDash([]);

  // Top ruler (length axis — front to rear)
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.font = `${Math.max(7, S * 1.6)}px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  for (let x = 0; x <= VL; x += (S < 2 ? 24 : S < 3 ? 12 : 6)) {
    const xp = ox + px(x);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillRect(xp, oy - 6, 1, 6);
    if (x % 12 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillText(`${x}"`, xp, oy - 9);
    }
  }

  // Left ruler (width axis — with CL = 0)
  ctx.textAlign = 'right';
  const CLy = VW / 2;
  for (let y = 0; y <= VW; y += (S < 2 ? 12 : 6)) {
    const yp = oy + px(y);
    const offset = Math.round(y - CLy);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillRect(ox - 6, yp, 6, 1);
    if (y % 12 === 0 || Math.abs(offset) < 1) {
      ctx.fillStyle = offset === 0 ? 'rgba(74,176,224,.8)' : 'rgba(255,255,255,.45)';
      const label = offset === 0 ? '±0' : (offset > 0 ? `+${offset}` : `${offset}`);
      ctx.fillText(label, ox - 8, yp + 3);
    }
  }

  // CL label
  ctx.fillStyle = 'rgba(74,176,224,.7)';
  ctx.textAlign = 'left';
  ctx.font = `bold ${Math.max(7, S * 1.4)}px 'Space Mono', monospace`;
  ctx.fillText('CL', ox + px(VL) + 4, oy + px(VW/2) + 3);

  // Van shell outline
  ctx.strokeStyle = 'rgba(255,255,255,.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.strokeRect(ox, oy, px(VL), px(VW));
  // Front bulkhead
  ctx.strokeStyle = 'rgba(255,255,255,.4)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + px(VW)); ctx.stroke();
  // Rear doors
  ctx.strokeStyle = 'rgba(232,160,32,.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ox + px(VL), oy); ctx.lineTo(ox + px(VL), oy + px(VW)); ctx.stroke();
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

function renderPlan() {
  const refs   = getTransitRefs();
  const VW = refs.vw, VL = refs.vl;
  const W  = px(VL) + PAD + 20;
  const H  = px(VW) + OY + 30;

  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  wrap.style.position = 'relative';
  wrap.style.minWidth  = W + 'px';
  wrap.style.minHeight = H + 'px';

  // Canvas (grid)
  const cvs = makeCanvas(W, H);
  const ctx = cvs.getContext('2d');
  drawGrid(ctx, VW, VL);
  cvs.style.position = 'absolute'; cvs.style.top = '0'; cvs.style.left = '0';
  wrap.appendChild(cvs);

  const bpillar = refs.bpillar || 42;
  const showRefs = document.getElementById('s-refs')?.checked !== false;

  // SVG overlay for structural references
  const svg = makeSVG(W, H);
  wrap.appendChild(svg);

  if (showRefs) {
    const ox = PAD, oy = OY;

    // Floor ribs
    (refs.ribs || []).forEach(r => {
      if (r === 0 || r >= VL) return;
      const line = svgEl('line', { x1: ox+px(r), y1: oy, x2: ox+px(r), y2: oy+px(VW),
        stroke:'rgba(255,255,255,.12)', 'stroke-width':'1', 'stroke-dasharray':'3,4' });
      svg.appendChild(line);
    });

    // B-pillar
    const bpx = ox + px(bpillar);
    const bline = svgEl('line', { x1:bpx, y1:oy, x2:bpx, y2:oy+px(VW),
      stroke:'rgba(74,176,224,.5)', 'stroke-width':'2' });
    svg.appendChild(bline);
    const btxt = svgText(bpx+3, oy+10, 'B', 'rgba(74,176,224,.7)', 8, 'start');
    svg.appendChild(btxt);

    // C-pillar
    if (refs.cPillar) {
      const cpx = ox + px(refs.cPillar);
      svg.appendChild(svgEl('line', { x1:cpx, y1:oy, x2:cpx, y2:oy+px(VW),
        stroke:'rgba(74,176,224,.35)', 'stroke-width':'1.5' }));
      svg.appendChild(svgText(cpx+3, oy+10, 'C', 'rgba(74,176,224,.5)', 8, 'start'));
    }

    // D-pillar
    if (refs.dPillar) {
      const dpx = ox + px(refs.dPillar);
      svg.appendChild(svgEl('line', { x1:dpx, y1:oy, x2:dpx, y2:oy+px(VW),
        stroke:'rgba(74,176,224,.35)', 'stroke-width':'1.5' }));
      svg.appendChild(svgText(dpx+3, oy+10, 'D', 'rgba(74,176,224,.5)', 8, 'start'));
    }

    // Wheel wells
    [refs.wheelWellL, refs.wheelWellR].forEach(ww => {
      if (!ww) return;
      const wx = ox + px(ww.x), wy = oy + px(ww.y);
      const wr = svgEl('rect', { x:wx, y:wy, width:px(ww.w), height:px(ww.d),
        fill:'rgba(232,160,32,.08)', stroke:'rgba(232,160,32,.4)', 'stroke-width':'1.5',
        rx:'2' });
      svg.appendChild(wr);
      svg.appendChild(svgText(wx+px(ww.w/2), wy+px(ww.d/2)+3, 'WW',
        'rgba(232,160,32,.5)', 7));
    });

    // Frame rails
    (refs.frameRails || []).forEach(rx => {
      const fline = svgEl('line', {
        x1: ox+px(rx), y1: oy, x2: ox+px(rx), y2: oy+px(VW),
        stroke:'rgba(160,130,200,.25)', 'stroke-width':'2', 'stroke-dasharray':'6,3'
      });
      svg.appendChild(fline);
    });

    // Garage zone line
    if (refs.garageStart) {
      const gz = ox + px(refs.garageStart);
      svg.appendChild(svgEl('line', { x1:gz, y1:oy, x2:gz, y2:oy+px(VW),
        stroke:'rgba(232,160,32,.3)', 'stroke-width':'1', 'stroke-dasharray':'8,4' }));
      svg.appendChild(svgText(gz+3, oy+px(VW)-4, 'GARAGE',
        'rgba(232,160,32,.4)', 6, 'start'));
    }
  }

  // Dropzone div (for module drag/drop)
  const dz = document.createElement('div');
  dz.id = 'plan-dropzone';
  dz.style.cssText = `position:absolute;left:${PAD}px;top:${OY}px;width:${px(VL)}px;height:${px(VW)}px;`;
  wrap.appendChild(dz);

  // Slide door clearance zone
  const slideZone = document.createElement('div');
  slideZone.style.cssText = `
    position:absolute;
    left:${px(bpillar)}px;top:${px(VW/2)}px;
    width:${px(24)}px;height:${px(VW/2)}px;
    background:rgba(82,200,122,.07);border:1px dashed rgba(82,200,122,.3);
    pointer-events:none;box-sizing:border-box;
  `;
  const slideLabel = document.createElement('div');
  slideLabel.style.cssText = 'position:absolute;bottom:2px;left:2px;font-size:6px;color:rgba(82,200,122,.5);font-family:monospace;white-space:nowrap;';
  slideLabel.textContent = '24\" clear';
  slideZone.appendChild(slideLabel);
  dz.appendChild(slideZone);

  // Render modules
  modules.filter(m => m.layer === 'floor').forEach(m => addPlanMod(m, dz, VW, VL));
  modules.filter(m => m.layer !== 'floor').forEach(m => addPlanMod(m, dz, VW, VL));

  recalc();
}

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
  handle.style.cssText = 'position:absolute;bottom:0;right:0;width:10px;height:10px;cursor:se-resize;';
  el.appendChild(handle);

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
    showAnchorHud(m);
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

function renderElev(side = "driver") {
  const refs = getTransitRefs();
  const VL = refs.vl, VH = refs.vh;
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
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= VL; x += 12) { ctx.beginPath(); ctx.moveTo(ox+px(x),oy); ctx.lineTo(ox+px(x),oy+px(VH)); ctx.stroke(); }
  for (let y = 0; y <= VH; y += 12) { ctx.beginPath(); ctx.moveTo(ox,oy+px(y)); ctx.lineTo(ox+px(VL),oy+px(y)); ctx.stroke(); }

  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(ox, oy, px(VL), px(VH));

  const svg = makeSVG(W, H);
  modules.forEach(m => {
    if (!m.h) return;
    const r = svgEl('rect', {
      x: ox + px(m.x), y: oy + px(VH - m.h),
      width: px(m.w), height: px(m.h),
      fill: (CAT[m.cat]||CAT.frame).bg,
      stroke: (CAT[m.cat]||CAT.frame).border,
      'stroke-width': 1.5, rx: 2
    });
    svg.appendChild(r);
    const t = svgText(ox + px(m.x) + px(m.w)/2, oy + px(VH - m.h) + 12, m.name, (CAT[m.cat]||CAT.frame).text, Math.max(7,S*1.4));
    svg.appendChild(t);
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
  renderPlan(); // TODO: filter to roof layer items only
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

function openLocalResource() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.html';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };
  input.click();
}

// ── Guide ─────────────────────────────────────────────────────────────────────

function openGuide() {
  document.getElementById('guide-overlay').style.display = 'flex';
}
function closeGuide() {
  document.getElementById('guide-overlay').style.display = 'none';
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
  autoFitScale();
  syncDimInputs();

  if (!canSave()) {
    setTimeout(() => {
      const banner = document.getElementById('free-banner');
      if (banner) banner.style.display = 'flex';
    }, 3000);
  }
}

window.addEventListener('load', init);
