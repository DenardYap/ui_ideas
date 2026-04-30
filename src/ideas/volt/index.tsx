import { useEffect, useRef } from 'react';
import {
  buildShapes,
  shapeCentroid,
  TAU,
  tracePath,
  type Shape,
} from '../_shared/shapes';

/* ──────────────────────────────────────────────────────────────────────────
   Volt — the same composition as Pyre, electrified.
   The cursor is a charged probe: arcs leap from it to the nearest conductor.
   Click triggers a fork-bolt strike from the storm above. Each shape stores
   charge for a moment after being hit, glowing blue-white.
   ────────────────────────────────────────────────────────────────────────── */

type Pt = { x: number; y: number };

type Bolt = {
  active: boolean;
  points: Pt[];
  branches: Pt[][];
  age: number;
  life: number;
  thickness: number;
  intensity: number; // 0..1
};

const BOLT_POOL = 24;

/** Recursive midpoint-displacement fractal lightning. */
function fractalBolt(
  out: Pt[],
  p1: Pt, p2: Pt,
  displace: number,
  depth: number,
) {
  if (depth <= 0 || displace < 1) {
    out.push(p2);
    return;
  }
  const mx = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * displace;
  const my = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * displace;
  const mid = { x: mx, y: my };
  fractalBolt(out, p1, mid, displace * 0.55, depth - 1);
  fractalBolt(out, mid, p2, displace * 0.55, depth - 1);
}

function buildBolt(p1: Pt, p2: Pt, displace: number, depth: number): Pt[] {
  const pts: Pt[] = [p1];
  fractalBolt(pts, p1, p2, displace, depth);
  return pts;
}

function buildBranches(spine: Pt[], chance: number, depth: number): Pt[][] {
  const branches: Pt[][] = [];
  for (let i = 1; i < spine.length - 1; i++) {
    if (Math.random() > chance) continue;
    const a = spine[i - 1], b = spine[i + 1];
    // Branch direction roughly perpendicular to spine
    const tx = b.x - a.x, ty = b.y - a.y;
    const m = Math.sqrt(tx * tx + ty * ty) || 1;
    const nx = -ty / m, ny = tx / m;
    const len = (40 + Math.random() * 90);
    const sign = Math.random() < 0.5 ? -1 : 1;
    const end = {
      x: spine[i].x + nx * len * sign + (Math.random() - 0.5) * 30,
      y: spine[i].y + ny * len * sign + (Math.random() - 0.5) * 30,
    };
    branches.push(buildBolt(spine[i], end, len * 0.4, depth));
  }
  return branches;
}

function strokePolyline(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  color: string,
  width: number,
) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

