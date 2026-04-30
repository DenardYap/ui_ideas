import { useEffect, useRef } from 'react';

type Item = {
  n: string;
  title: string;
  type: string;
  designation: string;
  accent: string;
  /** Glowing dot diameter in px */
  size: number;
};

const ITEMS: Item[] = [
  { n: '01', title: 'Sirius',     type: 'Star',          designation: 'α CMa',     accent: '#e8eef5', size: 26 },
  { n: '02', title: 'Andromeda',  type: 'Galaxy',        designation: 'M 31',      accent: '#7a8aa8', size: 58 },
  { n: '03', title: 'Saturn',     type: 'Planet',        designation: '—',         accent: '#d4a73c', size: 44 },
  { n: '04', title: 'Vega',       type: 'Star',          designation: 'α Lyr',     accent: '#ede5d5', size: 24 },
  { n: '05', title: 'Crab',       type: 'Nebula',        designation: 'M 1',       accent: '#a73f29', size: 52 },
  { n: '06', title: 'Pleiades',   type: 'Cluster',       designation: 'M 45',      accent: '#9bb0d8', size: 38 },
  { n: '07', title: 'Mars',       type: 'Planet',        designation: '—',         accent: '#b86843', size: 30 },
  { n: '08', title: 'Halley',     type: 'Comet',         designation: '1P',        accent: '#c9d8e8', size: 22 },
  { n: '09', title: 'Polaris',    type: 'Star',          designation: 'α UMi',     accent: '#fff7e0', size: 28 },
  { n: '10', title: 'Orion',      type: 'Constellation', designation: 'Ori',       accent: '#d4a73c', size: 48 },
  { n: '11', title: 'Cygnus',     type: 'Constellation', designation: 'Cyg',       accent: '#3a4a6a', size: 44 },
  { n: '12', title: 'Hercules',   type: 'Constellation', designation: 'Her',       accent: '#6a8c6e', size: 40 },
];

const ANG_SPACING = Math.PI / 10;          // ~18° between items on the wheel
const ENTER_ANGLE = Math.PI + 0.1;          // first slot starts just off the left
const EXIT_ANGLE = -0.1;                    // last slot leaves just off the right
const SCROLL_PER_RADIAN = 420;              // pixels of scroll = one radian of wheel turn
const TOTAL_TRAVEL =
  (ENTER_ANGLE - EXIT_ANGLE + (ITEMS.length - 1) * ANG_SPACING) *
  SCROLL_PER_RADIAN;

const AUTO_SPEED = 90;                      // px per second of idle drift
const IDLE_BEFORE_AUTO = 1500;              // ms after last user input before resuming

// Background star field — generated once at module load so renders stay pure.
const STARS = Array.from({ length: 90 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 0.5 + Math.random() * 1.6,
  opacity: 0.08 + Math.random() * 0.28,
}));

