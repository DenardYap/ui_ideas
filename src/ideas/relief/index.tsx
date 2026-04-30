import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * Relief — "light comes from above"
 *
 * The cursor is a point light source. Each panel independently computes the
 * unit vector from its own center to the cursor on every frame, and its
 * highlight/shadow edges + drop shadow are oriented along that vector. A
 * soft halo follows the cursor so the light source is visibly present.
 *
 * Shadow anatomy for a RAISED panel with light direction (lx, ly) from the
 * panel toward the cursor:
 *   inset (-lx, -ly) white   // highlight on the edge facing the light
 *   inset ( lx,  ly) dark    // self-shadow on the opposite edge
 *   outer(-lx, -ly) dark     // drop shadow cast away from the light
 *
 * INSET panel (well) is the inverse: the lip facing the light is DARK
 * (because the lip blocks light); the far edge is LIGHT (it angles up
 * toward the source). No outer drop shadow — it sits in the surface.
 */

const COLS = 6;
const ROWS = 4;
const TOTAL = COLS * ROWS;

const INITIAL_STATES: Array<'raised' | 'inset'> = Array.from(
  { length: TOTAL },
  (_, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    // Deterministic, architectural-feeling scatter (not a regular checker).
    const pattern = (r * 3 + c * 2) % 7;
    return pattern < 3 ? 'inset' : 'raised';
  },
);

