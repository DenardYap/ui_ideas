import { useEffect, useRef } from 'react';
import {
  buildShapes,
  hitShape,
  TAU,
  tracePath,
  type Shape,
} from '../_shared/shapes';

/* ──────────────────────────────────────────────────────────────────────────
   Loam — the same composition as Pyre, but the world is granular.
   Sand falls from above, settles into piles, and packs around the shapes.
   Drag to scoop or push the dunes. Click to pour a fresh load.
   ────────────────────────────────────────────────────────────────────────── */

const CELL = 4; // px per grain — small enough to look fluid, big enough to be cheap

/* Cell state encoded as a single byte:
 *   0          = empty
 *   1..PALETTE = sand, value indexes into the palette below
 *   255        = shape (immovable)
 */
const SHAPE = 255;

/** Warm earth palette — terracotta, ochre, sienna, umber. */
const SAND_PALETTE = [
  '#c0834a',
  '#a86238',
  '#d6a06a',
  '#8a4d28',
  '#b97240',
  '#e0b683',
];

function randomSand(): number {
  return 1 + Math.floor(Math.random() * SAND_PALETTE.length);
}

export default function Loam() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const container = containerRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    let cols = 0, rows = 0;
    let grid = new Uint8Array(0);
    let shapes: Shape[] = [];

    /* For rendering shape silhouettes once and then masking with the grid. */
    let raf = 0;

    const cursor = {
      x: -9999, y: -9999,
      lastX: -9999, lastY: -9999,
      down: false,
      inside: false,
    };

    function idx(c: number, r: number) {
      return r * cols + c;
    }

    function stampShapes() {
      // Mark shape-occupied cells as immovable so sand drapes over and around.
      for (const s of shapes) {
        // Walk each shape's bounding rect at cell resolution and test inclusion
        // via the canvas path (cheap and exact for our 7-shape scene).
        const padCells = 1;
        const minC = Math.max(0, Math.floor(getMinX(s) / CELL) - padCells);
        const maxC = Math.min(cols - 1, Math.ceil(getMaxX(s) / CELL) + padCells);
        const minR = Math.max(0, Math.floor(getMinY(s) / CELL) - padCells);
        const maxR = Math.min(rows - 1, Math.ceil(getMaxY(s) / CELL) + padCells);
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const px = c * CELL + CELL / 2;
            const py = r * CELL + CELL / 2;
            if (hitShape(s, px, py, 0)) {
              grid[idx(c, r)] = SHAPE;
            }
          }
        }
      }
    }

    function getMinX(s: Shape) {
      switch (s.kind) {
        case 'rect': return s.x;
        case 'circle': return s.cx - s.r;
        case 'ring': return s.cx - s.r - s.thickness / 2;
        case 'triangle': return Math.min(s.ax, s.bx, s.cx);
      }
    }
    function getMaxX(s: Shape) {
      switch (s.kind) {
        case 'rect': return s.x + s.w;
        case 'circle': return s.cx + s.r;
        case 'ring': return s.cx + s.r + s.thickness / 2;
        case 'triangle': return Math.max(s.ax, s.bx, s.cx);
      }
    }
    function getMinY(s: Shape) {
      switch (s.kind) {
        case 'rect': return s.y;
        case 'circle': return s.cy - s.r;
        case 'ring': return s.cy - s.r - s.thickness / 2;
        case 'triangle': return Math.min(s.ay, s.by, s.cy);
      }
    }
    function getMaxY(s: Shape) {
      switch (s.kind) {
        case 'rect': return s.y + s.h;
        case 'circle': return s.cy + s.r;
        case 'ring': return s.cy + s.r + s.thickness / 2;
        case 'triangle': return Math.max(s.ay, s.by, s.cy);
      }
    }

    function resize() {
      W = container.clientWidth;
      H = container.clientHeight;
      if (W === 0 || H === 0) return;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(W / CELL);
      rows = Math.ceil(H / CELL);
      grid = new Uint8Array(cols * rows);

      shapes = buildShapes(W, H);
      stampShapes();

      // Pre-fill the bottom 18% with sand so the scene starts inhabited.
      const fillR = Math.floor(rows * 0.82);
      for (let r = fillR; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[idx(c, r)] === 0) grid[idx(c, r)] = randomSand();
        }
      }
    }

    /* ─────────── physics: bottom-up falling sand ─────────── */
    function step() {
      // Iterate from bottom-up so sand falls one cell per tick (avoids streaks).
      // Randomize horizontal direction each row to avoid drift bias.
      for (let r = rows - 2; r >= 0; r--) {
        const ltr = (r & 1) === 0;
        if (ltr) {
          for (let c = 0; c < cols; c++) move(c, r);
        } else {
          for (let c = cols - 1; c >= 0; c--) move(c, r);
        }
      }
    }
    function move(c: number, r: number) {
      const i = idx(c, r);
      const v = grid[i];
      if (v === 0 || v === SHAPE) return;
      const below = idx(c, r + 1);
      if (grid[below] === 0) { grid[below] = v; grid[i] = 0; return; }
      // Try diagonals — pick a random first direction
      const left = c > 0 && grid[idx(c - 1, r + 1)] === 0;
      const right = c < cols - 1 && grid[idx(c + 1, r + 1)] === 0;
      if (left && right) {
        if (Math.random() < 0.5) { grid[idx(c - 1, r + 1)] = v; }
        else { grid[idx(c + 1, r + 1)] = v; }
        grid[i] = 0;
      } else if (left) {
        grid[idx(c - 1, r + 1)] = v; grid[i] = 0;
      } else if (right) {
        grid[idx(c + 1, r + 1)] = v; grid[i] = 0;
      }
    }

    /* ─────────── interactions ─────────── */
    function pour(x: number, y: number, radius: number, density: number) {
      const cc = Math.floor(x / CELL);
      const cr = Math.floor(y / CELL);
      const rad = Math.ceil(radius / CELL);
      for (let r = cr - rad; r <= cr + rad; r++) {
        for (let c = cc - rad; c <= cc + rad; c++) {
          if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
          const dx = c - cc, dy = r - cr;
          if (dx * dx + dy * dy > rad * rad) continue;
          if (Math.random() > density) continue;
          if (grid[idx(c, r)] !== 0) continue;
          grid[idx(c, r)] = randomSand();
        }
      }
    }
    function disturb(x: number, y: number, dx: number, dy: number) {
      // Push sand near cursor in (dx, dy). Sweep through cells in a small disc.
      const radius = 22;
      const cc = Math.floor(x / CELL);
      const cr = Math.floor(y / CELL);
      const rad = Math.ceil(radius / CELL);
      const m = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const ux = dx / m;
      const uy = dy / m;
      const strength = Math.min(m, 8);
      for (let r = cr - rad; r <= cr + rad; r++) {
        for (let c = cc - rad; c <= cc + rad; c++) {
          if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
          const ddx = c - cc, ddy = r - cr;
          if (ddx * ddx + ddy * ddy > rad * rad) continue;
          const v = grid[idx(c, r)];
          if (v === 0 || v === SHAPE) continue;
          const tc = c + Math.round(ux * (1 + Math.random() * strength));
          const tr = r + Math.round(uy * (1 + Math.random() * strength)) - 1;
          if (tc < 0 || tr < 0 || tc >= cols || tr >= rows) continue;
          if (grid[idx(tc, tr)] !== 0) continue;
          grid[idx(tc, tr)] = v;
          grid[idx(c, r)] = 0;
        }
      }
    }

    /* ─────────── render ─────────── */
    function render() {
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#f4ecd8');
      sky.addColorStop(0.6, '#ead7b3');
      sky.addColorStop(1, '#d6b787');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Distant horizon haze along the top
      const haze = ctx.createLinearGradient(0, 0, 0, H * 0.3);
      haze.addColorStop(0, 'rgba(255, 240, 210, 0.55)');
      haze.addColorStop(1, 'rgba(255, 240, 210, 0)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, W, H * 0.3);

      // Shape silhouettes drawn UNDER the sand — when sand is gone they show.
      // Use a deep umber so they read as buried stones / iron forms.
      ctx.fillStyle = '#5e3417';
      for (const s of shapes) {
        tracePath(ctx, s);
        if (s.kind === 'ring') ctx.fill('evenodd');
        else ctx.fill();
      }
      ctx.strokeStyle = 'rgba(60, 30, 10, 0.35)';
      ctx.lineWidth = 1;
      for (const s of shapes) {
        tracePath(ctx, s);
        ctx.stroke();
      }

      // Render the sand grid. Group runs of same-color sand for fewer fills.
      let curColor = -1;
      let runStart = -1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = grid[idx(c, r)];
          if (v >= 1 && v < SHAPE) {
            if (v === curColor && runStart >= 0) continue;
            // flush previous run
            if (runStart >= 0 && curColor !== -1) {
              const len = c - runStart;
              ctx.fillStyle = SAND_PALETTE[curColor - 1];
              ctx.fillRect(runStart * CELL, r * CELL, len * CELL, CELL);
            }
            curColor = v;
            runStart = c;
          } else {
            if (runStart >= 0 && curColor !== -1) {
              const len = c - runStart;
              ctx.fillStyle = SAND_PALETTE[curColor - 1];
              ctx.fillRect(runStart * CELL, r * CELL, len * CELL, CELL);
            }
            runStart = -1;
            curColor = -1;
          }
        }
        if (runStart >= 0 && curColor !== -1) {
          const len = cols - runStart;
          ctx.fillStyle = SAND_PALETTE[curColor - 1];
          ctx.fillRect(runStart * CELL, r * CELL, len * CELL, CELL);
        }
        runStart = -1;
        curColor = -1;
      }

      // Subtle vignette to ground the scene
      const vignette = ctx.createRadialGradient(
        W * 0.5, H * 0.5, Math.min(W, H) * 0.35,
        W * 0.5, H * 0.5, Math.max(W, H) * 0.85,
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(60, 30, 10, 0.32)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      // Cursor — a faint trowel-circle when inside
      if (cursor.inside) {
        ctx.strokeStyle = 'rgba(60, 30, 10, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 24, 0, TAU);
        ctx.stroke();
      }
    }

    function tick() {
      // Ambient: occasional grain dropped from the sky
      if (Math.random() < 0.45) {
        const c = Math.floor(Math.random() * cols);
        if (grid[idx(c, 0)] === 0) grid[idx(c, 0)] = randomSand();
      }

      // Cursor effects
      const dx = cursor.x - cursor.lastX;
      const dy = cursor.y - cursor.lastY;
      cursor.lastX = cursor.x;
      cursor.lastY = cursor.y;
      if (cursor.inside) {
        if (cursor.down) {
          // Continuous pour while held
          pour(cursor.x, cursor.y, 18, 0.55);
        } else if (Math.abs(dx) + Math.abs(dy) > 1) {
          disturb(cursor.x, cursor.y, dx, dy);
        }
      }

      step();
      render();
      raf = requestAnimationFrame(tick);
    }

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
      cursor.down = false;
      cursor.x = -9999; cursor.y = -9999;
    }
    function onDown(e: PointerEvent) {
      const r = container.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
      cursor.down = true;
      // Initial heavy drop on click
      pour(cursor.x, cursor.y, 30, 0.85);
    }
    function onUp() { cursor.down = false; }

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerleave', onLeave);
    container.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

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
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-crosshair overflow-hidden bg-[#ead7b3] [font-family:'Inter_Tight',sans-serif]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="pointer-events-none absolute bottom-8 left-8 z-10 select-none">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.32em] text-[#5e3417]/55">
          Loam · v0.1
        </div>
        <div className="mt-2 [font-family:'Fraunces',serif] text-[28px] font-light italic leading-tight text-[#3b1d08]">
          Drag to dig.
          <br />
          <span className="text-[#5e3417]/75">Hold to pour.</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-8 z-10 flex flex-col items-end gap-1 select-none">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#5e3417]/45">
          umber · sienna · ochre
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5e3417]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#a86238]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#d6a06a]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#f4ecd8]" />
        </div>
      </div>
    </div>
  );
}
