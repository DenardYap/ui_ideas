import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

/**
 * Tincture — HSL lightness ramps as specimens
 *
 * A specimen sheet of twelve pigments. Each specimen is a geometric shape
 * whose interior is filled with N discrete bands of a single hue, stepping
 * through HSL lightness from dark → light (or outward from center for radial
 * ramps). The banded gradient creates the "triangular shadow" illusion the
 * user asked for — strongest in the triangle specimens, subtler elsewhere.
 *
 * All colors are expressed as `hsl(H, S%, L%)`.
 *
 * Interactions:
 *   - click any tile: rotate its hue by +40° (fresh palette on demand)
 *   - idle:           a random tile auto-rotates every ~2s so the gallery
 *                     thumbnail keeps breathing without interaction
 */

type Direction = 'v' | 'h' | 'radial' | number;

type ShapeType =
  | 'triangle-up'
  | 'triangle-down'
  | 'circle'
  | 'hexagon'
  | 'diamond'
  | 'dome'
  | 'chevron'
  | 'star'
  | 'arch'
  | 'pill'
  | 'octagon'
  | 'leaf';

type Tile = {
  shape: ShapeType;
  /** HSL hue in degrees, 0–360. */
  hue: number;
  /** HSL saturation, 0–100. */
  sat: number;
  /** How many discrete bands in the ramp. */
  bands: number;
  /** Direction of the ramp. */
  dir: Direction;
  /** HSL lightness at the start of the ramp. */
  from: number;
  /** HSL lightness at the end of the ramp. */
  to: number;
  /** Display name (old pigment/dye term). */
  name: string;
};

const INITIAL_TILES: Tile[] = [
  { shape: 'triangle-up',   hue: 212, sat: 72, bands: 8, dir: 'v',      from: 14, to: 93, name: 'Azure' },
  { shape: 'circle',        hue: 8,   sat: 68, bands: 8, dir: 'radial', from: 93, to: 18, name: 'Vermillion' },
  { shape: 'hexagon',       hue: 42,  sat: 82, bands: 7, dir: 'v',      from: 26, to: 92, name: 'Ochre' },
  { shape: 'diamond',       hue: 148, sat: 50, bands: 6, dir: 'v',      from: 18, to: 88, name: 'Verdigris' },
  { shape: 'dome',          hue: 178, sat: 58, bands: 7, dir: 'v',      from: 16, to: 90, name: 'Celadon' },
  { shape: 'chevron',       hue: 278, sat: 48, bands: 6, dir: 'v',      from: 22, to: 90, name: 'Heliotrope' },
  { shape: 'pill',          hue: 24,  sat: 80, bands: 8, dir: 45,       from: 22, to: 92, name: 'Saffron' },
  { shape: 'octagon',       hue: 335, sat: 64, bands: 7, dir: -45,      from: 22, to: 92, name: 'Carmine' },
  { shape: 'star',          hue: 232, sat: 58, bands: 7, dir: 'v',      from: 14, to: 88, name: 'Indigo' },
  { shape: 'arch',          hue: 196, sat: 74, bands: 7, dir: 'v',      from: 18, to: 92, name: 'Cerulean' },
  { shape: 'triangle-down', hue: 78,  sat: 44, bands: 6, dir: 'v',      from: 26, to: 88, name: 'Olive' },
  { shape: 'leaf',          hue: 308, sat: 56, bands: 7, dir: 135,      from: 24, to: 90, name: 'Mulberry' },
];

/** Build a gradient string with `bands` discrete HSL lightness stops. */
function ramp(
  hue: number,
  sat: number,
  bands: number,
  dir: Direction,
  from: number,
  to: number,
): string {
  const stops: string[] = [];
  for (let i = 0; i < bands; i++) {
    const pct0 = (i / bands) * 100;
    const pct1 = ((i + 1) / bands) * 100;
    const t = bands <= 1 ? 0 : i / (bands - 1);
    const lightness = from + (to - from) * t;
    const color = `hsl(${hue.toFixed(0)}, ${sat}%, ${lightness.toFixed(1)}%)`;
    // Duplicate stop at matching percentages → hard edge between bands.
    stops.push(`${color} ${pct0.toFixed(1)}%`);
    stops.push(`${color} ${pct1.toFixed(1)}%`);
  }
  const stopStr = stops.join(', ');
  if (dir === 'radial') {
    return `radial-gradient(circle at 50% 50%, ${stopStr})`;
  }
  const angle =
    dir === 'v' ? 'to bottom' : dir === 'h' ? 'to right' : `${dir}deg`;
  return `linear-gradient(${angle}, ${stopStr})`;
}