export default function Volt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    let shapes: Shape[] = [];
    /** Per-shape charge (0..1) decays slowly. */
    const charge = new Map<number, number>();
    /** Cloud noise field, scrolled over time for storm motion. */
    let cloudOffset = 0;

    const bolts: Bolt[] = Array.from({ length: BOLT_POOL }, () => ({
      active: false, points: [], branches: [], age: 0, life: 0, thickness: 1, intensity: 0,
    }));
    let bIdx = 0;
    function spawnBolt() {
      for (let i = 0; i < 4; i++) {
        const b = bolts[(bIdx + i) % BOLT_POOL];
        if (!b.active) { bIdx = (bIdx + i + 1) % BOLT_POOL; return b; }
      }
      const b = bolts[bIdx];
      bIdx = (bIdx + 1) % BOLT_POOL;
      return b;
    }

    function emitBolt(p1: Pt, p2: Pt, opts: {
      displace?: number; depth?: number; life?: number;
      thickness?: number; intensity?: number; branchChance?: number;
    } = {}) {
      const b = spawnBolt();
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const displace = opts.displace ?? Math.max(20, dist * 0.18);
      const depth = opts.depth ?? 6;
      b.active = true;
      b.points = buildBolt(p1, p2, displace, depth);
      b.branches = buildBranches(b.points, opts.branchChance ?? 0.25, Math.max(2, depth - 2));
      b.age = 0;
      b.life = opts.life ?? 16;
      b.thickness = opts.thickness ?? 1.6;
      b.intensity = opts.intensity ?? 1;
    }

    const cursor = {
      x: -9999, y: -9999,
      inside: false,
      cooldown: 0,
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
      for (const s of shapes) charge.set(s.id, 0);
    }

    function nearestShape(x: number, y: number): Shape | null {
      let best: Shape | null = null;
      let bestD = Infinity;
      for (const s of shapes) {
        const c = shapeCentroid(s);
        const d = (c.x - x) ** 2 + (c.y - y) ** 2;
        if (d < bestD) { bestD = d; best = s; }
      }
      return best;
    }

    function shapesByDistance(p: Pt): Shape[] {
      return shapes.slice().sort((a, b) => {
        const ca = shapeCentroid(a), cb = shapeCentroid(b);
        const da = (ca.x - p.x) ** 2 + (ca.y - p.y) ** 2;
        const db = (cb.x - p.x) ** 2 + (cb.y - p.y) ** 2;
        return da - db;
      });
    }

    /* ─────────── tick ─────────── */

    function tick() {
      frame++;
      cloudOffset += 0.4;

      // Decay charges
      for (const [k, v] of charge) {
        const next = v * 0.94;
        charge.set(k, next < 0.02 ? 0 : next);
      }

      // Cursor probe — emits a small arc to nearest shape periodically
      cursor.cooldown -= 1;
      if (cursor.inside && cursor.cooldown <= 0) {
        const target = nearestShape(cursor.x, cursor.y);
        if (target) {
          const c = shapeCentroid(target);
          emitBolt({ x: cursor.x, y: cursor.y }, c, {
            displace: 26, depth: 5, life: 9,
            thickness: 1.2, intensity: 0.65, branchChance: 0.15,
          });
          charge.set(target.id, Math.min(1, (charge.get(target.id) ?? 0) + 0.45));
        }
        cursor.cooldown = 6 + Math.floor(Math.random() * 8);
      }

      // Ambient distant flickers
      if (Math.random() < 0.012) {
        const p = shapes[Math.floor(Math.random() * shapes.length)];
        const c = shapeCentroid(p);
        const start = { x: Math.random() * W, y: -10 };
        emitBolt(start, c, {
          displace: 80, depth: 6, life: 14,
          thickness: 1.4, intensity: 0.85, branchChance: 0.3,
        });
        charge.set(p.id, 1);
      }

      // Update bolts
      for (let i = 0; i < BOLT_POOL; i++) {
        const b = bolts[i];
        if (!b.active) continue;
        b.age++;
        if (b.age >= b.life) b.active = false;
      }

      /* ─────────── render ─────────── */
      // Stormy gradient base
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0a0814');
      sky.addColorStop(0.5, '#0d0a1a');
      sky.addColorStop(1, '#050308');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Soft moving "clouds" — overlapping radial blobs scrolled across.
      ctx.globalCompositeOperation = 'lighter';
      const blobs = 7;
      for (let i = 0; i < blobs; i++) {
        const seed = i * 137.13;
        const cx = ((seed + cloudOffset * (0.6 + i * 0.1)) % (W + 400)) - 200;
        const cy = (Math.sin(seed * 0.41 + frame * 0.005) * 0.25 + 0.35) * H;
        const r = 220 + (i % 3) * 90;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(80, 60, 130, 0.18)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';

      // Conductors — dark inset bodies with a subtle violet rim
      for (const s of shapes) {
        ctx.fillStyle = '#0c0a14';
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.fill('evenodd');
        else ctx.fill();
      }
      ctx.strokeStyle = 'rgba(180, 170, 230, 0.18)';
      ctx.lineWidth = 1;
      for (const s of shapes) {
        tracePath(ctx, s);
        ctx.stroke();
      }

      // Charged shapes: bloom of plasma inside
      for (const s of shapes) {
        const ch = charge.get(s.id) ?? 0;
        if (ch < 0.05) continue;
        const c = shapeCentroid(s);
        ctx.save();
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.clip('evenodd');
        else ctx.clip();
        const radius = 80 + 220 * ch;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
        g.addColorStop(0, `rgba(220, 230, 255, ${0.95 * ch})`);
        g.addColorStop(0.25, `rgba(140, 170, 255, ${0.7 * ch})`);
        g.addColorStop(0.6, `rgba(80, 60, 220, ${0.4 * ch})`);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Outer halo for charged shapes (drawn outside the clip)
      ctx.globalCompositeOperation = 'lighter';
      for (const s of shapes) {
        const ch = charge.get(s.id) ?? 0;
        if (ch < 0.05) continue;
        const c = shapeCentroid(s);
        const r = 60 + 120 * ch;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
        g.addColorStop(0, `rgba(120, 140, 255, ${0.35 * ch})`);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Bolts — three glow passes (wide soft, medium, white core), all additive
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < BOLT_POOL; i++) {
        const b = bolts[i];
        if (!b.active) continue;
        const ageT = b.age / b.life;
        const flicker = 0.6 + Math.sin(b.age * 1.7) * 0.4;
        const fade = (1 - ageT) * b.intensity * flicker;
        if (fade < 0.05) continue;

        // Wide outer glow
        strokePolyline(ctx, b.points,
          `rgba(120, 140, 255, ${0.25 * fade})`, b.thickness * 14);
        for (const br of b.branches) {
          strokePolyline(ctx, br, `rgba(120, 140, 255, ${0.18 * fade})`, b.thickness * 10);
        }

        // Mid glow
        strokePolyline(ctx, b.points,
          `rgba(180, 200, 255, ${0.55 * fade})`, b.thickness * 4);
        for (const br of b.branches) {
          strokePolyline(ctx, br, `rgba(180, 200, 255, ${0.4 * fade})`, b.thickness * 3);
        }

        // White-hot core
        strokePolyline(ctx, b.points,
          `rgba(245, 250, 255, ${0.95 * fade})`, b.thickness);
        for (const br of b.branches) {
          strokePolyline(ctx, br, `rgba(240, 245, 255, ${0.8 * fade})`, b.thickness * 0.8);
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Cursor probe — a tiny crackling glyph
      if (cursor.inside) {
        const r = 8 + Math.sin(frame * 0.4) * 1.5;
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 40);
        g.addColorStop(0, 'rgba(180, 200, 255, 0.55)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 40, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(245, 250, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, r * 0.4, 0, TAU);
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

      // Strike from the storm above down to the click point
      const start: Pt = { x: x + (Math.random() - 0.5) * 200, y: -20 };
      const target: Pt = { x, y };
      emitBolt(start, target, {
        displace: 180, depth: 7, life: 22,
        thickness: 2.6, intensity: 1, branchChance: 0.55,
      });

      // Chain to the nearest few shapes — a multi-step arc
      const ordered = shapesByDistance(target).slice(0, 4);
      let prev = target;
      for (const s of ordered) {
        const c = shapeCentroid(s);
        emitBolt(prev, c, {
          displace: 60, depth: 6, life: 18,
          thickness: 1.8, intensity: 0.95, branchChance: 0.35,
        });
        charge.set(s.id, 1);
        prev = c;
      }

      // Quick crackle outward — a few rays from impact
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * TAU;
        const len = 80 + Math.random() * 120;
        emitBolt(target, {
          x: target.x + Math.cos(a) * len,
          y: target.y + Math.sin(a) * len,
        }, {
          displace: 22, depth: 4, life: 10,
          thickness: 1.1, intensity: 0.7, branchChance: 0.15,
        });
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
      className="relative h-full w-full cursor-crosshair overflow-hidden bg-[#050308] [font-family:'Inter_Tight',sans-serif]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="pointer-events-none absolute bottom-8 left-8 z-10 select-none">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.32em] text-violet-200/40">
          Volt · v0.1
        </div>
        <div className="mt-2 [font-family:'Fraunces',serif] text-[28px] font-light italic leading-tight text-violet-50/85">
          Glide to charge.
          <br />
          <span className="text-violet-200/55">Click to strike.</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-8 z-10 flex flex-col items-end gap-1 select-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-200/35">
          earth · arc · plasma
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0c0a14]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#5037b8]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#9eb1ff]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#f5faff]" />
        </div>
      </div>
    </div>
  );
}
