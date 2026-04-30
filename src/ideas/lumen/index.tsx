import { useEffect, useRef } from 'react';
import {
  buildShapes,
  shapeCentroid,
  shapeVertices,
  TAU,
  tracePath,
  type Shape,
} from '../_shared/shapes';

/* ──────────────────────────────────────────────────────────────────────────
   Lumen — the same composition as Pyre, lit from a single moving lamp.
   Cursor is a warm light source. Shapes throw 2D shadows.
   ────────────────────────────────────────────────────────────────────────── */

type Mote = {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
};

type Pulse = {
  active: boolean;
  x: number; y: number;
  age: number; life: number;
};

const MOTE_POOL = 80;
const PULSE_POOL = 8;

/** Project a point away from a light source by a fixed far distance. */
function project(lx: number, ly: number, px: number, py: number, far: number) {
  const dx = px - lx, dy = py - ly;
  const m = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: px + (dx / m) * far, y: py + (dy / m) * far };
}

/**
 * For polygons (rect, triangle): pick the two silhouette vertices —
 * the leftmost and rightmost in angular terms relative to the light.
 */
function polygonSilhouette(
  light: { x: number; y: number },
  verts: Array<{ x: number; y: number }>,
) {
  let minA = Infinity, maxA = -Infinity;
  let minV = verts[0], maxV = verts[0];
  // Pick a reference angle and unwrap so we don't get +π / −π flips.
  const ref = Math.atan2(verts[0].y - light.y, verts[0].x - light.x);
  for (const v of verts) {
    let a = Math.atan2(v.y - light.y, v.x - light.x) - ref;
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    if (a < minA) { minA = a; minV = v; }
    if (a > maxA) { maxA = a; maxV = v; }
  }
  return { left: minV, right: maxV };
}

function castShadow(
  ctx: CanvasRenderingContext2D,
  light: { x: number; y: number },
  shape: Shape,
  far: number,
) {
  if (shape.kind === 'circle' || shape.kind === 'ring') {
    const cx = shape.cx, cy = shape.cy;
    const r = shape.kind === 'ring' ? shape.r + shape.thickness / 2 : shape.r;
    const dx = cx - light.x, dy = cy - light.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d <= r) return; // light is inside — no shadow polygon
    const ang = Math.atan2(dy, dx);
    const tangent = Math.acos(r / d);
    const t1 = { x: cx + r * Math.cos(ang + Math.PI / 2 + tangent),
                 y: cy + r * Math.sin(ang + Math.PI / 2 + tangent) };
    const t2 = { x: cx + r * Math.cos(ang - Math.PI / 2 - tangent),
                 y: cy + r * Math.sin(ang - Math.PI / 2 - tangent) };
    const p1 = project(light.x, light.y, t1.x, t1.y, far);
    const p2 = project(light.x, light.y, t2.x, t2.y, far);
    ctx.beginPath();
    ctx.moveTo(t1.x, t1.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(t2.x, t2.y);
    // include the back of the circle so the shadow body isn't hollow
    const backAng1 = Math.atan2(t2.y - cy, t2.x - cx);
    const backAng2 = Math.atan2(t1.y - cy, t1.x - cx);
    ctx.arc(cx, cy, r, backAng1, backAng2, false);
    ctx.closePath();
    ctx.fill();
    return;
  }

  const verts = shapeVertices(shape);
  if (verts.length === 0) return;
  const { left, right } = polygonSilhouette(light, verts);
  const pL = project(light.x, light.y, left.x, left.y, far);
  const pR = project(light.x, light.y, right.x, right.y, far);
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(pL.x, pL.y);
  ctx.lineTo(pR.x, pR.y);
  ctx.lineTo(right.x, right.y);
  // Connect through the polygon's far side so the body is filled too
  // (handles non-convex viewing without ugly gaps)
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.fill();
}

