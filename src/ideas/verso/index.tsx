import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from 'motion/react';

/**
 * Verso — left-aligned editorial showcase
 *
 * A studio-portfolio shell built around a vertical index on the left margin.
 * The active piece is rendered as a real two-page book spread: verso (left,
 * textual colophon) and recto (right, the visual plate), hinged at a spine.
 *
 * Scrolling — or pressing ↓/↑/Space/PageUp/PageDown — flips the book a page
 * forward or backward. The flip is a true 3D page turn:
 *
 *   - The flipping sheet pivots on the spine (its left edge).
 *   - Front face shows the outgoing plate; back face shows the incoming
 *     verso, so the sheet that lands on the left becomes the new verso.
 *   - A cast shadow on the underlying page tracks the sheet's angle —
 *     darkest when the sheet is roughly 45° off the surface, gone when
 *     the sheet lies flat.
 *
 * Three view modes demonstrate that the same left-rail pattern can host
 * different catalog densities — useful for portfolios, e-commerce indexes,
 * or any list-of-things layout:
 *
 *   - Plate  · the book; one spread at a time.
 *   - Strip  · a horizontal reel of plates; the active one snaps to center.
 *   - Index  · the entire catalog as a contact sheet of small plates.
 */

type Mode = 'plate' | 'strip' | 'index';

type Project = {
  id: string;
  serial: string;
  title: string;
  year: string;
  /** "Sector" — left meta line under the plate */
  sector: string;
  /** "Discipline" — right meta line under the plate */
  discipline: string;
  /** Plate background color */
  bg: string;
  /** Plate foreground/ink color */
  ink: string;
  /** A single typographic glyph stamped on the plate */
  glyph: string;
  /** Optional small rule/decorative role hint */
  hint?: string;
};

const PROJECTS: Project[] = [
  {
    id: 'verso-atelier',
    serial: '01',
    title: 'Verso Atelier',
    year: '2024',
    sector: 'Identity, Type Design',
    discipline: 'Concept, Web Design/Dev, Identity',
    bg: '#1a1815',
    ink: '#ece6da',
    glyph: '§',
    hint: 'studio',
  },
  {
    id: 'eight-fields',
    serial: '02',
    title: 'Eight Fields',
    year: '2024',
    sector: 'Architecture, Landscape',
    discipline: 'Creative Direction, Web Design/Dev',
    bg: '#c2c4ad',
    ink: '#1a1815',
    glyph: '✕',
    hint: 'pavilion',
  },
  {
    id: 'solenne',
    serial: '03',
    title: 'Solenne',
    year: '2023',
    sector: 'Fashion, Photography',
    discipline: 'Web Design/Dev, Identity',
    bg: '#d8c4b1',
    ink: '#2b2520',
    glyph: '◐',
    hint: 'season 04',
  },
  {
    id: 'brule',
    serial: '04',
    title: 'Brûle',
    year: '2024',
    sector: 'Hospitality, Spirits',
    discipline: 'Identity, Packaging',
    bg: '#5a2418',
    ink: '#ece6da',
    glyph: '◇',
    hint: 'cellar',
  },
  {
    id: 'plein-air',
    serial: '05',
    title: 'Plein Air',
    year: '2023',
    sector: 'Cultural, Editorial',
    discipline: 'Concept, Web Design/Dev',
    bg: '#93a48a',
    ink: '#15191a',
    glyph: '☼',
    hint: 'archive',
  },
  {
    id: 'hexa-forms',
    serial: '06',
    title: 'Hexa Forms',
    year: '2024',
    sector: 'Type Foundry',
    discipline: 'Identity, Web Design/Dev',
    bg: '#1f3a5a',
    ink: '#f0e8d6',
    glyph: '⬡',
    hint: 'release 02',
  },
  {
    id: 'wirebound',
    serial: '07',
    title: 'Wirebound',
    year: '2022',
    sector: 'Editorial, Bookbinding',
    discipline: 'Art Direction, Print',
    bg: '#ece6da',
    ink: '#1a1815',
    glyph: '∥',
    hint: 'volume 12',
  },
  {
    id: 'marais',
    serial: '08',
    title: 'Marais',
    year: '2023',
    sector: 'Architecture, Restoration',
    discipline: 'Creative Direction, 3D',
    bg: '#3f4a3d',
    ink: '#ece6da',
    glyph: '◯',
    hint: 'quartier',
  },
  {
    id: 'stratus',
    serial: '09',
    title: 'Stratus',
    year: '2024',
    sector: 'Climate, Cartography',
    discipline: 'Concept, Web Design/Dev',
    bg: '#b9c8d2',
    ink: '#1a1815',
    glyph: '∿',
    hint: 'atlas',
  },
  {
    id: 'goldwyn',
    serial: '10',
    title: 'Goldwyn',
    year: '2022',
    sector: 'Hospitality, Spirits',
    discipline: 'Identity, Packaging',
    bg: '#2a1f15',
    ink: '#d4a73c',
    glyph: '✦',
    hint: 'edition I',
  },
  {
    id: 'polaris',
    serial: '11',
    title: 'Polaris',
    year: '2024',
    sector: 'Aerospace, Industrial',
    discipline: 'Identity, Wayfinding',
    bg: '#11151c',
    ink: '#e8eef5',
    glyph: '★',
    hint: 'campaign',
  },
  {
    id: 'ardeche',
    serial: '12',
    title: 'Ardèche',
    year: '2023',
    sector: 'Travel, Editorial',
    discipline: 'Concept, Web Design/Dev',
    bg: '#b85a35',
    ink: '#ece6da',
    glyph: '⌬',
    hint: 'guide',
  },
  {
    id: 'quire',
    serial: '13',
    title: 'Quire',
    year: '2024',
    sector: 'Publishing, Type',
    discipline: 'Concept, Web Design/Dev',
    bg: '#ece6da',
    ink: '#1a1815',
    glyph: '¶',
    hint: 'reader',
  },
  {
    id: 'northing',
    serial: '14',
    title: 'Northing',
    year: '2023',
    sector: 'Cartography, Wayfinding',
    discipline: 'Identity, Web Design/Dev',
    bg: '#2c3635',
    ink: '#ece6da',
    glyph: '⊹',
    hint: 'survey',
  },
];