export default function Relief() {
  const stageRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const statesRef = useRef<Array<'raised' | 'inset'>>(INITIAL_STATES);
  const [states, setStates] = useState<Array<'raised' | 'inset'>>(
    INITIAL_STATES,
  );

  // Keep the ref in sync so the rAF loop always reads the latest state
  // without needing to re-register the effect.
  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Cursor position in stage-normalized coordinates (0..1 each).
    let cursorX = 0.5;
    let cursorY = 0.15;
    let cursorOnStage = false;
    const simStart = performance.now();

    function onMove(e: PointerEvent) {
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      cursorX = (e.clientX - rect.left) / rect.width;
      cursorY = (e.clientY - rect.top) / rect.height;
      cursorOnStage = true;
    }
    function onEnter() {
      cursorOnStage = true;
    }
    function onLeave() {
      cursorOnStage = false;
    }

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerenter', onEnter);
    stage.addEventListener('pointerleave', onLeave);

    let raf = 0;

    function tick(t: number) {
      if (!stage) return;

      // Virtual "sun" only when the cursor is NOT on the stage.
      if (!cursorOnStage) {
        const phase = ((t - simStart) / 9000) * Math.PI * 2;
        cursorX = 0.5 + Math.sin(phase) * 0.42;
        cursorY = 0.2 + Math.cos(phase) * 0.08;
      }

      // Expose the light position as CSS vars for the halo gradient.
      stage.style.setProperty('--mx', `${(cursorX * 100).toFixed(2)}%`);
      stage.style.setProperty('--my', `${(cursorY * 100).toFixed(2)}%`);

      // Convert normalized cursor → page pixels so we can compare against
      // each panel's own getBoundingClientRect().
      const stageRect = stage.getBoundingClientRect();
      const cursorPxX = stageRect.left + cursorX * stageRect.width;
      const cursorPxY = stageRect.top + cursorY * stageRect.height;
      const falloffScale = Math.hypot(stageRect.width, stageRect.height) * 0.55;

      const curStates = statesRef.current;

      for (let i = 0; i < panelsRef.current.length; i++) {
        const panel = panelsRef.current[i];
        if (!panel) continue;

        const pr = panel.getBoundingClientRect();
        const pcx = pr.left + pr.width / 2;
        const pcy = pr.top + pr.height / 2;
        const dx = cursorPxX - pcx;
        const dy = cursorPxY - pcy;
        const dist = Math.hypot(dx, dy);

        // Unit vector from panel center toward the light source (cursor).
        let lx: number;
        let ly: number;
        if (dist < 1) {
          lx = 0;
          ly = -1; // degenerate case — default to light from directly above
        } else {
          lx = dx / dist;
          ly = dy / dist;
        }

        // Intensity: stronger when closer to the cursor.
        const falloff = Math.min(1, dist / falloffScale);
        const intensity = 0.45 + (1 - falloff) * 0.55;

        panel.style.boxShadow = shadowFor(
          curStates[i] === 'raised',
          lx,
          ly,
          intensity,
        );
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerenter', onEnter);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  function togglePanel(i: number) {
    setStates((prev) =>
      prev.map((s, idx) =>
        idx === i ? (s === 'raised' ? 'inset' : 'raised') : s,
      ),
    );
  }

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full overflow-hidden bg-[#c3b89e] [font-family:'Inter_Tight',sans-serif]"
      style={{ '--mx': '50%', '--my': '15%' } as CSSProperties}
    >
      {/* Wide soft halo — casts warm light across the wall. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 340px at var(--mx) var(--my), rgba(255, 242, 214, 0.32) 0%, rgba(255, 242, 214, 0.08) 40%, transparent 70%)',
          mixBlendMode: 'soft-light',
        }}
      />
      {/* Tight bright spot so the cursor position is unmistakable. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 70px at var(--mx) var(--my), rgba(255, 246, 222, 0.55) 0%, rgba(255, 246, 222, 0.12) 55%, transparent 80%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1] mix-blend-multiply"
        style={{
          backgroundImage:
            'radial-gradient(rgba(60,45,20,0.6) 1px, transparent 1.2px)',
          backgroundSize: '3px 3px',
        }}
      />

      <div className="relative flex h-full w-full flex-col p-8">
        <div className="mb-5 flex items-baseline justify-between text-[#3f3626]">
          <div className="flex items-baseline gap-3">
            <span className="[font-family:'Fraunces',serif] text-[28px] font-light italic leading-none tracking-tight">
              Relief
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#6f6450]">
              cursor · light source
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#6f6450]">
            click panel · toggle
          </span>
        </div>

        <div
          className="grid flex-1 gap-3"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {states.map((state, i) => (
            <Panel
              key={i}
              index={i}
              state={state}
              onClick={() => togglePanel(i)}
              panelRef={(el) => {
                panelsRef.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Panel({
  state,
  onClick,
  index,
  panelRef,
}: {
  state: 'raised' | 'inset';
  onClick: () => void;
  index: number;
  panelRef: (el: HTMLButtonElement | null) => void;
}) {
  const isRaised = state === 'raised';
  return (
    <button
      ref={panelRef}
      onClick={onClick}
      className="group relative rounded-[3px] outline-none transition-[background-color] duration-200"
      style={{
        background: isRaised ? '#ead9b4' : '#a89974',
      }}
      aria-label={`${state} panel ${index + 1}`}
    >
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: isRaised ? 'rgba(60,42,18,0.35)' : 'rgba(255,246,222,0.6)',
          opacity: 0.5,
        }}
      />
    </button>
  );
}

/**
 * Build the `box-shadow` string for a panel given its raised/inset state,
 * the unit light vector (lx, ly) pointing from panel center toward the
 * cursor, and an intensity multiplier (0..1).
 */
function shadowFor(
  isRaised: boolean,
  lx: number,
  ly: number,
  intensity: number,
): string {
  // Offsets in pixels — deliberately bolder than the first version so the
  // shift in light direction is obvious from across the room.
  const HIGHLIGHT = 5 * intensity;
  const SELF_SHADOW = 5 * intensity;
  const DROP = 9 * intensity;
  const TIGHT = 2 * intensity;

  if (isRaised) {
    return [
      `inset ${fmt(-lx * HIGHLIGHT)}px ${fmt(-ly * HIGHLIGHT)}px 0 rgba(255, 246, 222, 0.7)`,
      `inset ${fmt(lx * SELF_SHADOW)}px ${fmt(ly * SELF_SHADOW)}px 0 rgba(80, 58, 26, 0.28)`,
      `${fmt(-lx * DROP)}px ${fmt(-ly * DROP)}px 14px rgba(60, 42, 18, 0.3)`,
      `${fmt(-lx * TIGHT)}px ${fmt(-ly * TIGHT)}px 3px rgba(60, 42, 18, 0.4)`,
    ].join(', ');
  }

  // Inset (well):
  // - soft darker shadow along the lip facing the light (the lip blocks it)
  // - a sharp dark line on that same edge
  // - a crisp highlight on the far edge that angles back up toward the light
  return [
    `inset ${fmt(-lx * HIGHLIGHT * 1.2)}px ${fmt(-ly * HIGHLIGHT * 1.2)}px 6px rgba(60, 42, 18, 0.36)`,
    `inset ${fmt(-lx * 2)}px ${fmt(-ly * 2)}px 0 rgba(60, 42, 18, 0.3)`,
    `inset ${fmt(lx * SELF_SHADOW)}px ${fmt(ly * SELF_SHADOW)}px 0 rgba(255, 246, 222, 0.55)`,
  ].join(', ');
}

function fmt(n: number): string {
  return n.toFixed(2);
}