export default function Lumen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let shapes: Shape[] = [];

    const motes: Mote[] = Array.from({ length: MOTE_POOL }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0,
    }));
    let mIdx = 0;
    function emitMote(x: number, y: number) {
      const m = motes[mIdx];
      mIdx = (mIdx + 1) % MOTE_POOL;
      m.active = true;
      m.x = x + (Math.random() - 0.5) * 60;
      m.y = y + (Math.random() - 0.5) * 60;
      const a = Math.random() * TAU;
      const sp = 0.05 + Math.random() * 0.15;
      m.vx = Math.cos(a) * sp;
      m.vy = Math.sin(a) * sp - 0.06;
      m.maxLife = 220 + Math.random() * 200;
      m.life = m.maxLife;
      m.size = 0.6 + Math.random() * 1.4;
    }

    const pulses: Pulse[] = Array.from({ length: PULSE_POOL }, () => ({
      active: false, x: 0, y: 0, age: 0, life: 0,
    }));
    let pIdx = 0;
    function emitPulse(x: number, y: number) {
      const p = pulses[pIdx];
      pIdx = (pIdx + 1) % PULSE_POOL;
      p.active = true;
      p.x = x; p.y = y;
      p.age = 0; p.life = 70;
    }

    /** When inactive, the lamp drifts gently across the scene. */
    const lamp = {
      x: 0, y: 0,
      tx: 0, ty: 0,
      inside: false,
      intensity: 1, // animated for click pulse feedback
    };
    let frame = 0;
    let raf = 0;

    function resize() {
      W = container.clientWidth;
      H = container.clientHeight;
      if (W === 0 || H === 0) return;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      shapes = buildShapes(W, H);
      if (lamp.x === 0 && lamp.y === 0) {
        lamp.x = W * 0.5; lamp.y = H * 0.4;
        lamp.tx = lamp.x; lamp.ty = lamp.y;
      }
    }

    function tick() {
      frame++;

      /* If the user isn't holding the lamp, it wanders softly. */
      if (!lamp.inside) {
        if (Math.random() < 0.012) {
          lamp.tx = W * (0.15 + Math.random() * 0.7);
          lamp.ty = H * (0.15 + Math.random() * 0.55);
        }
        lamp.x += (lamp.tx - lamp.x) * 0.012;
        lamp.y += (lamp.ty - lamp.y) * 0.012;
      }

      /* Click intensity pulse decays back to 1 */
      lamp.intensity += (1 - lamp.intensity) * 0.06;

      /* Emit ambient dust motes drifting through the light cone */
      if (Math.random() < 0.3) emitMote(lamp.x, lamp.y);

      /* Update motes */
      for (let i = 0; i < MOTE_POOL; i++) {
        const m = motes[i];
        if (!m.active) continue;
        m.x += m.vx;
        m.y += m.vy;
        m.vy -= 0.001;
        m.life -= 1;
        if (m.life <= 0) m.active = false;
      }

      /* Update pulses */
      for (let i = 0; i < PULSE_POOL; i++) {
        const p = pulses[i];
        if (!p.active) continue;
        p.age++;
        if (p.age >= p.life) p.active = false;
      }

      /* ─────────── render ─────────── */
      const far = Math.hypot(W, H) * 1.6;

      // Base — a deep blue-black room (cool ambient)
      const amb = ctx.createLinearGradient(0, 0, 0, H);
      amb.addColorStop(0, '#0a0d14');
      amb.addColorStop(1, '#04060a');
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, W, H);

      // Subtle vertical grain so flat areas feel like a wall, not a void
      ctx.globalAlpha = 0.04;
      for (let y = 0; y < H; y += 4) {
        ctx.fillStyle = (y / 4) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(0, y, W, 1);
      }
      ctx.globalAlpha = 1;

      // 1. Lay down the light field as a warm radial gradient
      const lightR = Math.max(W, H) * 0.95 * lamp.intensity;
      ctx.globalCompositeOperation = 'lighter';
      const lightGrad = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, lightR);
      lightGrad.addColorStop(0,    `rgba(255, 230, 170, ${0.95 * lamp.intensity})`);
      lightGrad.addColorStop(0.18, `rgba(255, 200, 120, ${0.55 * lamp.intensity})`);
      lightGrad.addColorStop(0.5,  'rgba(180, 110, 50, 0.18)');
      lightGrad.addColorStop(1,    'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';

      // Click pulses — propagating wavefront of brightness
      for (let i = 0; i < PULSE_POOL; i++) {
        const p = pulses[i];
        if (!p.active) continue;
        const ageT = p.age / p.life;
        const radius = ageT * Math.hypot(W, H) * 1.1;
        const fade = 1 - ageT;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255, 240, 200, ${0.6 * fade})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 200, 130, ${0.25 * fade})`;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, TAU);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }

      // 2. Carve shadows out of the light. Use destination-out to subtract.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      for (const s of shapes) castShadow(ctx, lamp, s, far);
      ctx.globalCompositeOperation = 'source-over';

      // 3. Draw shape bodies — solid, dark, with a thin lit rim toward the lamp
      for (const s of shapes) {
        // body
        ctx.fillStyle = '#13161c';
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.fill('evenodd');
        else ctx.fill();

        // facing rim — gradient from cursor direction
        const c = shapeCentroid(s);
        const dx = c.x - lamp.x, dy = c.y - lamp.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / d, ny = dy / d;
        // Gradient origin a bit toward lamp side of the shape
        const gx = c.x - nx * 60;
        const gy = c.y - ny * 60;
        const rim = ctx.createRadialGradient(gx, gy, 0, gx, gy, 200);
        rim.addColorStop(0, `rgba(255, 220, 160, ${Math.min(0.7, 220 / (d + 80))})`);
        rim.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.save();
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.clip('evenodd');
        else ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rim;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // outline (always faintly visible)
        ctx.strokeStyle = 'rgba(255, 220, 170, 0.18)';
        ctx.lineWidth = 1;
        tracePath(ctx, s);
        ctx.stroke();
      }

      // 4. Dust motes catching the light beam
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < MOTE_POOL; i++) {
        const m = motes[i];
        if (!m.active) continue;
        const dx = m.x - lamp.x, dy = m.y - lamp.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const beam = Math.max(0, 1 - d / (Math.max(W, H) * 0.55));
        const lifeT = m.life / m.maxLife;
        const alpha = beam * lifeT * 0.55;
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(255, 235, 190, ${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // 5. Lamp itself — a tiny incandescent bulb
      const halo = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 24 * lamp.intensity);
      halo.addColorStop(0, `rgba(255, 250, 220, ${1 * Math.min(lamp.intensity, 1.2)})`);
      halo.addColorStop(0.5, `rgba(255, 215, 140, ${0.55})`);
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 24 * lamp.intensity, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff5e0';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 2.5, 0, TAU);
      ctx.fill();

      raf = requestAnimationFrame(tick);
    }

    /* ─────────── interaction ─────────── */

    function onMove(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      lamp.x = e.clientX - r.left;
      lamp.y = e.clientY - r.top;
      lamp.inside = true;
    }
    function onLeave() {
      lamp.inside = false;
      lamp.tx = lamp.x;
      lamp.ty = lamp.y;
    }
    function onDown(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      lamp.x = x; lamp.y = y; lamp.inside = true;
      lamp.intensity = 2.4;
      emitPulse(x, y);
      // shower of motes from the flare
      for (let i = 0; i < 36; i++) emitMote(x, y);
    }

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('pointerdown', onDown);

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-crosshair overflow-hidden bg-[#04060a] [font-family:'Inter_Tight',sans-serif]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="pointer-events-none absolute bottom-8 left-8 z-10 select-none">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.32em] text-amber-100/35">
          Lumen · v0.1
        </div>
        <div className="mt-2 [font-family:'Fraunces',serif] text-[28px] font-light italic leading-tight text-amber-50/85">
          Move to cast.
          <br />
          <span className="text-amber-100/55">Click to flare.</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-8 z-10 flex flex-col items-end gap-1 select-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-100/30">
          shadow · rim · flare
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0a0d14]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#5b3c1a]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#f0b85c]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#fff5e0]" />
        </div>
      </div>
    </div>
  );
}
