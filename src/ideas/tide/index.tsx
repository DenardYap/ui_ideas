import { useEffect, useRef } from 'react';
import {
  buildShapes,
  hitShape,
  shapeBBox,
  shapeCentroid,
  TAU,
  tracePath,
  type Shape,
} from '../_shared/shapes';

/* ──────────────────────────────────────────────────────────────────────────
   Tide — the same composition as Pyre, but seen through water.
   Cursor disturbs the surface; click drops a stone.
   ────────────────────────────────────────────────────────────────────────── */

type Ripple = {
  active: boolean;
  x: number; y: number;
  age: number;       // frames
  life: number;      // total frames
  speed: number;     // pixels / frame
  amp: number;       // 0..1, fades over life
  /** how many trailing crests to draw behind the leading wave */
  crests: number;
};

type Droplet = {
  active: boolean;
  x: number; y: number;
  vx: number; vy: number;
  z: number;       // height above surface
  vz: number;      // upward velocity
  size: number;
  hue: number;     // 0..1 white→cyan
};

const RIPPLE_POOL = 60;
const DROPLET_POOL = 200;

export default function Tide() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let shapes: Shape[] = [];

    const ripples: Ripple[] = Array.from({ length: RIPPLE_POOL }, () => ({
      active: false, x: 0, y: 0, age: 0, life: 0, speed: 0, amp: 0, crests: 0,
    }));
    let rIdx = 0;
    function spawnRipple(): Ripple {
      for (let i = 0; i < 8; i++) {
        const r = ripples[(rIdx + i) % RIPPLE_POOL];
        if (!r.active) { rIdx = (rIdx + i + 1) % RIPPLE_POOL; return r; }
      }
      const r = ripples[rIdx];
      rIdx = (rIdx + 1) % RIPPLE_POOL;
      return r;
    }
    function emitRipple(x: number, y: number, opts: {
      life?: number; speed?: number; amp?: number; crests?: number;
    } = {}) {
      const r = spawnRipple();
      r.active = true;
      r.x = x; r.y = y; r.age = 0;
      r.life = opts.life ?? 110;
      r.speed = opts.speed ?? 1.7;
      r.amp = opts.amp ?? 0.5;
      r.crests = opts.crests ?? 2;
    }

    const droplets: Droplet[] = Array.from({ length: DROPLET_POOL }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, z: 0, vz: 0, size: 0, hue: 0,
    }));
    let dIdx = 0;
    function spawnDroplet(): Droplet {
      for (let i = 0; i < 8; i++) {
        const d = droplets[(dIdx + i) % DROPLET_POOL];
        if (!d.active) { dIdx = (dIdx + i + 1) % DROPLET_POOL; return d; }
      }
      const d = droplets[dIdx];
      dIdx = (dIdx + 1) % DROPLET_POOL;
      return d;
    }
    function emitDroplet(x: number, y: number, vx: number, vy: number, vz: number, size: number) {
      const d = spawnDroplet();
      d.active = true;
      d.x = x; d.y = y;
      d.vx = vx; d.vy = vy;
      d.z = 0; d.vz = vz;
      d.size = size;
      d.hue = Math.random();
    }

    const cursor = {
      x: -9999, y: -9999,
      lastX: -9999, lastY: -9999,
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
    }

    /* Pre-built caustic noise pattern, animated by sliding offsets */
    function drawCaustics(time: number) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.06;
      const cell = 70;
      const ox = (time * 0.18) % cell;
      const oy = (time * 0.12) % cell;
      for (let y = -cell; y < H + cell; y += cell) {
        for (let x = -cell; x < W + cell; x += cell) {
          const cx = x + ox + Math.sin((y + time) * 0.012) * 18;
          const cy = y + oy + Math.cos((x + time) * 0.013) * 18;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.55);
          g.addColorStop(0, 'rgba(160, 230, 255, 0.65)');
          g.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(cx - cell, cy - cell, cell * 2, cell * 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function tick() {
      frame++;
      const t = frame;

      /* cursor disturbance: emit a small ripple as it moves */
      const cdx = cursor.x - cursor.lastX;
      const cdy = cursor.y - cursor.lastY;
      const cspeed = Math.sqrt(cdx * cdx + cdy * cdy);
      cursor.lastX = cursor.x;
      cursor.lastY = cursor.y;
      if (cursor.inside) {
        cursor.cooldown -= 1 + cspeed * 0.4;
        if (cursor.cooldown <= 0) {
          emitRipple(cursor.x, cursor.y, {
            life: 70 + cspeed * 6,
            speed: 1.0 + cspeed * 0.04,
            amp: Math.min(0.18 + cspeed * 0.025, 0.55),
            crests: 1,
          });
          cursor.cooldown = 7;
        }
      }

      /* ambient spontaneous ripples — like distant raindrops */
      if (Math.random() < 0.04) {
        emitRipple(Math.random() * W, Math.random() * H, {
          life: 90 + Math.random() * 50,
          speed: 1.3 + Math.random() * 0.5,
          amp: 0.12 + Math.random() * 0.1,
          crests: 1,
        });
      }

      /* update ripples */
      for (let i = 0; i < RIPPLE_POOL; i++) {
        const r = ripples[i];
        if (!r.active) continue;
        r.age++;
        if (r.age >= r.life) r.active = false;
      }

      /* update droplets */
      for (let i = 0; i < DROPLET_POOL; i++) {
        const d = droplets[i];
        if (!d.active) continue;
        d.x += d.vx;
        d.y += d.vy;
        d.z += d.vz;
        d.vz -= 0.18;          // gravity (pulls droplet back to surface)
        d.vx *= 0.995;
        d.vy *= 0.995;
        if (d.z <= 0) {
          // splash-down on the surface — emit a tiny ripple
          emitRipple(d.x, d.y, {
            life: 50,
            speed: 1.1,
            amp: Math.min(0.25, 0.08 + Math.abs(d.vz) * 0.04),
            crests: 1,
          });
          d.active = false;
        } else if (d.x < -20 || d.x > W + 20 || d.y < -20 || d.y > H + 20) {
          d.active = false;
        }
      }

      /* ─────────── render ─────────── */
      ctx.globalCompositeOperation = 'source-over';

      // Deep water vertical gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#06182a');
      sky.addColorStop(0.55, '#0a2c47');
      sky.addColorStop(1, '#04101c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Ambient caustic shimmer
      drawCaustics(t);

      // Submerged shape silhouettes — body fill that suggests depth
      for (const s of shapes) {
        const c = shapeCentroid(s);
        const bb = shapeBBox(s);
        const radius = Math.max(bb.maxX - bb.minX, bb.maxY - bb.minY);
        const grad = ctx.createRadialGradient(c.x, c.y - radius * 0.2, 0, c.x, c.y, radius);
        grad.addColorStop(0, '#0e2f4a');
        grad.addColorStop(1, '#03101c');
        ctx.fillStyle = grad;
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.fill('evenodd');
        else ctx.fill();
      }

      // Faint cool rim — light from above
      ctx.strokeStyle = 'rgba(140, 210, 240, 0.18)';
      ctx.lineWidth = 1;
      for (const s of shapes) {
        tracePath(ctx, s);
        ctx.stroke();
      }

      // Ripples — drawn additively so overlapping waves brighten
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < RIPPLE_POOL; i++) {
        const r = ripples[i];
        if (!r.active) continue;
        const ageT = r.age / r.life;
        const decay = 1 - ageT;
        const fade = Math.sin(ageT * Math.PI);    // smooth in & out
        const amp = r.amp * fade;
        if (amp < 0.01) continue;

        for (let k = 0; k < r.crests; k++) {
          const radius = r.age * r.speed - k * 18;
          if (radius <= 4) continue;
          const crestFade = decay * (1 - k * 0.35);
          if (crestFade <= 0) continue;

          // Outer subtle shadow ring
          ctx.strokeStyle = `rgba(160, 220, 255, ${0.08 * amp * crestFade})`;
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, TAU);
          ctx.stroke();

          // Bright crest
          ctx.strokeStyle = `rgba(220, 245, 255, ${0.55 * amp * crestFade})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(r.x, r.y, radius, 0, TAU);
          ctx.stroke();

          // Inner trailing trough
          ctx.strokeStyle = `rgba(60, 140, 200, ${0.18 * amp * crestFade})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(r.x, r.y, Math.max(2, radius - 5), 0, TAU);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      // Highlight any shape currently being washed by a ripple — looks like
      // the wavefront catching the light off submerged stones.
      for (const s of shapes) {
        const c = shapeCentroid(s);
        let glow = 0;
        for (let i = 0; i < RIPPLE_POOL; i++) {
          const r = ripples[i];
          if (!r.active) continue;
          const radius = r.age * r.speed;
          const dx = c.x - r.x, dy = c.y - r.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const ageT = r.age / r.life;
          const fade = Math.sin(ageT * Math.PI);
          const proximity = Math.exp(-((d - radius) ** 2) / 800);
          glow += proximity * fade * r.amp;
        }
        if (glow < 0.05) continue;
        ctx.save();
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.clip('evenodd');
        else ctx.clip();
        ctx.fillStyle = `rgba(180, 230, 255, ${Math.min(glow * 0.45, 0.5)})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // Droplets — sparkling foam in flight
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < DROPLET_POOL; i++) {
        const d = droplets[i];
        if (!d.active) continue;
        const elev = Math.min(d.z / 30, 1);
        const r = d.size * (0.7 + elev * 0.6);
        // shadow on water surface
        ctx.fillStyle = `rgba(0, 0, 0, ${0.25 * (1 - elev)})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y + d.z * 0.15, r * 1.4, 0, TAU);
        ctx.fill();

        const col = d.hue > 0.5
          ? `rgba(220, 240, 255, ${0.85 - elev * 0.2})`
          : `rgba(150, 215, 245, ${0.85 - elev * 0.2})`;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(d.x, d.y - d.z * 0.45, r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Cursor surface tension — a small lens over the cursor
      if (cursor.inside) {
        const g = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 28);
        g.addColorStop(0, 'rgba(180, 230, 255, 0.22)');
        g.addColorStop(0.7, 'rgba(180, 230, 255, 0.06)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 28, 0, TAU);
        ctx.fill();
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

      // Big central splash
      emitRipple(x, y, { life: 180, speed: 2.6, amp: 0.95, crests: 4 });

      // Satellite ripples a moment later (queued by faking earlier age)
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * TAU;
        const dist = 12 + Math.random() * 22;
        emitRipple(x + Math.cos(a) * dist, y + Math.sin(a) * dist, {
          life: 110, speed: 2.0, amp: 0.45, crests: 2,
        });
      }

      // Foam droplets thrown into the air
      const N = 36;
      for (let i = 0; i < N; i++) {
        const a = Math.random() * TAU;
        const speed = 1.2 + Math.random() * 3.5;
        emitDroplet(
          x, y,
          Math.cos(a) * speed,
          Math.sin(a) * speed * 0.5,
          3 + Math.random() * 5,
          1.2 + Math.random() * 2.4,
        );
      }

      // If the splash hit a shape, also emit a "knock" highlight via extra
      // tiny ripples around its centroid.
      for (const s of shapes) {
        if (hitShape(s, x, y, 0)) {
          const c = shapeCentroid(s);
          for (let i = 0; i < 3; i++) {
            emitRipple(c.x, c.y, {
              life: 80, speed: 1.4, amp: 0.4, crests: 2,
            });
          }
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
      className="relative h-full w-full cursor-crosshair overflow-hidden bg-[#04101c] [font-family:'Inter_Tight',sans-serif]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="pointer-events-none absolute bottom-8 left-8 z-10 select-none">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.32em] text-cyan-100/35">
          Tide · v0.1
        </div>
        <div className="mt-2 [font-family:'Fraunces',serif] text-[28px] font-light italic leading-tight text-cyan-50/80">
          Drift to ripple.
          <br />
          <span className="text-cyan-100/55">Click to splash.</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-8 z-10 flex flex-col items-end gap-1 select-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-100/30">
          deep · crest · foam
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#04101c]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#0e3b5c]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#2db4cf]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#e8f6fb]" />
        </div>
      </div>
    </div>
  );
}
