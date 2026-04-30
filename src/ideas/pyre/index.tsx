import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

/* ──────────────────────────────────────────────────────────────────────────
   Shapes — defined proportionally so the composition holds at any size.
   ────────────────────────────────────────────────────────────────────────── */

type Shape =
  | { id: number; kind: 'rect'; x: number; y: number; w: number; h: number }
  | { id: number; kind: 'circle'; cx: number; cy: number; r: number }
  | {
      id: number;
      kind: 'ring';
      cx: number;
      cy: number;
      r: number;
      thickness: number;
    }
  | {
      id: number;
      kind: 'triangle';
      ax: number; ay: number;
      bx: number; by: number;
      cx: number; cy: number;
    };

function buildShapes(W: number, H: number): Shape[] {
  const u = Math.min(W, H);
  return [
    // big square, lower-left
    { id: 0, kind: 'rect', x: W * 0.05, y: H * 0.34, w: u * 0.26, h: u * 0.26 },
    // small filled circle, upper-mid
    { id: 1, kind: 'circle', cx: W * 0.4, cy: H * 0.22, r: u * 0.07 },
    // big triangle, center
    {
      id: 2,
      kind: 'triangle',
      ax: W * 0.36, ay: H * 0.42,
      bx: W * 0.66, by: H * 0.42,
      cx: W * 0.5,  cy: H * 0.94,
    },
    // hollow ring, right
    {
      id: 3,
      kind: 'ring',
      cx: W * 0.8,
      cy: H * 0.55,
      r: u * 0.24,
      thickness: u * 0.04,
    },
    // small filled dot inside the ring
    { id: 4, kind: 'circle', cx: W * 0.8, cy: H * 0.55, r: u * 0.075 },
    // small accent square, lower
    { id: 5, kind: 'rect', x: W * 0.18, y: H * 0.78, w: u * 0.11, h: u * 0.11 },
    // tiny pip near top right
    { id: 6, kind: 'circle', cx: W * 0.92, cy: H * 0.18, r: u * 0.025 },
  ];
}

/* ──────────────────────────────────────────────────────────────────────────
   Geometry helpers
   ────────────────────────────────────────────────────────────────────────── */

function sign(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}

