import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

type ShapeKind =
  | 'circle'
  | 'ring'
  | 'square'
  | 'square-outline'
  | 'triangle'
  | 'cross'
  | 'line'
  | 'dot';

type Shape = {
  kind: ShapeKind;
  /** Position in normalized world space; the camera looks down +z. */
  worldX: number;
  worldY: number;
  /** Distance from camera. 0 = passing through, MAX_Z = far back. */
  z: number;
  /** Base radius/size, in normalized units. */
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  /** Intrinsic opacity (some shapes are intentionally fainter). */
  alpha: number;
};

/* Mostly cream so the rare colored shapes feel like accents. */
const PALETTE = [
  '#ede5d5', '#ede5d5', '#ede5d5', '#ede5d5', '#ede5d5',
  '#d4a73c',
  '#a73f29',
  '#6a8c6e',
  '#7a8aa8',
];

const KINDS: ShapeKind[] = [
  'circle', 'circle',
  'ring', 'ring',
  'square', 'square-outline',
  'triangle',
  'cross',
  'line',
  'dot', 'dot', 'dot',
];

const COUNT = 110;
const MAX_Z = 10;
const NEAR_Z = 0.5;          // shapes start fading out below this
const FAR_Z = 7.5;           // shapes start fading in below this
const FOCAL = 1.6;           // perspective strength
const SPREAD = 1.7;          // how wide the world plane spreads
const AUTO_SPEED = 1.0;      // ambient forward drift, units/sec
const SCROLL_GAIN = 0.012;   // wheel-pixels → velocity
const VEL_DECAY = 0.93;      // per-frame decay for scroll velocity

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resetShape(s: Shape, z: number) {
  s.kind = pick(KINDS);
  s.worldX = rand(-SPREAD, SPREAD);
  s.worldY = rand(-SPREAD, SPREAD);
  s.z = z;
  s.size = rand(0.025, 0.16);
  s.rotation = rand(0, TAU);
  s.rotSpeed = rand(-0.4, 0.4);
  s.color = pick(PALETTE);
  s.alpha = rand(0.55, 1);
}

function alphaForZ(z: number): number {
  if (z > FAR_Z) return Math.max(0, 1 - (z - FAR_Z) / (MAX_Z - FAR_Z));
  if (z < NEAR_Z) return Math.max(0, z / NEAR_Z);
  return 1;
}

export default function Drift() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    const shapes: Shape[] = Array.from({ length: COUNT }, () => {
      const s: Shape = {
        kind: 'dot', worldX: 0, worldY: 0, z: 0, size: 0,
        rotation: 0, rotSpeed: 0, color: '#fff', alpha: 1,
      };
      // distribute initial z across the full range so we don't see them all spawn together
      resetShape(s, rand(0.5, MAX_Z));
      return s;
    });

    let scrollVel = 0;
    let lastT = performance.now();
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
    }

    function drawShape(
      s: Shape,
      x: number,
      y: number,
      projScale: number,
      opacity: number,
    ) {
      const sz = s.size * projScale * Math.min(W, H);
      // Off-screen cull for huge near-field shapes
      if (sz > Math.max(W, H) * 1.2) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.rotation);
      ctx.globalAlpha = opacity * s.alpha;
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = Math.max(1, projScale * 2.5);

      switch (s.kind) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, sz, 0, TAU);
          ctx.fill();
          break;
        case 'ring':
          ctx.beginPath();
          ctx.arc(0, 0, sz, 0, TAU);
          ctx.stroke();
          break;
        case 'square':
          ctx.fillRect(-sz, -sz, sz * 2, sz * 2);
          break;
        case 'square-outline':
          ctx.strokeRect(-sz, -sz, sz * 2, sz * 2);
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -sz);
          ctx.lineTo(sz, sz * 0.85);
          ctx.lineTo(-sz, sz * 0.85);
          ctx.closePath();
          ctx.fill();
          break;
        case 'cross':
          ctx.lineWidth = Math.max(1, projScale * 4);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-sz, 0);
          ctx.lineTo(sz, 0);
          ctx.moveTo(0, -sz);
          ctx.lineTo(0, sz);
          ctx.stroke();
          break;
        case 'line':
          ctx.lineWidth = Math.max(1, projScale * 3);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-sz, 0);
          ctx.lineTo(sz, 0);
          ctx.stroke();
          break;
        case 'dot':
          ctx.beginPath();
          ctx.arc(0, 0, sz * 0.35, 0, TAU);
          ctx.fill();
          break;
      }

      ctx.restore();
    }

    function tick(t: number) {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;

      const speed = AUTO_SPEED + scrollVel;
      scrollVel *= VEL_DECAY;

      // Update shapes
      for (let i = 0; i < shapes.length; i++) {
        const s = shapes[i];
        s.z -= speed * dt;
        s.rotation += s.rotSpeed * dt;
        if (s.z <= 0.001) {
          // recycle to back of scene
          resetShape(s, MAX_Z);
        } else if (s.z > MAX_Z) {
          // possible if user scrolls hard backward — reset to a fresh near-field slot
          resetShape(s, NEAR_Z + Math.random() * 1.5);
        }
      }

      // back-to-front render order
      shapes.sort((a, b) => b.z - a.z);

      // background
      ctx.fillStyle = '#0a0907';
      ctx.fillRect(0, 0, W, H);

      // soft warm vignette toward center to suggest a vanishing point
      const grd = ctx.createRadialGradient(
        W / 2, H / 2, 0,
        W / 2, H / 2, Math.max(W, H) * 0.6,
      );
      grd.addColorStop(0, 'rgba(80, 55, 25, 0.18)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const half = Math.min(W, H) * 0.5;

      for (const s of shapes) {
        const opacity = alphaForZ(s.z);
        if (opacity <= 0.001) continue;
        const projScale = FOCAL / s.z;
        const x = cx + s.worldX * projScale * half;
        const y = cy + s.worldY * projScale * half;
        // off-screen cull
        const margin = 300;
        if (x < -margin || x > W + margin || y < -margin || y > H + margin) continue;
        drawShape(s, x, y, projScale, opacity);
      }

      raf = requestAnimationFrame(tick);
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      // Positive deltaY = scrolling content downward (pushing it up) = "scroll up" in
      // most users' mental model on natural-scroll setups → fall forward into the field.
      scrollVel += e.deltaY * SCROLL_GAIN;
      scrollVel = Math.max(-3, Math.min(10, scrollVel));
    }

    let touchY: number | null = null;
    function onTouchStart(e: TouchEvent) {
      touchY = e.touches[0]?.clientY ?? null;
    }
    function onTouchMove(e: TouchEvent) {
      if (touchY === null) return;
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = touchY - y; // finger up → dy > 0 → forward
      scrollVel += dy * SCROLL_GAIN * 0.6;
      scrollVel = Math.max(-3, Math.min(10, scrollVel));
      touchY = y;
    }
    function onTouchEnd() {
      touchY = null;
    }

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#0a0907] [font-family:'Inter_Tight',sans-serif]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {/* Scroll hint, centered bottom, low contrast */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[#ede5d5]/40 select-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.32em]">
          scroll · drift forward
        </div>
        <svg
          width="14"
          height="22"
          viewBox="0 0 14 22"
          fill="none"
          className="opacity-70"
        >
          <rect
            x="1"
            y="1"
            width="12"
            height="20"
            rx="6"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="7" cy="7" r="1.5" fill="currentColor">
            <animate
              attributeName="cy"
              values="6;14;6"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </div>
  );
}