const AUTOPLAY_MS = 5800;
const FLIP_EASE = [0.5, 0, 0.2, 1] as const;
// Single page turn (keyboard, autoplay, or a solo wheel event after idle).
const FLIP_DURATION_S = 0.95;
const FLIP_LOCK_MS = 1020;
// Wheel-driven flips scale with scroll velocity: a slow flick gives a slow
// flip, a rapid one gives a snappy one. The duration is interpolated between
// these bounds based on the time gap between consecutive wheel intents
// (smaller gap → faster scrolling → shorter flip).
const WHEEL_DUR_FAST_S = 0.16;
const WHEEL_DUR_SLOW_S = 0.55;
const WHEEL_DT_FAST_MS = 95; // gap at which we treat scrolling as max-speed
const WHEEL_DT_SLOW_MS = 500; // gap at which we revert to slow flipping
// Jump cascade (clicking a row in the left index): the *total* time of the
// cascade is constrained to this budget, regardless of distance — page 1→2
// and page 1→7 both finish in about JUMP_TOTAL_S seconds. Per-flip duration
// is `JUMP_TOTAL_S / distance`, floored so very long jumps don't flicker
// through unreadably fast pages.
const JUMP_TOTAL_S = 1.0;
const JUMP_FLIP_MIN_S = 0.11;

/**
 * Convert the time gap between two wheel intents into a flip duration.
 * Closer-together intents (fast scrolling) get progressively shorter flips.
 */
function wheelDuration(dtMs: number): number {
  if (!isFinite(dtMs) || dtMs >= WHEEL_DT_SLOW_MS) return WHEEL_DUR_SLOW_S;
  if (dtMs <= WHEEL_DT_FAST_MS) return WHEEL_DUR_FAST_S;
  const t =
    (dtMs - WHEEL_DT_FAST_MS) / (WHEEL_DT_SLOW_MS - WHEEL_DT_FAST_MS);
  return WHEEL_DUR_FAST_S + (WHEEL_DUR_SLOW_S - WHEEL_DUR_FAST_S) * t;
}
// Wheel-input throttle. A single trackpad swipe emits ~50 wheel events; we
// collapse them into discrete intents at this cadence — one swipe yields
// one flip, while sustained scrolling keeps producing fresh intents.
const WHEEL_INTENT_MS = 90;
// How many flips can be queued ahead of the current one. Keeps a runaway
// scroll from spinning through the entire catalog twice.
const QUEUE_CAP = 6;

type Flip = {
  fromIndex: number;
  direction: 1 | -1;
  /** Tag bumped on every new flip so the FlippingSheet remounts and replays. */
  seq: number;
  /** Per-flip duration in seconds. Cascades use a shorter value. */
  duration: number;
};

