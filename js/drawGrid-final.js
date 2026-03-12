function drawGrid(ctx, VW, VL) {
  const refs = getTransitRefs();
  const ox = PAD, oy = OY;
  const W  = px(VL) + PAD + 20;
  const H  = px(VW) + OY + 30;

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas') || '#12121a';
  ctx.fillRect(0, 0, W, H);

  // Minor grid (6")
  ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= VL; x += 6) { ctx.beginPath(); ctx.moveTo(ox+px(x), oy); ctx.lineTo(ox+px(x), oy+px(VW)); ctx.stroke(); }
  for (let y = 0; y <= VW; y += 6) { ctx.beginPath(); ctx.moveTo(ox, oy+px(y)); ctx.lineTo(ox+px(VL), oy+px(y)); ctx.stroke(); }

  // Major grid (12" / 1 ft)
  ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1;
  for (let x = 0; x <= VL; x += 12) { ctx.beginPath(); ctx.moveTo(ox+px(x), oy); ctx.lineTo(ox+px(x), oy+px(VW)); ctx.stroke(); }
  for (let y = 0; y <= VW; y += 12) { ctx.beginPath(); ctx.moveTo(ox, oy+px(y)); ctx.lineTo(ox+px(VL), oy+px(y)); ctx.stroke(); }

  // Centerline (driver/pass midpoint)
  ctx.strokeStyle = 'rgba(74,176,224,.35)'; ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(ox, oy+px(VW/2)); ctx.lineTo(ox+px(VL), oy+px(VW/2)); ctx.stroke();
  ctx.setLineDash([]);

  // Top ruler (length axis — rear to front/bulkhead)
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.font = Math.max(7, S * 1.6) + 'px \'Space Mono\', monospace';
  ctx.textAlign = 'center';
  for (let x = 0; x <= VL; x += (S < 2 ? 24 : S < 3 ? 12 : 6)) {
    const xp = ox + px(x);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillRect(xp, oy - 6, 1, 6);
    if (x % 12 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillText(x + '"', xp, oy - 9);
    }
  }

  // Left ruler (width axis — CL relative)
  ctx.textAlign = 'right';
  const CLy = VW / 2;
  for (let y = 0; y <= VW; y += (S < 2 ? 12 : 6)) {
    const yp = oy + px(y);
    const offset = Math.round(y - CLy);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillRect(ox - 6, yp, 6, 1);
    if (y % 12 === 0 || Math.abs(offset) < 1) {
      ctx.fillStyle = offset === 0 ? 'rgba(74,176,224,.8)' : 'rgba(255,255,255,.45)';
      const label = offset === 0 ? '±0' : (offset > 0 ? '+' + offset : '' + offset);
      ctx.fillText(label, ox - 8, yp + 3);
    }
  }

  // Floor interior fill
  ctx.fillStyle = 'rgba(255,255,255,.02)';
  ctx.fillRect(ox, oy, px(VL), px(VW));

  // ── Wheel wells ──
  // Coordinate convention: ww.y = position along LENGTH axis (maps to canvas x)
  //                        ww.x = position along WIDTH axis (maps to canvas y; 0=driver wall)
  //                        ww.d = fore-aft extent (canvas x direction)
  //                        ww.w = wall intrusion (canvas y direction)
  [refs.wheelWellL, refs.wheelWellR].forEach(function(ww) {
    if (!ww) return;
    const cx = ox + px(ww.y);   // canvas x = length position
    const cy = oy + px(ww.x);   // canvas y = width position (driver wall = 0)
    const cw = px(ww.d);         // canvas width = fore-aft depth
    const ch = px(ww.w);         // canvas height = wall intrusion

    // Diagonal hatch fill
    ctx.save();
    ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip();
    ctx.strokeStyle = 'rgba(232,160,32,.28)'; ctx.lineWidth = 1;
    for (let i = -ch; i < cw + ch; i += 5) {
      ctx.beginPath(); ctx.moveTo(cx + i, cy); ctx.lineTo(cx + i + ch, cy + ch); ctx.stroke();
    }
    ctx.restore();

    // Fill + border
    ctx.fillStyle = 'rgba(232,160,32,.1)';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = 'rgba(232,160,32,.8)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // "WW" label
    ctx.fillStyle = 'rgba(232,160,32,.9)';
    ctx.font = 'bold ' + Math.max(6, S * 1.1) + 'px \'Space Mono\', monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WW', cx + cw/2, cy + ch/2 + 3);

    // Dimension note
    ctx.fillStyle = 'rgba(232,160,32,.65)';
    ctx.font = Math.max(5, S * 0.9) + 'px \'Space Mono\', monospace';
    ctx.fillText(ww.d + '"×' + ww.w + '"', cx + cw/2, cy + ch/2 + 3 + Math.max(9, S * 1.5));

    // "11\"H" note outside van wall (above driver well, below pass well)
    ctx.fillText('11"H', cx + cw/2, ww.x === 0 ? cy - 8 : cy + ch + 10);
  });

  // Van shell outline (drawn over wells so walls appear solid)
  ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.strokeRect(ox, oy, px(VL), px(VW));

  // Front bulkhead — right wall (cab end), thick with slight fill
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  ctx.fillRect(ox + px(VL) - 3, oy, 6, px(VW));
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(ox + px(VL), oy); ctx.lineTo(ox + px(VL), oy + px(VW)); ctx.stroke();
  // BULKHEAD label (rotated)
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.font = 'bold ' + Math.max(5, S * 0.9) + 'px \'Space Mono\', monospace';
  ctx.textAlign = 'center';
  ctx.translate(ox + px(VL) + 13, oy + px(VW/2));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('BULKHEAD', 0, 0);
  ctx.restore();

  // Rear double doors — left wall (rear of van)
  ctx.strokeStyle = 'rgba(232,160,32,.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + px(VW)); ctx.stroke();
  // Center split between doors
  ctx.strokeStyle = 'rgba(232,160,32,.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(ox, oy + px(VW/2)); ctx.lineTo(ox + px(8), oy + px(VW/2)); ctx.stroke();
  ctx.setLineDash([]);
  // Door swing arcs
  const arc = px(Math.min(VW/2, 24));
  ctx.strokeStyle = 'rgba(232,160,32,.18)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
  ctx.beginPath(); ctx.arc(ox, oy, arc, 0, Math.PI/2); ctx.stroke();
  ctx.beginPath(); ctx.arc(ox, oy + px(VW), arc, -Math.PI/2, 0); ctx.stroke();
  ctx.setLineDash([]);
  // REAR DOORS label
  ctx.save();
  ctx.fillStyle = 'rgba(232,160,32,.45)';
  ctx.font = 'bold ' + Math.max(5, S * 0.9) + 'px \'Space Mono\', monospace';
  ctx.textAlign = 'center';
  ctx.translate(ox - 14, oy + px(VW/2));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('REAR DOORS', 0, 0);
  ctx.restore();

  // Slide door — passenger wall (bottom), measured from bulkhead (right side)
  if (refs.slideDoor) {
    const sd    = refs.slideDoor;
    const sdX1  = ox + px(VL) - px(sd.yEnd);
    const sdX2  = ox + px(VL) - px(sd.yStart);
    const sdW   = sdX2 - sdX1;
    const wallY = oy + px(VW);

    // Clear the bottom wall line to show opening
    ctx.clearRect(sdX1, wallY - 2, sdW, 5);

    // Slide door colored line
    ctx.strokeStyle = 'rgba(82,200,122,.9)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(sdX1, wallY); ctx.lineTo(sdX2, wallY); ctx.stroke();

    // Parked door indicator (dashed rectangle showing door slid toward rear)
    ctx.strokeStyle = 'rgba(82,200,122,.28)'; ctx.lineWidth = 1; ctx.setLineDash([4, 2]);
    ctx.strokeRect(sdX1 - sdW, wallY - px(3), sdW, px(3));
    ctx.setLineDash([]);

    // Edge tick marks
    [sdX1, sdX2].forEach(function(tx) {
      ctx.strokeStyle = 'rgba(82,200,122,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx, wallY - px(4)); ctx.lineTo(tx, wallY + 6); ctx.stroke();
    });

    // Labels
    ctx.fillStyle = 'rgba(82,200,122,.85)';
    ctx.font = 'bold ' + Math.max(6, S * 1.1) + 'px \'Space Mono\', monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SLIDE DOOR', (sdX1 + sdX2) / 2, wallY + 14);
    ctx.fillStyle = 'rgba(82,200,122,.5)';
    ctx.font = Math.max(5, S) + 'px \'Space Mono\', monospace';
    ctx.fillText((sd.yEnd - sd.yStart) + '" opening', (sdX1 + sdX2) / 2, wallY + 23);
  }

  // ── Dimension callouts ──
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.font = Math.max(6, S * 1.2) + 'px \'Space Mono\', monospace';
  ctx.textAlign = 'center';
  ctx.fillText(VL + '" cargo length', ox + px(VL/2), oy - 18);
  ctx.save();
  ctx.translate(ox - 42, oy + px(VW/2));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(VW + '" interior width', 0, 0);
  ctx.restore();

  // CL label (right of centerline)
  ctx.fillStyle = 'rgba(74,176,224,.7)';
  ctx.textAlign = 'left';
  ctx.font = 'bold ' + Math.max(7, S * 1.4) + 'px \'Space Mono\', monospace';
  ctx.fillText('CL', ox + px(VL) + 16, oy + px(VW/2) + 3);
}
