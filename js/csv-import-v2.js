// ═══════════════════════════════════════════════════════════════════════════════
// VANIQ — CSV Asset Import
// Paste this block anywhere in js/app.js (e.g. after importBuild function)
//
// Wire up in index.html by adding this button wherever your toolbar is:
//   <button onclick="importCSV()" title="Import items from CSV (Excel/Sheets/Notion)">
//     📥 Import Items
//   </button>
//   <button onclick="downloadCSVTemplate()" title="Download blank CSV template">
//     📋 CSV Template
//   </button>
//
// Accepted CSV schemas:
//   A) VanIQ standard:   name*, category*, width*, depth*, height, cost, notes, status, url
//   B) David's build list: Item*, Phase*, Cost, Notes, Status, Brand/Link, URL
//   (* required columns)
//
// Category values (case-insensitive, partial match OK):
//   bed, galley, bath/plumbing, power/electrical, storage/80-20/roof/addon,
//   frame/wall/insulation, garage, seating, work/office
// ═══════════════════════════════════════════════════════════════════════════════

function importCSV() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.csv,text/csv,application/csv';
  input.style.display = 'none';

  input.onchange = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const raw = evt.target.result.replace(/^\uFEFF/, ''); // strip BOM
        const lines = _parseCSVtoRows(raw);
        if (lines.length < 2) {
          showToast('⚠ CSV appears empty', 'error'); return;
        }

        const headers = lines[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

        // Detect schema
        const isStandard  = headers.includes('name') &&
          (headers.includes('category') || headers.includes('cat')) &&
          (headers.includes('width')    || headers.includes('w'));
        const isBuildList = headers.includes('item') && headers.includes('phase');

        if (!isStandard && !isBuildList) {
          showToast(
            '⚠ CSV needs: name/item, category/phase, width, depth  (or download the template)',
            'error'
          );
          return;
        }

        // Helper to find column index by any of several aliases
        const col = (...aliases) => {
          for (const a of aliases) {
            const i = headers.findIndex(h => h === a || h.startsWith(a));
            if (i >= 0) return i;
          }
          return -1;
        };
        const str  = (row, ...aliases) => { const i = col(...aliases); return i >= 0 ? (row[i] || '').trim() : ''; };
        const num  = (row, def, ...aliases) => parseFloat(str(row, ...aliases)) || def;

        // Phase/category → VanIQ CAT key
        const CAT_MAP = {
          bed: 'bed', sleep: 'bed',
          galley: 'galley', kitchen: 'galley', cook: 'galley',
          bath: 'bath', plumb: 'bath', heat: 'bath', water: 'bath',
          power: 'power', elec: 'power', solar: 'power',
          frame: 'frame', wall: 'frame', ceil: 'frame', insul: 'frame', struct: 'frame',
          garage: 'garage', bike: 'garage', gear: 'garage',
          seat: 'seating', chair: 'seating',
          work: 'work', office: 'work', desk: 'work',
          storage: 'storage', '8020': 'storage', addon: 'storage',
          roof: 'storage', interior: 'storage',
        };
        const mapCat = raw => {
          const key = (raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = Object.keys(CAT_MAP).find(k => key.includes(k));
          return match ? CAT_MAP[match] : 'storage';
        };

        const imported = [];
        let skipped = 0;

        lines.slice(1).forEach((row, idx) => {
          let name, cat, w, d, h, cost, notes, status, url;

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
            // Build-list schema
            name   = str(row, 'item');
            cat    = mapCat(str(row, 'phase'));
            w      = 24; d = 24; h = 0;
            cost   = num(row, 0,  'cost', 'price');
            notes  = str(row, 'notes', 'note');
            status = str(row, 'status');
            url    = str(row, 'url', 'link', 'brand');
            const brand     = str(row, 'brand');
            const powerNote = str(row, 'power');
            if (brand)     notes = [notes, `Brand: ${brand}`].filter(Boolean).join(' | ');
            if (powerNote) notes = [notes, `Power: ${powerNote}`].filter(Boolean).join(' | ');
          }

          // Skip blank rows and rows that are just URLs
          if (!name || name.match(/^https?:\/\//)) { skipped++; return; }

          // Stack new items in a grid so they don't all land at 0,0
          const COLS = 4;
          imported.push({
            id:      'csv_' + Date.now() + '_' + idx,
            name,
            cat,
            w:       Math.max(6, w),
            d:       Math.max(6, d),
            h,
            cost,
            notes,
            status:  status || '📝 To Buy',
            url,
            x:       (idx % COLS) * 26,
            y:       Math.floor(idx / COLS) * 26,
            layer:   'floor',
            anchor:  { enabled: false, points: [] },
          });
        });

        if (imported.length === 0) {
          showToast('⚠ No valid items found — check column names', 'error');
          return;
        }

        const totalCost = imported.reduce((s, m) => s + (m.cost || 0), 0);
        const msg =
          `Import ${imported.length} items from CSV?` +
          (skipped ? `\n(${skipped} blank rows skipped)` : '') +
          (totalCost ? `\nTotal estimated cost: $${totalCost.toLocaleString()}` : '');

        if (!confirm(msg)) return;

        modules.push(...imported);
        pushUndo?.();
        runConstraints?.();
        renderCurrentView?.();
        renderModList?.();
        scheduleAutoSave?.();
        showToast(`✅ ${imported.length} items imported · $${totalCost.toLocaleString()} total`, 'success');

      } catch (err) {
        console.error('VanIQ CSV import error:', err);
        showToast('⚠ CSV parse failed: ' + err.message, 'error');
      }
    };

    reader.onerror = () => showToast('⚠ Could not read file', 'error');
    reader.readAsText(file);
  };

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