function shapeStyle(shape: ShapeType): CSSProperties {
  switch (shape) {
    case 'triangle-up':
      return { clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' };
    case 'triangle-down':
      return { clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' };
    case 'circle':
      return { borderRadius: '50%' };
    case 'hexagon':
      return {
        clipPath:
          'polygon(50% 0%, 100% 27%, 100% 73%, 50% 100%, 0% 73%, 0% 27%)',
      };
    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    case 'dome':
      return { borderRadius: '50% 50% 0 0 / 100% 100% 0 0' };
    case 'chevron':
      return {
        clipPath:
          'polygon(0% 100%, 50% 40%, 100% 100%, 100% 74%, 50% 14%, 0% 74%)',
      };
    case 'pill':
      return { borderRadius: '9999px' };
    case 'star':
      return {
        clipPath:
          'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      };
    case 'arch':
      return { borderRadius: '50% 50% 4% 4% / 60% 60% 4% 4%' };
    case 'octagon':
      return {
        clipPath:
          'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
      };
    case 'leaf':
      return { borderRadius: '80% 20% 80% 20% / 20% 80% 20% 80%' };
    default:
      return {};
  }
}

function TileCell({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  const bg = ramp(tile.hue, tile.sat, tile.bands, tile.dir, tile.from, tile.to);
  const shape = shapeStyle(tile.shape);

  // Pretty-print the direction for the readout.
  const dirLabel =
    tile.dir === 'v'
      ? 'to bottom'
      : tile.dir === 'h'
        ? 'to right'
        : tile.dir === 'radial'
          ? 'radial'
          : `${tile.dir}°`;

  return (
    <div className="flex h-full flex-col gap-2">
      <button
        onClick={onClick}
        className="group relative flex-1 overflow-hidden p-[8%] outline-none"
        aria-label={`cycle hue for ${tile.name}`}
      >
        <div
          className="h-full w-full transition-[transform] duration-300 ease-out group-hover:scale-[1.03]"
          style={{ background: bg, ...shape }}
        />
      </button>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <span className="[font-family:'Fraunces',serif] text-[13px] italic leading-none tracking-tight text-[#2a2016]">
          {tile.name}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#6f5f46]">
          H{tile.hue.toFixed(0)} · S{tile.sat} · L{tile.from}–{tile.to} · {dirLabel}
        </span>
      </div>
    </div>
  );
}

export default function Tincture() {
  const [tiles, setTiles] = useState<Tile[]>(INITIAL_TILES);

  // Idle demo: every ~2s rotate one random tile's hue by a random amount.
  useEffect(() => {
    const id = window.setInterval(() => {
      setTiles((prev) => {
        const i = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        const shift = 25 + Math.floor(Math.random() * 30);
        next[i] = { ...next[i], hue: (next[i].hue + shift) % 360 };
        return next;
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  function cycle(i: number) {
    setTiles((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], hue: (next[i].hue + 40) % 360 };
      return next;
    });
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f5ede0] [font-family:'Inter_Tight',sans-serif]">
      {/* faint paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
        style={{
          backgroundImage:
            'radial-gradient(rgba(60,45,20,0.7) 1px, transparent 1.2px)',
          backgroundSize: '3px 3px',
        }}
      />

      <div className="relative flex h-full w-full flex-col px-10 py-8">
        <div className="mb-5 flex items-baseline justify-between text-[#2a2016]">
          <div className="flex items-baseline gap-3">
            <span className="[font-family:'Fraunces',serif] text-[28px] font-light italic leading-none tracking-tight">
              Tincture
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#6f5f46]">
              hsl specimens
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#6f5f46]">
            click specimen · shift hue
          </span>
        </div>

        {/* rule */}
        <div className="mb-5 h-px w-full bg-[#2a2016]/15" />

        <div className="grid flex-1 grid-cols-4 grid-rows-3 gap-x-6 gap-y-4">
          {tiles.map((tile, i) => (
            <TileCell key={i} tile={tile} onClick={() => cycle(i)} />
          ))}
        </div>

        {/* footer rule + caption */}
        <div className="mt-5 h-px w-full bg-[#2a2016]/15" />
        <div className="mt-3 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#6f5f46]">
          <span>hue · saturation · lightness</span>
          <span>twelve / twelve</span>
        </div>
      </div>
    </div>
  );
}
