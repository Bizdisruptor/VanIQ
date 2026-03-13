/**
 * drawPlanView.ts
 * Draws the Transit 148 HR plan view blueprint onto a canvas.
 * Coordinate system: top = front/cab, bottom = rear doors.
 * All measurements in inches, scale factor S = px per inch.
 */

import { TRANSIT_148_HR } from '../../data/vans/transit148hr';

const V = TRANSIT_148_HR;

const REFS = {
  vw:          V.cargoWidthMax,
  vl:          V.cargoLengthAtFloor,
  label:       'Ford Transit 148 HR',
  partition:   V.partitionDepth,
  btwn:        V.cargoWidthBetweenWells,
  rearOpen:    V.rearDoorOpeningWidth,
  slideDoor:   { y1: V.slideDoorStart, y2: V.slideDoorEnd },
  wwL:         { y: V.wheelWellStart, d: V.wheelWellLength, w: V.wheelWellDepth },
  wwR:         { y: V.wheelWellStart, d: V.wheelWellLength, w: V.wheelWellDepth },
  driverShelf: V.driverWallLength,
  passShelf:   V.passengerWallLength,
  ribs:        [16, 32, 48, 64, 80, 96, 112, 128, 144],
};

export interface DrawOptions {
  scale: number;   // px per inch, e.g. 4
  width: number;   // total canvas width
  height: number;  // total canvas height
}

// Padding constants (px, independent of scale)
const PAD_L  = 80;
const PAD_T  = 100;
const PAD_R  = 80;
const PAD_B  = 100;

const WALL    = 5;   // in — exterior body beyond interior floor
const CAB_H   = 24;  // in — hood illustration height
const CAB_GAP = 8;   // px — gap between hood bottom and cargo floor

export function getPlanDimensions(scale: number): { width: number; height: number } {
  const iw = Math.round(REFS.vw * scale);
  const il = Math.round(REFS.vl * scale);
  const WE = Math.round(WALL * scale);
  const cabH = Math.round(CAB_H * scale);
  const W = PAD_L + WE + iw + WE + PAD_R;
  const H = PAD_T + cabH + CAB_GAP + WE + il + WE + PAD_B + 100;
  return { width: W, height: H };
}