export default function Orbit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const scroller = scrollerRef.current;
    const spacer = spacerRef.current;
    if (!container || !scroller || !spacer) return;

    let raf = 0;
    let lastT = performance.now();
    let lastUserInput = 0;
    let direction = 1;

    function markUserInput() {
      lastUserInput = performance.now();
    }

    function setSpacerHeight() {
      if (!container || !spacer) return;
      // Total scroll = travel for full wheel sweep + a viewport-sized buffer so
      // the user can scroll past the end without snapping back.
      spacer.style.height = `${TOTAL_TRAVEL + container.clientHeight}px`;
    }

    function tick(t: number) {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      if (!container || !scroller) return;

      const max = scroller.scrollHeight - scroller.clientHeight;

      // Pingpong auto-scroll while idle
      const idle = t - lastUserInput > IDLE_BEFORE_AUTO;
      if (idle && max > 0) {
        let next = scroller.scrollTop + direction * AUTO_SPEED * dt;
        if (next >= max) {
          next = max;
          direction = -1;
        } else if (next <= 0) {
          next = 0;
          direction = 1;
        }
        scroller.scrollTop = next;
      }

      // Wheel geometry tied to current container size
      const W = container.clientWidth;
      const H = container.clientHeight;
      const cx = W / 2;
      const cy = -H * 0.2;
      const radius = H * 1.05;

      const wheelOffset = scroller.scrollTop / SCROLL_PER_RADIAN;

      for (let i = 0; i < ITEMS.length; i++) {
        const card = itemsRef.current[i];
        if (!card) continue;

        const startAngle = ENTER_ANGLE + i * ANG_SPACING;
        const theta = startAngle - wheelOffset;

        // Hard cull: well off either side
        if (theta > Math.PI + 0.35 || theta < -0.35) {
          card.style.opacity = '0';
          card.style.visibility = 'hidden';
          continue;
        }
        card.style.visibility = 'visible';

        const x = cx + radius * Math.cos(theta);
        const y = cy + radius * Math.sin(theta);
        const rotationDeg = (theta - Math.PI / 2) * (180 / Math.PI);
        const scale = 0.55 + 0.45 * Math.max(0, Math.sin(theta));

        // Edge fade
        let opacity = 1;
        const fadeBand = 0.35;
        if (theta > Math.PI - fadeBand) opacity = (Math.PI - theta) / fadeBand;
        if (theta < fadeBand) opacity = theta / fadeBand;
        opacity = Math.max(0, Math.min(1, opacity));

        // Place card center at (x, y), then rotate + scale around its own center.
        card.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotationDeg}deg) scale(${scale})`;
        card.style.opacity = String(opacity);
      }

      raf = requestAnimationFrame(tick);
    }

    scroller.addEventListener('wheel', markUserInput, { passive: true });
    scroller.addEventListener('touchstart', markUserInput, { passive: true });
    scroller.addEventListener('touchmove', markUserInput, { passive: true });
    scroller.addEventListener('keydown', markUserInput);

    setSpacerHeight();
    const ro = new ResizeObserver(setSpacerHeight);
    ro.observe(container);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scroller.removeEventListener('wheel', markUserInput);
      scroller.removeEventListener('touchstart', markUserInput);
      scroller.removeEventListener('touchmove', markUserInput);
      scroller.removeEventListener('keydown', markUserInput);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#0a0c14] [font-family:'Inter_Tight',sans-serif]"
    >
      {/* Subtle starfield background */}
      <div className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* Soft horizon glow at the bottom — suggests the wheel passing closest to viewer */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            'radial-gradient(80% 100% at 50% 100%, rgba(120,90,40,0.25) 0%, transparent 70%)',
        }}
      />

      {/* Scroll proxy — invisible, captures wheel/touch */}
      <div
        ref={scrollerRef}
        tabIndex={0}
        className="absolute inset-0 overflow-y-scroll outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={spacerRef} aria-hidden style={{ width: '100%' }} />
      </div>

      {/* Items overlay — positioned by the rAF loop, click-through */}
      <div className="pointer-events-none absolute inset-0">
        {ITEMS.map((item, i) => (
          <article
            key={item.n}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
            className="absolute left-0 top-0 w-[180px] origin-center will-change-[transform,opacity]"
            style={{ opacity: 0, visibility: 'hidden' }}
          >
            <ItemCard item={item} />
          </article>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35 select-none">
        <span>scroll · orbit</span>
      </div>
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  return (
    <div className="overflow-hidden rounded-[3px] border border-white/10 bg-[#14141c]/85 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)] backdrop-blur-sm">
      {/* Glowing observation */}
      <div className="relative flex h-[110px] items-center justify-center">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at center, ${item.accent}40 0%, transparent 70%)`,
          }}
        />
        <div
          className="rounded-full"
          style={{
            width: `${item.size}px`,
            height: `${item.size}px`,
            background: item.accent,
            boxShadow: `0 0 ${item.size * 1.2}px ${item.accent}aa, 0 0 ${item.size * 0.4}px ${item.accent}`,
          }}
        />
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.32em] text-white/45">
          <span>N° {item.n}</span>
          <span>{item.designation}</span>
        </div>
        <h3 className="mt-1.5 [font-family:'Fraunces',serif] text-[20px] font-light italic leading-tight tracking-[-0.01em] text-white">
          {item.title}
        </h3>
        <div className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.32em] text-white/55">
          {item.type}
        </div>
      </div>
    </div>
  );
}