// ── RFC-4180 compliant CSV parser ─────────────────────────────────────────────
// Handles: quoted fields, embedded commas, embedded newlines, escaped quotes ("")
function _parseCSVtoRows(text) {
  const rows = [];
  let row = [], field = '', inQ = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') { field += '"'; i++; }   // escaped quote
      else if (c === '"')         { inQ = false; }         // close quote
      else                        { field += c; }
    } else {
      if      (c === '"')  { inQ = true; }
      else if (c === ',')  { row.push(field); field = ''; }
      else if (c === '\n') {
        row.push(field); field = '';
        if (row.some(f => f.trim())) rows.push(row);
        row = [];
      } else if (c !== '\r') { field += c; }
    }
  }
  // Last row (no trailing newline)
  row.push(field);
  if (row.some(f => f.trim())) rows.push(row);
  return rows;
}

// ── Download blank CSV template for users ────────────────────────────────────
function downloadCSVTemplate() {
  const rows = [
    ['name', 'category', 'width', 'depth', 'height', 'cost', 'notes', 'status', 'url'],
    ['Queen Bed Platform', 'bed', '60', '80', '12', '400', 'Storage drawers below', '📝 To Buy', ''],
    ['Galley Counter', 'galley', '70', '28', '36', '1800', 'Sink + induction top', '📝 To Buy', ''],
    ['EcoFlow Power Hub', 'power', '13', '16', '18', '1200', '10kWh LiFePO4', '📝 To Buy', ''],
    ['Garage Zone', 'garage', '70', '60', '24', '0', 'E-bike + gear storage', '📝 To Buy', ''],
    ['Water Tank', 'bath', '32', '14', '16', '300', '29gal under bed', '📝 To Buy', ''],
    ['Air Heater', 'bath', '10', '10', '8', '1500', 'Webasto or Espar', '📝 To Buy', ''],
    ['Vent Fan', 'storage', '14', '14', '6', '500', 'MaxxAir or Fan-Tastic', '📝 To Buy', ''],
    ['Swivel Seats', 'seating', '22', '22', '4', '400', 'Driver + passenger', '📝 To Buy', ''],
    ['Work Desk', 'work', '30', '20', '0', '200', 'Lagun table or fold-out', '📝 To Buy', ''],
  ];

  // Quote fields that contain commas
  const escape = f => f.includes(',') ? `"${f}"` : f;
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'vaniq-build-template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  showToast('📥 Template downloaded — open in Excel or Google Sheets', 'success');
}