export function drawPlanView(ctx: CanvasRenderingContext2D, scale: number) {
  const S = scale;
  const px = (i: number) => Math.round(i * S);

  const iw = px(REFS.vw);
  const il = px(REFS.vl);
  const WE = px(WALL);
  const cabH = px(CAB_H);
  const GAP = CAB_GAP;

  const ox = PAD_L + WE;
  const oy = PAD_T + cabH + GAP + WE;

  const bx = ox - WE;
  const bw = iw + WE * 2;
  const by = oy - WE - GAP - cabH;
  const bh = cabH + GAP + WE + il + WE;

  const BUMP = Math.max(8, px(8));
  const rF = WE + px(9);
  const rR = WE + px(2);

  const fLG = Math.max(11, px(1.4));
  const fMD = Math.max(10, px(1.1));
  const fSM = Math.max(8,  px(0.9));
  const fXS = Math.max(7,  px(0.75));

  function rr(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arcTo(x+w, y, x+w, y+r, r); ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r); ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h, x, y+h-r, r); ctx.lineTo(x, y+r);
    ctx.arcTo(x, y, x+r, y, r); ctx.closePath();
  }

  // ── 0. Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, getPlanDimensions(S).width, getPlanDimensions(S).height);

  // ── 1. Exterior body ───────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(bx+rF, by); ctx.lineTo(bx+bw-rF, by);
  ctx.arcTo(bx+bw, by, bx+bw, by+rF, rF);
  ctx.lineTo(bx+bw, by+bh-rR);
  ctx.arcTo(bx+bw, by+bh, bx+bw-rR, by+bh, rR);
  ctx.lineTo(bx+rR, by+bh);
  ctx.arcTo(bx, by+bh, bx, by+bh-rR, rR);
  ctx.lineTo(bx, by+rF);
  ctx.arcTo(bx, by, bx+rF, by, rF);
  ctx.closePath();
  ctx.fillStyle = '#e2e6f0'; ctx.fill();
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2.5; ctx.stroke();

  // ── 2. Hood / cab (above bulkhead — no seats here) ────────────────────────
  const hoodTop = by;
  const hoodBot = oy - GAP;
  ctx.save();
  rr(bx+1, hoodTop+1, bw-2, hoodBot-hoodTop-1, rF-1);
  ctx.clip();
  ctx.fillStyle = '#cdd3e2'; ctx.fill();
  ctx.restore();

  // Grille band
  const gH = Math.max(px(5), 12);
  ctx.fillStyle = '#a8b4c8';
  ctx.fillRect(bx+px(4), hoodTop+px(1), bw-px(8), gH);
  ctx.strokeStyle = '#7a8699'; ctx.lineWidth = 1;
  for (let g = 1; g < 3; g++) {
    const gy = hoodTop + px(1) + g * (gH / 3);
    ctx.beginPath(); ctx.moveTo(bx+px(4), gy); ctx.lineTo(bx+bw-px(4), gy); ctx.stroke();
  }
  // Headlights
  const hlW = px(10), hlH = px(6);
  [[bx+px(4), hoodTop+px(1)], [bx+bw-px(14), hoodTop+px(1)]].forEach(([hx, hy]) => {
    ctx.fillStyle = '#d4e0f0'; ctx.fillRect(hx, hy, hlW, hlH);
    ctx.strokeStyle = '#8899bb'; ctx.lineWidth = 0.8; ctx.strokeRect(hx, hy, hlW, hlH);
  });
  // Windshield band
  const wsTop = hoodBot - px(10);
  const wsH = px(8);
  ctx.fillStyle = 'rgba(180,200,230,0.55)';
  ctx.fillRect(bx+px(3), wsTop, bw-px(6), wsH);
  ctx.strokeStyle = '#99aac0'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx+px(3), wsTop); ctx.lineTo(bx+bw-px(3), wsTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx+px(3), wsTop+wsH); ctx.lineTo(bx+bw-px(3), wsTop+wsH); ctx.stroke();
  // A-pillars
  ctx.fillStyle = '#8a9ab5';
  ctx.fillRect(bx+px(2), wsTop, px(4), wsH);
  ctx.fillRect(bx+bw-px(6), wsTop, px(4), wsH);
  // Side mirrors
  const mW = px(5), mH = px(10), mY = wsTop - px(2);
  rr(bx-mW, mY, mW, mH, 2); ctx.fillStyle = '#b8c4d8'; ctx.fill(); ctx.strokeStyle = '#6a7a90'; ctx.lineWidth = 1; ctx.stroke();
  rr(bx+bw, mY, mW, mH, 2); ctx.fillStyle = '#b8c4d8'; ctx.fill(); ctx.stroke();

  // ── 3. Bulkhead ────────────────────────────────────────────────────────────
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(bx, oy); ctx.lineTo(bx+bw, oy); ctx.stroke();
  ctx.fillStyle = '#1a1a2e'; ctx.font = `bold ${fMD}px Arial`; ctx.textAlign = 'center';
  ctx.fillText('BULKHEAD  —  0"', bx+bw/2, oy - 6);

  // ── 4. Interior cargo floor ────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'; ctx.fillRect(ox, oy, iw, il);

  // ── 5. Seats (in cab section, ABOVE the bulkhead line) ─────────────────────
  function drawSeat(cx: number, topY: number, lbl: string) {
    const sw = px(18), sd = px(16), sx = cx - sw/2, sy = topY;
    rr(sx, sy, sw, sd, 4);
    ctx.fillStyle = '#b8c2d5'; ctx.fill(); ctx.strokeStyle = '#6a7a95'; ctx.lineWidth = 1.2; ctx.stroke();
    rr(sx, sy, sw, sd*0.35, 4);
    ctx.fillStyle = '#9aaac0'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, sy + sd*0.14, sw*0.2, 0, Math.PI*2);
    ctx.fillStyle = '#8898b2'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#445060'; ctx.font = `${fXS}px Arial`; ctx.textAlign = 'center';
    ctx.fillText(lbl, cx, sy + sd + px(1.5));
  }
  const seatY = oy - px(16) - px(4);  // seat height + margin, placed above bulkhead
  const drvCX = bx + bw * 0.24;
  const pasCX = bx + bw * 0.76;
  drawSeat(drvCX, seatY, 'DRV');
  drawSeat(pasCX, seatY, 'PASS');
  // Steering wheel
  const swR = Math.max(5, px(3.5));
  ctx.strokeStyle = '#2a2f42'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(drvCX, seatY + px(2), swR, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(drvCX-swR, seatY+px(2)); ctx.lineTo(drvCX+swR, seatY+px(2)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(drvCX, seatY+px(2)-swR); ctx.lineTo(drvCX, seatY+px(2)+swR); ctx.stroke();

  // ── 6. Grid ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,80,200,0.06)'; ctx.lineWidth = 0.3;
  for (let gx = 0; gx <= REFS.vw; gx++) {
    const xp = ox+px(gx); ctx.beginPath(); ctx.moveTo(xp, oy); ctx.lineTo(xp, oy+il); ctx.stroke();
  }
  for (let gy = 0; gy <= REFS.vl; gy++) {
    const yp = oy+px(gy); ctx.beginPath(); ctx.moveTo(ox, yp); ctx.lineTo(ox+iw, yp); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,50,160,0.18)'; ctx.lineWidth = 0.7;
  for (let gx = 0; gx <= REFS.vw; gx += 12) {
    const xp = ox+px(gx); ctx.beginPath(); ctx.moveTo(xp, oy); ctx.lineTo(xp, oy+il); ctx.stroke();
  }
  for (let gy = 0; gy <= REFS.vl; gy += 12) {
    const yp = oy+px(gy); ctx.beginPath(); ctx.moveTo(ox, yp); ctx.lineTo(ox+iw, yp); ctx.stroke();
  }
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.setLineDash([]);
  ctx.strokeRect(ox, oy, iw, il);

  // ── 7. Floor ribs ──────────────────────────────────────────────────────────
  REFS.ribs.forEach((r, i) => {
    if (r <= 0 || r >= REFS.vl) return;
    const ry = oy + px(r);
    ctx.strokeStyle = 'rgba(50,90,200,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox+3, ry); ctx.lineTo(ox+iw-3, ry); ctx.stroke();
    ctx.strokeStyle = 'rgba(50,90,200,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ox, ry-4); ctx.lineTo(ox, ry+4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox+iw, ry-4); ctx.lineTo(ox+iw, ry+4); ctx.stroke();
    ctx.fillStyle = 'rgba(30,70,180,0.7)'; ctx.font = `bold ${fSM}px Arial`; ctx.textAlign = 'left';
    ctx.fillText(`R${i+1}`, ox+iw+5, ry+4);
    ctx.fillStyle = 'rgba(30,70,180,0.5)'; ctx.font = `${fXS}px Arial`; ctx.textAlign = 'right';
    ctx.fillText(`${r}"`, ox-5, ry+4);
  });

  // ── 8. Fender bumps ────────────────────────────────────────────────────────
  function fender(ww: typeof REFS.wwL, side: 'L' | 'R') {
    const wy1 = oy+px(ww.y), wy2 = wy1+px(ww.d);
    const wallX = side === 'L' ? bx : bx+bw;
    const bumpX = side === 'L' ? bx-BUMP : bx+bw+BUMP;
    const cv = Math.max(4, BUMP*0.4), sg = side === 'L' ? 1 : -1;
    ctx.fillStyle = '#c8ced8';
    ctx.beginPath(); ctx.moveTo(wallX, wy1); ctx.lineTo(bumpX+sg*cv, wy1);
    ctx.arcTo(bumpX, wy1, bumpX, wy1+cv, cv); ctx.lineTo(bumpX, wy2-cv);
    ctx.arcTo(bumpX, wy2, bumpX+sg*cv, wy2, cv); ctx.lineTo(wallX, wy2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.stroke();
  }
  fender(REFS.wwL, 'L'); fender(REFS.wwR, 'R');

  // ── 9. Wheel wells ─────────────────────────────────────────────────────────
  function well(ww: typeof REFS.wwL, side: 'L' | 'R') {
    const wy = oy+px(ww.y), wl = px(ww.d), wd = px(ww.w);
    const wx = side === 'L' ? ox : ox+iw-wd;
    ctx.fillStyle = '#bec5d0'; ctx.fillRect(wx, wy, wd, wl);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, wd, wl); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 0.9;
    for (let i = -wl; i < wd+wl; i += 5) {
      ctx.beginPath(); ctx.moveTo(wx+i, wy); ctx.lineTo(wx+i+wl, wy+wl); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1.8; ctx.strokeRect(wx, wy, wd, wl);
    ctx.fillStyle = '#111'; ctx.font = `bold ${fSM}px Arial`; ctx.textAlign = 'center';
    ctx.fillText('WW', wx+wd/2, wy+wl/2-2);
    ctx.font = `${fXS}px Arial`;
    ctx.fillText(`${ww.d}"×${ww.w}"`, wx+wd/2, wy+wl/2+10);
  }
  well(REFS.wwL, 'L'); well(REFS.wwR, 'R');

  // Between-wells span
  const mWY = oy+px(REFS.wwL.y + REFS.wwL.d/2);
  const bwL = ox+px(REFS.wwL.w), bwR = ox+px(REFS.vw - REFS.wwR.w);
  ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bwL, mWY); ctx.lineTo(bwR, mWY); ctx.stroke();
  [[bwL,-1],[bwR,1]].forEach(([p, d]) => {
    ctx.beginPath(); ctx.moveTo(p as number, mWY); ctx.lineTo((p as number)+(d as number)*5, mWY-3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p as number, mWY); ctx.lineTo((p as number)+(d as number)*5, mWY+3); ctx.stroke();
  });
  ctx.fillStyle = '#fff'; ctx.fillRect((bwL+bwR)/2-26, mWY-8, 52, 14);
  ctx.fillStyle = '#444'; ctx.font = `${fSM}px Arial`; ctx.textAlign = 'center';
  ctx.fillText(`${REFS.btwn}" between wells`, (bwL+bwR)/2, mWY+4);

  // ── 10. Partition ──────────────────────────────────────────────────────────
  const pY = oy + px(REFS.partition);
  ctx.strokeStyle = 'rgba(180,0,0,0.5)'; ctx.lineWidth = 1.3; ctx.setLineDash([5,3]);
  ctx.beginPath(); ctx.moveTo(ox, pY); ctx.lineTo(ox+iw, pY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(180,0,0,0.65)'; ctx.font = `bold ${fSM}px Arial`; ctx.textAlign = 'left';
  ctx.fillText(`PARTITION  ${REFS.partition}"`, ox+4, pY-4);

  // ── 11. Shelf zones ────────────────────────────────────────────────────────
  const dsT = oy + px(REFS.vl - REFS.driverShelf);
  ctx.strokeStyle = 'rgba(0,130,55,0.7)'; ctx.lineWidth = 5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(ox+3, dsT); ctx.lineTo(ox+3, oy+il); ctx.stroke();
  [dsT, oy+il-2].forEach(y => {
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox+9, y); ctx.stroke();
  });
  const psT = oy + px(REFS.vl - REFS.passShelf);
  ctx.strokeStyle = 'rgba(0,130,55,0.45)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(ox+iw-3, psT); ctx.lineTo(ox+iw-3, oy+il); ctx.stroke();
  [psT, oy+il-2].forEach(y => {
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox+iw, y); ctx.lineTo(ox+iw-9, y); ctx.stroke();
  });

  // ── 12. Rear doors ─────────────────────────────────────────────────────────
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 4; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(ox, oy+il); ctx.lineTo(ox+iw, oy+il); ctx.stroke();
  ctx.fillStyle = '#1a1a2e'; ctx.font = `bold ${fMD}px Arial`; ctx.textAlign = 'center';
  ctx.fillText(`REAR DOORS  ${REFS.rearOpen}"`, ox+iw/2, oy+il+WE+22);

  // ── 13. Slide door ─────────────────────────────────────────────────────────
  const sdY1 = oy+px(REFS.slideDoor.y1), sdY2 = oy+px(REFS.slideDoor.y2);
  ctx.strokeStyle = '#00a651'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(ox+iw, sdY1); ctx.lineTo(ox+iw, sdY2); ctx.stroke();
  ctx.save(); ctx.fillStyle = '#00a651'; ctx.font = `bold ${fMD}px Arial`;
  ctx.textAlign = 'center'; ctx.translate(ox+iw+WE+28, (sdY1+sdY2)/2);
  ctx.rotate(Math.PI/2); ctx.fillText(`SLIDE DOOR  ${REFS.slideDoor.y2-REFS.slideDoor.y1}"`, 0, 0);
  ctx.restore();

  // ── 14. Width ruler ────────────────────────────────────────────────────────
  const half = REFS.vw / 2, rulerY = oy - 20;
  for (let rx = 0; rx <= REFS.vw; rx += 6) {
    const xp = ox+px(rx), off = Math.round(rx - half), maj = (rx % 12 === 0);
    ctx.strokeStyle = maj ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = maj ? 1.2 : 0.6;
    ctx.beginPath(); ctx.moveTo(xp, rulerY-(maj?10:5)); ctx.lineTo(xp, rulerY); ctx.stroke();
    if (maj) {
      ctx.fillStyle = off === 0 ? '#0050c8' : '#333';
      ctx.font = (off === 0 ? 'bold ' : '') + `${fSM}px Arial`; ctx.textAlign = 'center';
      ctx.fillText((off === 0 ? '0' : (off > 0 ? `+${off}` : `${off}`))+'"', xp, rulerY-13);
    }
  }
  ctx.fillStyle = '#444'; ctx.font = `bold ${fMD}px Arial`; ctx.textAlign = 'center';
  ctx.fillText(`INTERIOR WIDTH  ${REFS.vw}"`, ox+iw/2, rulerY-28);

  // ── 15. Length ruler ───────────────────────────────────────────────────────
  for (let lr = 0; lr <= REFS.vl; lr += 24) {
    const yp = oy+px(lr);
    ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(ox-12, yp); ctx.lineTo(ox, yp); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = `${fSM}px Arial`; ctx.textAlign = 'right';
    ctx.fillText(`${lr}"`, ox-15, yp+4);
  }
  ctx.save(); ctx.fillStyle = '#444'; ctx.font = `bold ${fMD}px Arial`;
  ctx.translate(ox-48, oy+il/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center';
  ctx.fillText(`LENGTH  ${REFS.vl}"  (from bulkhead)`, 0, 0); ctx.restore();

  // ── 16. Side labels ────────────────────────────────────────────────────────
  ctx.save(); ctx.fillStyle = '#444'; ctx.font = `bold ${fMD}px Arial`;
  ctx.translate(bx-BUMP-10, oy+il/2); ctx.rotate(-Math.PI/2); ctx.textAlign = 'center';
  ctx.fillText('DRIVER SIDE', 0, 0); ctx.restore();
  ctx.save(); ctx.fillStyle = '#444'; ctx.font = `bold ${fMD}px Arial`;
  ctx.translate(bx+bw+BUMP+10, oy+il/2); ctx.rotate(Math.PI/2); ctx.textAlign = 'center';
  ctx.fillText('PASSENGER SIDE', 0, 0); ctx.restore();

  // ── 17. Dimension arrows ───────────────────────────────────────────────────
  const arWY = oy - 50;
  ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1.2; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(ox, arWY); ctx.lineTo(ox+iw, arWY); ctx.stroke();
  [[ox,-1],[ox+iw,1]].forEach(([p, d]) => {
    ctx.beginPath(); ctx.moveTo(p as number, arWY); ctx.lineTo((p as number)+(d as number)*7, arWY-3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p as number, arWY); ctx.lineTo((p as number)+(d as number)*7, arWY+3); ctx.stroke();
  });
  ctx.fillStyle = '#fff'; ctx.fillRect(ox+iw/2-22, arWY-8, 44, 13);
  ctx.fillStyle = '#1a1a2e'; ctx.font = `bold ${fMD}px Arial`; ctx.textAlign = 'center';
  ctx.fillText(`${REFS.vw}"`, ox+iw/2, arWY+3);

  // ── 19. Title & scale ──────────────────────────────────────────────────────
  const legY = oy+il+WE+54;
  ctx.fillStyle = '#1a1a2e'; ctx.font = `bold ${fLG}px Arial`; ctx.textAlign = 'center';
  ctx.fillText(`${REFS.label}  —  Base Plan View`, ox+iw/2, legY);
  ctx.fillStyle = '#888'; ctx.font = `${fXS}px Arial`;
  ctx.fillText(`1 sq = 1"  ·  Scale ${S}px/in  ·  Source: upfitsupply.com`, ox+iw/2, legY+16);
}