export default function Verso() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('plate');
  const [autoplay, setAutoplay] = useState(true);
  const [flip, setFlip] = useState<Flip | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clock = useClock();

  // Refs so wheel/keyboard handlers (closed over the first render) always see
  // the freshest state. React state alone would be stale inside event
  // listeners that we attach once on mount.
  const activeIndexRef = useRef(0);
  const flippingRef = useRef(false);
  // Keep the ref synced after every render — never written during render so
  // we don't trip the "no refs during render" rule.
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);
  // A queue of pending flips. When a flip lands, if there are more queued
  // we kick off the next one immediately — that's how jumping seven pages
  // becomes seven cascaded flips, and how holding scroll keeps turning pages
  // without waiting for each turn to fully finish.
  //
  // Each queue carries its own per-flip timing: jumps from the index use a
  // duration scaled to fit the whole cascade in `JUMP_TOTAL_S`, while
  // sustained-scroll queues stay at the cascade default.
  const queueRef = useRef<{
    direction: 1 | -1;
    remaining: number;
    duration: number;
    lockMs: number;
  } | null>(null);
  const seqRef = useRef(0);
  const lastWheelIntentRef = useRef(0);

  const activeId = PROJECTS[activeIndex].id;
  const active = PROJECTS[activeIndex];

  /**
   * Slot contents — what the static left/right pages display.
   *
   * Forward flip: the right page is *already* the new plate (it was sitting
   * underneath the outgoing sheet); the left page is *still* the old verso
   * (it's about to be covered by the moving sheet's back).
   *
   * Backward flip: mirror image. The left page is *already* the new verso
   * (the old verso lifts off as the back of the incoming sheet); the right
   * page keeps showing the old plate until the moving sheet lands on it.
   */
  const versoProject =
    flip && flip.direction > 0 ? PROJECTS[flip.fromIndex] : active;
  const plateProject =
    flip && flip.direction < 0 ? PROJECTS[flip.fromIndex] : active;

  /**
   * Run one page turn. Reads `activeIndexRef.current` so it's always correct
   * regardless of which render's closure called it. Pulls the next flip off
   * the queue in its own teardown so cascades chain seamlessly with whatever
   * per-flip timing the queue prescribed.
   */
  function runFlip(direction: 1 | -1, duration: number, lockMs: number) {
    if (flippingRef.current) return;
    const cur = activeIndexRef.current;
    const next = (cur + direction + PROJECTS.length) % PROJECTS.length;
    if (next === cur) return;

    flippingRef.current = true;
    seqRef.current += 1;
    setFlip({
      fromIndex: cur,
      direction,
      seq: seqRef.current,
      duration,
    });
    setActiveIndex(next);
    activeIndexRef.current = next; // sync the ref _now_ for any rapid follow-ups

    window.setTimeout(() => {
      flippingRef.current = false;
      const q = queueRef.current;
      if (q && q.remaining > 0) {
        // Continue the cascade — start the next flip in the next tick so
        // React has a chance to commit the previous state update.
        q.remaining -= 1;
        const dir = q.direction;
        const dur = q.duration;
        const lk = q.lockMs;
        if (q.remaining === 0) queueRef.current = null;
        window.setTimeout(() => runFlip(dir, dur, lk), 0);
      } else {
        setFlip(null);
      }
    }, lockMs);
  }

  function step(dir: 1 | -1) {
    if (queueRef.current) return; // ignore mid-cascade
    runFlip(dir, FLIP_DURATION_S, FLIP_LOCK_MS);
  }

  /**
   * Jump from the index — flips page-by-page through every project between
   * here and the destination, but compresses the *total* cascade time so a
   * 1→2 jump and a 1→7 jump finish in the same wall-clock duration
   * (`JUMP_TOTAL_S`). Per-flip timing is `JUMP_TOTAL_S / distance`, with a
   * floor so very long jumps don't reduce flips to unreadable flickers.
   */
  function jumpTo(id: string) {
    const to = PROJECTS.findIndex((p) => p.id === id);
    if (to < 0) return;
    const cur = activeIndexRef.current;
    if (to === cur) return;
    setAutoplay(false);

    if (flippingRef.current || queueRef.current) return;

    const direction: 1 | -1 = to > cur ? 1 : -1;
    const distance = Math.abs(to - cur);
    const perFlipS = Math.max(JUMP_FLIP_MIN_S, JUMP_TOTAL_S / distance);
    const perFlipLockMs = Math.round(perFlipS * 1000);
    queueRef.current = {
      direction,
      remaining: distance - 1,
      duration: perFlipS,
      lockMs: perFlipLockMs,
    };
    runFlip(direction, perFlipS, perFlipLockMs);
  }

  // Auto-cycle in plate mode, until the user takes the helm.
  useEffect(() => {
    if (!autoplay || mode !== 'plate') return;
    const id = window.setInterval(() => step(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, mode]);

  // Wheel + keyboard navigation. The handlers are attached once and always
  // call into the ref-backed `runFlip`, so they never see stale state.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    function requestFlip(direction: 1 | -1, duration: number, lockMs: number) {
      setAutoplay(false);
      // Idle: kick off a flip immediately at the requested speed.
      if (!flippingRef.current && !queueRef.current) {
        runFlip(direction, duration, lockMs);
        return;
      }
      // Busy: enqueue another flip so the cascade keeps going. The queue's
      // duration is updated to the latest requested speed so a user who
      // starts scrolling faster sees the cascade respond immediately.
      const q = queueRef.current;
      if (!q || q.direction !== direction) {
        // Either no queue, or the user reversed direction mid-cascade —
        // start a fresh queue heading the requested way.
        queueRef.current = { direction, remaining: 1, duration, lockMs };
        return;
      }
      if (q.remaining < QUEUE_CAP) q.remaining += 1;
      // Always adopt the latest speed: scrolling faster makes the *next*
      // queued flip snappier without waiting for the queue to drain.
      q.duration = duration;
      q.lockMs = lockMs;
    }

    function onWheel(e: WheelEvent) {
      // Always swallow the wheel — even the noise/momentum tail — so the
      // outer page can never scroll under us. preventDefault has to come
      // *before* any early return.
      e.preventDefault();
      if (Math.abs(e.deltaY) < 2) return;
      // Coalesce the dozens of wheel events one swipe emits into a single
      // intent. Sustained scrolling still produces an intent every
      // WHEEL_INTENT_MS, which is exactly the "keep scrolling = keep
      // flipping" behaviour.
      const now = Date.now();
      const dt = now - lastWheelIntentRef.current;
      if (dt < WHEEL_INTENT_MS) return;
      lastWheelIntentRef.current = now;
      // Time between successive intents drives the speed: rapid scrolling
      // (small dt) → short flip duration; relaxed scrolling → longer flip.
      const dur = wheelDuration(dt);
      requestFlip(e.deltaY > 0 ? 1 : -1, dur, Math.round(dur * 1000));
    }

    function onKey(e: KeyboardEvent) {
      const forward =
        e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
      const back = e.key === 'ArrowUp' || e.key === 'PageUp';
      if (!forward && !back) return;
      e.preventDefault();
      // Keyboard always uses the full normal-speed flip — one keystroke is
      // one deliberate page turn.
      requestFlip(forward ? 1 : -1, FLIP_DURATION_S, FLIP_LOCK_MS);
    }

    node.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickMode(next: Mode) {
    setMode(next);
    setAutoplay(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-[#ece6da] text-[#1a1815] [font-family:'Inter_Tight',sans-serif]"
      style={{
        // Stop wheel/touch scrolls from chaining out to whatever wraps us
        // (the gallery preview or the idea page). Combined with the wheel
        // handler's preventDefault, the page never scrolls vertically.
        overscrollBehavior: 'contain',
        touchAction: 'none',
      }}
    >
      <PaperGrain />

      {/* Top chrome */}
      <header className="absolute top-0 right-0 left-0 z-20 flex items-start justify-between px-10 pt-9">
        <div className="flex items-baseline gap-1.5">
          <span className="[font-family:'Fraunces',serif] text-[44px] leading-none font-light tracking-[-0.02em] text-[#1a1815]">
            Verso
          </span>
          <span className="-translate-y-1 font-mono text-[10px] tracking-[0.2em]">
            ®
          </span>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-10 font-mono text-[10px] uppercase tracking-[0.32em]">
            <nav className="flex items-center gap-5">
              <span className="border-b border-[#1a1815] pb-[2px] text-[#1a1815]">
                Index
              </span>
              <button
                type="button"
                className="text-[#1a1815]/60 transition-colors hover:text-[#1a1815]"
              >
                About
              </button>
            </nav>
            <span className="text-[#1a1815]/70 tabular-nums">{clock}</span>
            <button
              type="button"
              className="text-[#1a1815]/70 transition-colors hover:text-[#1a1815]"
            >
              Contact
            </button>
          </div>

          <p className="max-w-[260px] text-right text-[12px] leading-[1.45] text-[#1a1815]/70">
            A studio for studios — an evolving index of work made by hand,
            published with care, and indexed in the margin so the eye always
            knows where to land.
          </p>
        </div>
      </header>

      {/* Left index column (the navbar) */}
      <aside className="absolute top-[160px] bottom-[88px] left-10 z-20 flex w-[260px] flex-col">
        <div className="mb-4 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#1a1815]/55">
          <span>Index</span>
          <span>
            {String(PROJECTS.findIndex((p) => p.id === activeId) + 1).padStart(
              2,
              '0',
            )}
            <span className="mx-1 opacity-50">/</span>
            {String(PROJECTS.length).padStart(2, '0')}
          </span>
        </div>
        <div className="h-px w-full bg-[#1a1815]/15" />
        <ul className="mt-3 flex flex-col">
          {PROJECTS.map((p, i) => (
            <IndexRow
              key={p.id}
              project={p}
              index={i}
              isActive={p.id === activeId}
              onSelect={() => jumpTo(p.id)}
            />
          ))}
        </ul>
      </aside>

      {/* Center stage */}
      <main className="absolute top-[152px] right-10 bottom-[88px] left-[330px] z-10 flex flex-col">
        <div className="relative flex flex-1 items-center justify-center">
          <AnimatePresence mode="wait">
            {mode === 'plate' && (
              <motion.div
                key="plate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <BookView
                  versoProject={versoProject}
                  plateProject={plateProject}
                  flip={flip}
                  active={active}
                />
              </motion.div>
            )}
            {mode === 'strip' && (
              <motion.div
                key="strip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                <StripView
                  projects={PROJECTS}
                  activeId={activeId}
                  onSelect={jumpTo}
                />
              </motion.div>
            )}
            {mode === 'index' && (
              <motion.div
                key="index"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                <IndexView
                  projects={PROJECTS}
                  activeId={activeId}
                  onSelect={jumpTo}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slim meta caption — page header / footer. */}
        <div className="mt-5 flex items-end justify-between gap-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[#1a1815]/55">
          <span>
            {mode === 'plate'
              ? 'Scroll · ↑ ↓ to turn the page'
              : 'Click a piece in the index'}
          </span>
          <span>
            <span className="text-[#1a1815]/85">
              Pg. {(activeIndex * 2 + 1).toString().padStart(3, '0')}
            </span>
            <span className="mx-2 opacity-50">/</span>
            <span>{(PROJECTS.length * 2).toString().padStart(3, '0')}</span>
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute right-10 bottom-7 left-10 z-20 flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-[#1a1815]/60">
        <ModeTabs mode={mode} onChange={pickMode} />
        <span>All rights reserved · ©2026 Verso</span>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Index row                                                                 */
/* -------------------------------------------------------------------------- */

function IndexRow({
  project,
  index,
  isActive,
  onSelect,
}: {
  project: Project;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="group relative flex w-full items-center justify-between py-[5px] text-left"
      >
        <span className="flex items-baseline gap-3">
          <span
            className={
              'font-mono text-[9px] tabular-nums transition-colors ' +
              (isActive ? 'text-[#1a1815]' : 'text-[#1a1815]/35')
            }
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <motion.span
            animate={{ x: isActive ? 4 : 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={
              '[font-family:\'Fraunces\',serif] text-[15px] leading-[1.15] tracking-tight transition-colors ' +
              (isActive
                ? 'text-[#1a1815] italic'
                : 'text-[#1a1815]/35 group-hover:text-[#1a1815]/85')
            }
          >
            {project.title}
          </motion.span>
        </span>
        <span
          className={
            'font-mono text-[9px] tabular-nums transition-opacity duration-300 ' +
            (isActive ? 'text-[#1a1815]/70 opacity-100' : 'opacity-0 group-hover:opacity-60')
          }
        >
          {project.year}
        </span>
        {isActive && (
          <motion.span
            layoutId="verso-row-marker"
            className="absolute -left-3 top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full bg-[#1a1815]"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Plate                                                                     */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Plate — the recto (right page). The visual.                               */
/* -------------------------------------------------------------------------- */

function Plate({
  project,
  size = 'lg',
}: {
  project: Project;
  size?: 'sm' | 'md' | 'lg';
}) {
  const titleSize =
    size === 'lg' ? 'text-[64px]' : size === 'md' ? 'text-[28px]' : 'text-[14px]';
  const bodyPad =
    size === 'lg' ? 'px-8 py-7' : size === 'md' ? 'p-4' : 'p-2.5';
  const cornerSize =
    size === 'lg' ? 'text-[10px]' : size === 'md' ? 'text-[8.5px]' : 'text-[7px]';
  const glyphSize =
    size === 'lg' ? 'text-[42px]' : size === 'md' ? 'text-[20px]' : 'text-[10px]';

  return (
    <div
      className={
        'relative flex h-full w-full flex-col justify-between overflow-hidden ' +
        bodyPad
      }
      style={{
        backgroundColor: project.bg,
        color: project.ink,
      }}
    >
      {/* Plate grain — pinned diffuse light. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1.2px)',
          backgroundSize: '3px 3px',
        }}
      />

      <div
        className={
          'relative flex items-start justify-between font-mono uppercase tracking-[0.32em] opacity-75 ' +
          cornerSize
        }
      >
        <span>Nº {project.serial}</span>
        <span>{project.year}</span>
      </div>

      <div className="relative flex flex-col items-center justify-center text-center">
        {size === 'lg' && (
          <span className="mb-3 block h-px w-12 bg-current opacity-40" />
        )}
        <h2
          className={
            "[font-family:'Fraunces',serif] font-light italic tracking-[-0.02em] leading-[0.95] " +
            titleSize
          }
        >
          {project.title}
        </h2>
      </div>

      <div className="relative flex items-end justify-between">
        <span
          className={
            'font-mono uppercase tracking-[0.32em] opacity-65 ' + cornerSize
          }
        >
          {size === 'lg' ? project.hint ?? project.sector : project.sector}
        </span>
        <span
          className={"[font-family:'Fraunces',serif] not-italic " + glyphSize}
        >
          {project.glyph}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  VersoPage — the verso (left page). The colophon / textual side.           */
/* -------------------------------------------------------------------------- */

function VersoPage({ project }: { project: Project }) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden px-9 py-8 text-[#1a1815]"
      style={{ backgroundColor: '#ebe3d2' }}
    >
      {/* paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 mix-blend-multiply"
        style={{
          backgroundImage:
            'radial-gradient(rgba(60,45,20,0.10) 1px, transparent 1.2px), radial-gradient(rgba(60,45,20,0.06) 1px, transparent 1.2px)',
          backgroundSize: '3px 3px, 7px 7px',
          backgroundPosition: '0 0, 1px 2px',
        }}
      />
      {/* gutter shadow — falls toward the spine on the right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10 opacity-40"
        style={{
          background:
            'linear-gradient(to left, rgba(20,17,15,0.45), rgba(20,17,15,0))',
        }}
      />

      <div className="relative flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-[#1a1815]/60">
        <span>Nº {project.serial}</span>
        <span>{project.year}</span>
      </div>

      <div className="relative mt-12 flex flex-col gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.45em] text-[#1a1815]/55">
          The Catalog · Recto opposite
        </span>
        <h3 className="[font-family:'Fraunces',serif] text-[34px] leading-[1.05] font-light tracking-[-0.02em] italic">
          {project.title}
        </h3>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.42em] text-[#1a1815]/65">
          {project.hint ?? '—'}
        </span>
      </div>

      <div className="relative mt-auto flex flex-col gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#1a1815]/75">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[#1a1815]/45">Sector</span>
          <span className="text-right">{project.sector}</span>
        </div>
        <div className="h-px w-full bg-[#1a1815]/15" />
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[#1a1815]/45">Discipline</span>
          <span className="text-right">{project.discipline}</span>
        </div>
      </div>

      <div className="relative mt-6 flex items-end justify-between">
        <span className="[font-family:'Fraunces',serif] text-[26px] leading-none not-italic text-[#1a1815]/85">
          {project.glyph}
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#1a1815]/45">
          {project.serial} · verso
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Book view — two-page spread + the flipping sheet                          */
/* -------------------------------------------------------------------------- */

const PAGE_W = 360;
const PAGE_H = 480;

function BookView({
  versoProject,
  plateProject,
  flip,
  active,
}: {
  versoProject: Project;
  plateProject: Project;
  flip: Flip | null;
  active: Project;
}) {
  // The moving sheet's faces:
  //   forward  · front = outgoing recto, back = incoming verso
  //   backward · front = incoming recto, back = outgoing verso
  const sheetFront = flip
    ? flip.direction > 0
      ? PROJECTS[flip.fromIndex]
      : active
    : null;
  const sheetBack = flip
    ? flip.direction > 0
      ? active
      : PROJECTS[flip.fromIndex]
    : null;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ perspective: '2600px' }}
    >
      <div
        className="relative"
        style={{
          width: PAGE_W * 2,
          height: PAGE_H,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Thickness — paper edges peeking out from under each side. */}
        <PageEdges side="left" />
        <PageEdges side="right" />

        {/* Static spread under the moving sheet. */}
        <div
          className="absolute top-0 left-0"
          style={{ width: PAGE_W, height: PAGE_H }}
        >
          <VersoPage project={versoProject} />
          {/* gutter cast — the binding always sits in shadow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1.5"
            style={{
              background:
                'linear-gradient(to left, rgba(20,17,15,0.3), transparent)',
            }}
          />
        </div>
        <div
          className="absolute top-0"
          style={{ left: PAGE_W, width: PAGE_W, height: PAGE_H }}
        >
          <Plate project={plateProject} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5"
            style={{
              background:
                'linear-gradient(to right, rgba(20,17,15,0.3), transparent)',
            }}
          />
        </div>

        {/* Spine — the dark vertical seam. */}
        <div
          aria-hidden
          className="absolute top-0 -translate-x-px"
          style={{
            left: PAGE_W,
            width: 2,
            height: PAGE_H,
            background:
              'linear-gradient(to bottom, rgba(20,17,15,0.05), rgba(20,17,15,0.35) 50%, rgba(20,17,15,0.05))',
          }}
        />

        {/* Soft shadow under the closed book, anchoring it to the surface. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-6 -bottom-6 h-8 opacity-50"
          style={{
            background:
              'radial-gradient(closest-side, rgba(20,17,15,0.35), transparent)',
            filter: 'blur(8px)',
          }}
        />

        {/* The flipping sheet — only mounted while a flip is in progress.
            `flip.seq` is the key so each new turn remounts the component and
            replays the animation from its starting angle (instead of trying
            to interpolate from -180° back to 0° between cascaded flips). */}
        <AnimatePresence>
          {flip && sheetFront && sheetBack && (
            <FlippingSheet
              key={flip.seq}
              direction={flip.direction}
              front={sheetFront}
              back={sheetBack}
              duration={flip.duration}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * The moving page. Pivots on the spine (its left edge), with both faces
 * rendered via `preserve-3d` + `backface-visibility: hidden`.
 *
 * `rotateY` is a motion value so we can derive the cast-shadow opacity on
 * the underlying pages directly from the angle — no keyframe math, just one
 * source of truth.
 */
function FlippingSheet({
  direction,
  front,
  back,
  duration,
}: {
  direction: 1 | -1;
  front: Project;
  back: Project;
  duration: number;
}) {
  const initial = direction > 0 ? 0 : -180;
  const target = direction > 0 ? -180 : 0;
  const rotateY = useMotionValue(initial);

  useEffect(() => {
    const controls = animate(rotateY, target, {
      duration,
      ease: [...FLIP_EASE],
    });
    return () => controls.stop();
  }, [rotateY, target, duration]);

  // Right-page cast shadow: present while the sheet is between flat-on-right
  // (rotateY 0) and edge-on (rotateY -90). Peaks around -45°.
  const rightCast = useTransform(rotateY, (v) => {
    if (v > 0 || v < -90) return 0;
    return Math.sin((-v / 90) * Math.PI) * 0.45;
  });
  // Left-page cast shadow: kicks in once the sheet crosses the spine and
  // begins descending toward the left page. Peaks around -135°.
  const leftCast = useTransform(rotateY, (v) => {
    if (v > -90 || v < -180) return 0;
    return Math.sin(((-v - 90) / 90) * Math.PI) * 0.45;
  });
  // The leading edge of the sheet catches a sliver of light — strongest while
  // the sheet is roughly perpendicular to the page (around -90°).
  const edgeShine = useTransform(rotateY, (v) => {
    const a = Math.abs(v + 90); // distance from -90°
    return Math.max(0, 1 - a / 60) * 0.7;
  });

  return (
    <>
      {/* Cast shadow on the right page (under the lifting sheet). */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0"
        style={{
          left: PAGE_W,
          width: PAGE_W,
          height: PAGE_H,
          opacity: rightCast,
          mixBlendMode: 'multiply',
          background:
            'linear-gradient(to right, rgba(20,17,15,0.6) 0%, rgba(20,17,15,0.25) 35%, transparent 70%)',
          zIndex: 4,
        }}
      />
      {/* Cast shadow on the left page (under the descending sheet). */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0"
        style={{
          width: PAGE_W,
          height: PAGE_H,
          opacity: leftCast,
          mixBlendMode: 'multiply',
          background:
            'linear-gradient(to left, rgba(20,17,15,0.6) 0%, rgba(20,17,15,0.25) 35%, transparent 70%)',
          zIndex: 4,
        }}
      />

      {/* The sheet itself — a recto on the front, a verso on the back.
          `z: 1` lifts the sheet a hair toward the viewer so it stays *above*
          the underlying right-page slot at rotateY(0); without this, the
          shared depth causes the GPU to occasionally render the new plate
          (sitting behind) on top of the sheet's front, which reads as the
          page "instantly turning to the next content" before the flip. */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: PAGE_W,
          width: PAGE_W,
          height: PAGE_H,
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
          rotateY,
          z: 1,
          willChange: 'transform',
          zIndex: 5,
        }}
      >
        {/* Front face — outgoing (forward) or incoming (backward) plate. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.06), 0 24px 50px -18px rgba(20,17,15,0.6)',
          }}
        >
          <Plate project={front} />
          {/* paper-curl gradient: a subtle shading from the spine outward to
              suggest the sheet bowing under its own weight. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(20,17,15,0.18), transparent 18%, transparent 82%, rgba(20,17,15,0.08))',
              mixBlendMode: 'multiply',
            }}
          />
          {/* leading-edge highlight on the outer (right) edge */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-1.5"
            style={{
              background:
                'linear-gradient(to left, rgba(255,255,255,0.85), transparent)',
              opacity: edgeShine,
            }}
          />
        </div>

        {/* Back face — the incoming verso (forward) or outgoing verso (backward).
            Rotated 180° so when the sheet is at rotateY(-180) we see this
            face right-reading on the left side of the spread. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.06), 0 24px 50px -18px rgba(20,17,15,0.6)',
          }}
        >
          <VersoPage project={back} />
          {/* same curl shading mirrored: heavier toward what is now the spine
              (the right edge of the back face). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to left, rgba(20,17,15,0.18), transparent 18%, transparent 82%, rgba(20,17,15,0.08))',
              mixBlendMode: 'multiply',
            }}
          />
          {/* leading edge of the back face is the LEFT edge as the sheet
              swings left; light catches it during the second half of the flip. */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5"
            style={{
              background:
                'linear-gradient(to right, rgba(255,255,255,0.85), transparent)',
              opacity: edgeShine,
            }}
          />
        </div>
      </motion.div>
    </>
  );
}

/**
 * Page edges — a stack of thin paper slivers offset behind each half of the
 * spread, so the book reads as having real thickness rather than being two
 * flat rectangles.
 */
function PageEdges({ side }: { side: 'left' | 'right' }) {
  const layers = [
    { x: 4, y: 3, opacity: 0.55 },
    { x: 8, y: 6, opacity: 0.35 },
    { x: 12, y: 9, opacity: 0.2 },
  ];
  const xSign = side === 'left' ? -1 : 1;
  const baseLeft = side === 'left' ? 0 : PAGE_W;
  return (
    <>
      {layers.map((s, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: s.y,
            left: baseLeft + xSign * s.x,
            width: PAGE_W,
            height: PAGE_H,
            backgroundColor: '#e6dfd0',
            opacity: s.opacity,
            boxShadow: '0 1px 0 rgba(20,17,15,0.05)',
          }}
        />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Strip view                                                                */
/* -------------------------------------------------------------------------- */

function StripView({
  projects,
  activeId,
  onSelect,
}: {
  projects: Project[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const activeIndex = projects.findIndex((p) => p.id === activeId);
  // Plate width including gap, in px — strip slides as a single transform.
  const plateW = 220;
  const gap = 18;
  const offset = -(activeIndex * (plateW + gap));

  return (
    <div className="relative flex h-full items-center overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#ece6da] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#ece6da] to-transparent" />

      <motion.ul
        className="flex items-center"
        style={{ gap: `${gap}px`, paddingLeft: 'calc(50% - 110px)' }}
        animate={{ x: offset }}
        transition={{ type: 'spring', stiffness: 220, damping: 32 }}
      >
        {projects.map((p) => {
          const isActive = p.id === activeId;
          return (
            <li key={p.id} style={{ flex: '0 0 auto' }}>
              <motion.button
                type="button"
                onClick={() => onSelect(p.id)}
                animate={{
                  scale: isActive ? 1 : 0.86,
                  opacity: isActive ? 1 : 0.45,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                style={{
                  width: `${plateW}px`,
                  aspectRatio: '3 / 4',
                  transformOrigin: 'center',
                }}
                className="block"
              >
                <Plate project={p} size="md" />
              </motion.button>
            </li>
          );
        })}
      </motion.ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Index (contact-sheet) view                                                */
/* -------------------------------------------------------------------------- */

function IndexView({
  projects,
  activeId,
  onSelect,
}: {
  projects: Project[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid h-full w-full grid-cols-7 grid-rows-2 gap-3">
      {projects.map((p) => {
        const isActive = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className="group relative block h-full w-full"
            style={{ aspectRatio: '3 / 4' }}
          >
            <div
              className={
                'absolute inset-0 transition-all duration-300 ' +
                (isActive
                  ? 'ring-2 ring-[#1a1815] ring-offset-2 ring-offset-[#ece6da]'
                  : 'opacity-70 group-hover:opacity-100')
              }
            >
              <Plate project={p} size="md" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mode tabs                                                                 */
/* -------------------------------------------------------------------------- */

function ModeTabs({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const tabs: { id: Mode; label: string }[] = [
    { id: 'plate', label: 'Plate' },
    { id: 'strip', label: 'Strip' },
    { id: 'index', label: 'Index' },
  ];
  return (
    <div className="flex items-center gap-3">
      {tabs.map((t, i) => {
        const isActive = t.id === mode;
        return (
          <span key={t.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange(t.id)}
              className={
                'relative pb-[2px] transition-colors ' +
                (isActive
                  ? 'text-[#1a1815]'
                  : 'text-[#1a1815]/55 hover:text-[#1a1815]')
              }
            >
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="verso-mode-underline"
                  className="absolute right-0 bottom-0 left-0 h-px bg-[#1a1815]"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                />
              )}
            </button>
            {i < tabs.length - 1 && <span className="text-[#1a1815]/30">·</span>}
          </span>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bits                                                                      */
/* -------------------------------------------------------------------------- */

function PaperGrain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-multiply"
      style={{
        backgroundImage:
          'radial-gradient(rgba(60,45,20,0.06) 1px, transparent 1.2px), radial-gradient(rgba(60,45,20,0.04) 1px, transparent 1.2px)',
        backgroundSize: '3px 3px, 7px 7px',
        backgroundPosition: '0 0, 1px 2px',
      }}
    />
  );
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const hh = now.getHours() % 12 || 12;
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  return `CET ${String(hh).padStart(2, '0')}:${mm} ${ampm}`;
}

