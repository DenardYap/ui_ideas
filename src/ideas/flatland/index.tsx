import { useEffect, useRef, useState } from 'react';

/**
 * Flatland — depth without blur
 *
 * A grid of monochrome tiles. Depth here is conveyed two ways the Refactoring
 * UI chapter ends with:
 *   1. Lightness: lighter tiles feel raised off the background, darker tiles
 *      feel inset into it.
 *   2. Solid offset shadows (no blur) on the two topmost tiers — a flat
 *      aesthetic that still has a z-axis.
 *
 * Each tile has a depth level from -2 (deepest well) to +2 (most raised).
 * Click a tile to cycle it up one level; it wraps from +2 back to -2.
 */

type Level = -2 | -1 | 0 | 1 | 2;

const LEVELS: Level[] = [-2, -1, 0, 1, 2];

// A warm terracotta ramp. The middle value ( _0 ) matches the background so
// level-0 tiles disappear into the surface.
const PALETTE: Record<Level, string> = {
  [-2]: '#5a2e1e',
  [-1]: '#8a4a33',
  [0]: '#bb6a47',
  [1]: '#e39672',
  [2]: '#f4c9a8',
};
const BG = '#bb6a47';
// Shadow color used for solid-offset shadows on raised tiles.
const SHADOW_DEEP = '#3a1d12';

const COLS = 8;
const ROWS = 5;
const TOTAL = COLS * ROWS;

/** Seeded-looking initial layout — a little of everything, biased toward flat. */
function initialLevels(): Level[] {
  return Array.from({ length: TOTAL }, (_, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    const noise = (r * 11 + c * 7) % 11;
    if (noise < 2) return -2;
    if (noise < 4) return -1;
    if (noise < 7) return 0;
    if (noise < 9) return 1;
    return 2;
  });
}

export default function Flatland() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [levels, setLevels] = useState<Level[]>(initialLevels);

  // Idle auto-play — occasionally promote a random tile so the preview breathes.
  useEffect(() => {
    let lastInput = performance.now();
    const stage = stageRef.current;
    if (!stage) return;

    function markInput() {
      lastInput = performance.now();
    }
    stage.addEventListener('pointerdown', markInput);
    stage.addEventListener('pointermove', markInput);

    const interval = window.setInterval(() => {
      if (performance.now() - lastInput < 1500) return;
      setLevels((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        const cur = next[idx];
        const dir = Math.random() < 0.5 ? 1 : -1;
        const candidate = cur + dir;
        next[idx] = (Math.max(-2, Math.min(2, candidate)) as Level) === cur
          ? ((cur - dir) as Level) // bounce off the edge
          : (candidate as Level);
        return next;
      });
    }, 320);

    return () => {
      window.clearInterval(interval);
      stage.removeEventListener('pointerdown', markInput);
      stage.removeEventListener('pointermove', markInput);
    };
  }, []);

  function bump(i: number) {
    setLevels((prev) => {
      const next = [...prev];
      const cur = next[i];
      next[i] = cur === 2 ? -2 : ((cur + 1) as Level);
      return next;
    });
  }

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full overflow-hidden [font-family:'Inter_Tight',sans-serif]"
      style={{ background: BG }}
    >
      <div className="relative flex h-full w-full flex-col p-8">
        <div className="mb-5 flex items-baseline justify-between text-[#2a0f05]">
          <div className="flex items-baseline gap-3">
            <span className="[font-family:'Fraunces',serif] text-[28px] font-light italic leading-none tracking-tight">
              Flatland
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#2a0f05]/60">
              depth without blur
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#2a0f05]/60">
            click · raise
          </span>
        </div>

        <div
          className="grid flex-1 gap-3"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {levels.map((lvl, i) => (
            <Tile key={i} level={lvl} onClick={() => bump(i)} />
          ))}
        </div>

        {/* tiny legend / ramp */}
        <div className="mt-5 flex items-center gap-3 text-[#2a0f05]">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#2a0f05]/60">
            inset
          </span>
          <div className="flex gap-1.5">
            {LEVELS.map((lvl) => (
              <div
                key={lvl}
                className="h-4 w-6 rounded-[2px]"
                style={{ background: PALETTE[lvl] }}
              />
            ))}
          </div>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#2a0f05]/60">
            raised
          </span>
        </div>
      </div>
    </div>
  );
}

function Tile({ level, onClick }: { level: Level; onClick: () => void }) {
  // Solid offset shadows on the two highest tiers — a flat-design trick.
  // The higher the tile, the longer the cast.
  const solidShadow =
    level === 2
      ? `6px 6px 0 ${SHADOW_DEEP}`
      : level === 1
        ? `3px 3px 0 ${SHADOW_DEEP}`
        : 'none';

  // Very subtly translate raised tiles up/left so the solid shadow reads as
  // a cast rather than an outline. Keeps them clearly in front.
  const lift = level === 2 ? -3 : level === 1 ? -1 : 0;

  return (
    <button
      onClick={onClick}
      className="rounded-[3px] outline-none"
      style={{
        background: PALETTE[level],
        boxShadow: solidShadow,
        transform: `translate(${lift}px, ${lift}px)`,
        transition:
          'background-color 220ms ease, box-shadow 220ms ease, transform 220ms cubic-bezier(.22,1.2,.36,1)',
      }}
      aria-label={`tile level ${level}`}
    />
  );
}