function pointInTriangle(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
) {
  const d1 = sign(px, py, ax, ay, bx, by);
  const d2 = sign(px, py, bx, by, cx, cy);
  const d3 = sign(px, py, cx, cy, ax, ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function hitShape(s: Shape, x: number, y: number, pad = 8): boolean {
  switch (s.kind) {
    case 'rect':
      return x >= s.x - pad && x <= s.x + s.w + pad && y >= s.y - pad && y <= s.y + s.h + pad;
    case 'circle': {
      const dx = x - s.cx, dy = y - s.cy;
      return dx * dx + dy * dy <= (s.r + pad) * (s.r + pad);
    }
    case 'ring': {
      const dx = x - s.cx, dy = y - s.cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      return Math.abs(d - s.r) <= s.thickness / 2 + pad;
    }
    case 'triangle':
      return pointInTriangle(x, y, s.ax, s.ay, s.bx, s.by, s.cx, s.cy);
  }
}

function shapeCentroid(s: Shape): { x: number; y: number } {
  switch (s.kind) {
    case 'rect':     return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
    case 'circle':
    case 'ring':     return { x: s.cx, y: s.cy };
    case 'triangle': return {
      x: (s.ax + s.bx + s.cx) / 3,
      y: (s.ay + s.by + s.cy) / 3,
    };
  }
}

function tracePath(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.beginPath();
  switch (s.kind) {
    case 'rect':
      ctx.rect(s.x, s.y, s.w, s.h);
      break;
    case 'circle':
      ctx.arc(s.cx, s.cy, s.r, 0, TAU);
      break;
    case 'ring':
      ctx.arc(s.cx, s.cy, s.r + s.thickness / 2, 0, TAU);
      ctx.arc(s.cx, s.cy, s.r - s.thickness / 2, 0, TAU, true);
      break;
    case 'triangle':
      ctx.moveTo(s.ax, s.ay);
      ctx.lineTo(s.bx, s.by);
      ctx.lineTo(s.cx, s.cy);
      ctx.closePath();
      break;
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Simulation
   ────────────────────────────────────────────────────────────────────────── */

type Particle = {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  maxLife: number;
  size: number;
};

const POOL = 900;

export default function Pyre() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let shapes: Shape[] = [];

    type Heat = { val: number; gx: number; gy: number };
    const heat = new Map<number, Heat>();

    const particles: Particle[] = Array.from({ length: POOL }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0,
    }));
    let pIdx = 0;
    function spawn(): Particle {
      // Try to find an inactive slot near the cursor index; otherwise overwrite.
      for (let i = 0; i < 32; i++) {
        const p = particles[(pIdx + i) % POOL];
        if (!p.active) {
          pIdx = (pIdx + i + 1) % POOL;
          return p;
        }
      }
      const p = particles[pIdx];
      pIdx = (pIdx + 1) % POOL;
      return p;
    }

    function emitEmber(
      x: number, y: number,
      opts?: { speed?: number; life?: number; size?: number; angle?: number; spread?: number },
    ) {
      const p = spawn();
      const speed = opts?.speed ?? 0.4 + Math.random() * 1.0;
      const angle = (opts?.angle ?? -Math.PI / 2) + (Math.random() - 0.5) * (opts?.spread ?? Math.PI / 1.5);
      p.active = true;
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.maxLife = opts?.life ?? 60 + Math.random() * 70;
      p.life = p.maxLife;
      p.size = opts?.size ?? 1 + Math.random() * 2;
    }

    const cursor = {
      x: -9999, y: -9999,
      lastX: -9999, lastY: -9999,
      vx: 0, vy: 0,
      inside: false,
    };

    let frame = 0;
    let raf = 0;

    function resize() {
      // Use layout size (clientWidth/Height) rather than getBoundingClientRect so
      // we ignore any ancestor CSS transform (e.g. the IdeaPreview down-scale).
      W = container.clientWidth;
      H = container.clientHeight;
      if (W === 0 || H === 0) return;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      shapes = buildShapes(W, H);
      // Reset heat positions to centroids so first glow isn't at (0,0).
      for (const s of shapes) {
        const c = shapeCentroid(s);
        heat.set(s.id, { val: 0.04, gx: c.x, gy: c.y });
      }
    }

    function tick() {
      frame++;

      /* cursor velocity */
      cursor.vx = cursor.x - cursor.lastX;
      cursor.vy = cursor.y - cursor.lastY;
      cursor.lastX = cursor.x;
      cursor.lastY = cursor.y;
      const cursorSpeed = Math.sqrt(cursor.vx * cursor.vx + cursor.vy * cursor.vy);

      /* heat shapes from cursor + decay */
      for (const s of shapes) {
        const h = heat.get(s.id)!;
        h.val *= 0.978;
        // pilot light flicker so shapes are never fully cold
        const pilot = 0.045 + Math.sin(frame * 0.018 + s.id * 7.3) * 0.025;
        if (h.val < pilot) h.val = pilot;

        if (cursor.inside && hitShape(s, cursor.x, cursor.y, 6)) {
          const add = Math.min(0.04 + cursorSpeed * 0.006, 0.15);
          h.val = Math.min(1, h.val + add);
          // glow point eases toward cursor
          h.gx += (cursor.x - h.gx) * 0.35;
          h.gy += (cursor.y - h.gy) * 0.35;
        }
      }

      /* spontaneous combustion for ambient life when no cursor */
      if (!cursor.inside && Math.random() < 0.006) {
        const s = shapes[Math.floor(Math.random() * shapes.length)];
        const h = heat.get(s.id)!;
        const c = shapeCentroid(s);
        h.val = Math.min(1, h.val + 0.35);
        h.gx = c.x + (Math.random() - 0.5) * 60;
        h.gy = c.y + (Math.random() - 0.5) * 60;
      }

      /* emit embers from heated shapes */
      for (const s of shapes) {
        const h = heat.get(s.id)!;
        if (h.val < 0.12) continue;
        const rate = Math.floor(h.val * h.val * 9);
        for (let i = 0; i < rate; i++) {
          emitEmber(
            h.gx + (Math.random() - 0.5) * 24,
            h.gy + (Math.random() - 0.5) * 8,
            {
              speed: 0.5 + Math.random() * 1.6 * h.val,
              life: 50 + Math.random() * 80 * h.val,
              size: 1 + Math.random() * 2,
              spread: Math.PI / 1.6,
            },
          );
        }
      }

      /* ambient embers from below */
      const ambient = 0.7 + Math.sin(frame * 0.04) * 0.2;
      for (let i = 0; i < ambient; i++) {
        if (Math.random() < ambient) {
          emitEmber(Math.random() * W, H + 8, {
            speed: 0.3 + Math.random() * 0.9,
            life: 120 + Math.random() * 100,
            size: 0.5 + Math.random() * 1.4,
            spread: 0.7,
          });
        }
      }

      /* cursor smoke trail when moving fast */
      if (cursor.inside && cursorSpeed > 1.5) {
        const n = Math.min(Math.floor(cursorSpeed / 3), 5);
        for (let i = 0; i < n; i++) {
          emitEmber(
            cursor.x + (Math.random() - 0.5) * 10,
            cursor.y + (Math.random() - 0.5) * 10,
            {
              speed: 0.3 + Math.random() * 0.9,
              life: 35 + Math.random() * 35,
              size: 0.8 + Math.random() * 1.6,
              spread: TAU,
            },
          );
        }
      }

      /* update particles */
      for (let i = 0; i < POOL; i++) {
        const p = particles[i];
        if (!p.active) continue;
        const t = p.life / p.maxLife;
        p.vy -= 0.045 * t;          // buoyancy stronger when hot
        p.vy *= 0.99;
        p.vx += Math.sin(frame * 0.03 + p.y * 0.012) * 0.06;
        p.vx *= 0.965;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0 || p.y < -30 || p.x < -30 || p.x > W + 30) {
          p.active = false;
        }
      }

      /* ─────────── render ─────────── */
      ctx.globalCompositeOperation = 'source-over';

      // Base
      ctx.fillStyle = '#070504';
      ctx.fillRect(0, 0, W, H);

      // Floor warmth glow
      const floor = ctx.createRadialGradient(
        W * 0.5, H * 1.05, 0,
        W * 0.5, H * 1.05, Math.max(W, H) * 0.75,
      );
      floor.addColorStop(0, 'rgba(255, 90, 20, 0.12)');
      floor.addColorStop(0.5, 'rgba(180, 40, 5, 0.05)');
      floor.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floor;
      ctx.fillRect(0, 0, W, H);

      // Cold shape bodies
      ctx.fillStyle = '#161210';
      for (const s of shapes) {
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.fill('evenodd');
        else ctx.fill();
      }

      // Heat glow inside each shape (clipped to its path)
      for (const s of shapes) {
        const h = heat.get(s.id)!;
        if (h.val < 0.08) continue;
        ctx.save();
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.clip('evenodd');
        else ctx.clip();
        const radius = 60 + 320 * h.val;
        const g = ctx.createRadialGradient(h.gx, h.gy, 0, h.gx, h.gy, radius);
        g.addColorStop(0,    `rgba(255, 245, 200, ${0.95 * h.val})`);
        g.addColorStop(0.18, `rgba(255, 160, 50,  ${0.75 * h.val})`);
        g.addColorStop(0.45, `rgba(220, 60, 10,   ${0.45 * h.val})`);
        g.addColorStop(0.75, `rgba(80, 15, 0,     ${0.25 * h.val})`);
        g.addColorStop(1,    'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Subtle hairline outlines so cold shapes still read against pure black
      ctx.strokeStyle = 'rgba(255, 110, 40, 0.08)';
      ctx.lineWidth = 1;
      for (const s of shapes) {
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.stroke();
        else ctx.stroke();
      }

      // Embers (additive)
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < POOL; i++) {
        const p = particles[i];
        if (!p.active) continue;
        const t = p.life / p.maxLife;
        const r = p.size * (0.35 + t * 0.65) * 1.6;
        let col: string;
        if (t > 0.85)      col = `rgba(255, 250, 220, ${t * 0.85})`;
        else if (t > 0.6)  col = `rgba(255, 200, 100, ${t * 0.75})`;
        else if (t > 0.3)  col = `rgba(255, 100, 30,  ${t * 0.65})`;
        else               col = `rgba(140, 30, 5,    ${t * 0.45})`;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Cursor halo
      if (cursor.inside) {
        const grad = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 80);
        grad.addColorStop(0, 'rgba(255, 200, 120, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 80, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      raf = requestAnimationFrame(tick);
    }

    /* ─────────── interaction ─────────── */

    function onMove(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
      if (!cursor.inside) {
        cursor.lastX = cursor.x;
        cursor.lastY = cursor.y;
      }
      cursor.inside = true;
    }
    function onLeave() {
      cursor.inside = false;
      cursor.x = -9999;
      cursor.y = -9999;
    }
    function onDown(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      // Big upward burst
      const n = 140;
      for (let i = 0; i < n; i++) {
        emitEmber(x, y, {
          speed: 1 + Math.random() * 4.5,
          life: 70 + Math.random() * 110,
          size: 1.5 + Math.random() * 3,
          spread: Math.PI * 1.2,
        });
      }
      // Outward shockwave ring
      for (let i = 0; i < 50; i++) {
        const a = Math.random() * TAU;
        emitEmber(x, y, {
          speed: 2 + Math.random() * 2,
          life: 30 + Math.random() * 30,
          size: 1 + Math.random() * 1.5,
          angle: a,
          spread: 0.05,
        });
      }
      // Slam heat on any hit shape
      for (const s of shapes) {
        if (hitShape(s, x, y, 0)) {
          const h = heat.get(s.id)!;
          h.val = 1;
          h.gx = x;
          h.gy = y;
        }
      }
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
      className="relative h-full w-full cursor-crosshair overflow-hidden bg-[#070504] [font-family:'Inter_Tight',sans-serif]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {/* HUD — bottom-left, low contrast */}
      <div className="pointer-events-none absolute bottom-8 left-8 z-10 select-none">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.32em] text-orange-200/35">
          Pyre · v0.1
        </div>
        <div className="mt-2 [font-family:'Fraunces',serif] text-[28px] font-light italic leading-tight text-orange-50/75">
          Wave to fan.
          <br />
          <span className="text-orange-200/50">Click to ignite.</span>
        </div>
      </div>

      {/* Bottom-right ember legend, low contrast */}
      <div className="pointer-events-none absolute bottom-8 right-8 z-10 flex flex-col items-end gap-1 select-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-orange-200/30">
          coal · ember · flame
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3a1a0a]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#aa3408]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a2a]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffe9b8]" />
        </div>
      </div>
    </div>
  );
}
