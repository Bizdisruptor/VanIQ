import { useEffect, useRef, useState } from 'react';
import { drawPlanView, getPlanDimensions } from '../../features/blueprints/drawPlanView';

export function BlueprintCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = getPlanDimensions(scale);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    drawPlanView(ctx, scale);
  }, [scale]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1c2e' }}>
      {/* Legend + scale bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'nowrap',
        padding: '5px 14px', background: '#161728', borderBottom: '1px solid #2a2d45',
        flexShrink: 0, fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#8890b0',
        overflowX: 'auto',
      }}>
        <span style={{ color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Ford Transit 148 HR</span>
        <span style={{ color: '#444' }}>|</span>
        <span style={{ whiteSpace: 'nowrap' }}>▨ Wheel well</span>
        <span style={{ color: '#00a651', whiteSpace: 'nowrap' }}>━ Slide door</span>
        <span style={{ color: 'rgba(200,60,60,0.9)', whiteSpace: 'nowrap' }}>─ ─ Partition</span>
        <span style={{ color: 'rgba(70,120,220,0.9)', whiteSpace: 'nowrap' }}>── Floor ribs</span>
        <span style={{ color: '#4a8fd5', whiteSpace: 'nowrap' }}>H1/H2/H3 heights</span>
        <span style={{ color: '#444', marginLeft: 'auto' }}>|</span>
        <span style={{ whiteSpace: 'nowrap' }}>Scale:</span>
        {[2, 3, 4, 5, 6].map(s => (
          <button key={s} onClick={() => setScale(s)} style={{
            background: scale === s ? '#f0a500' : '#2a2d45',
            color: scale === s ? '#000' : '#aaa',
            border: 'none', borderRadius: 3, padding: '2px 8px',
            cursor: 'pointer', fontFamily: "'Space Mono',monospace",
            fontSize: 10, fontWeight: scale === s ? 'bold' : 'normal',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{s}px/in</button>
        ))}
      </div>
      {/* Scrollable canvas */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <canvas ref={canvasRef} style={{ display: 'block', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', borderRadius: 4 }} />
      </div>
    </div>
  );
}
