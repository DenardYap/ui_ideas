import { useEffect, useRef, useState } from 'react';

/**
 * Strata — elevation as z-axis
 *
 * A single card that you lift through five elevation tiers by dragging it
 * up or down. As it rises, the shadow grows from nothing through a full
 * two-part system (a big soft cast + a tight dark ambient-occlusion shadow).
 * The ambient shadow intentionally fades at higher tiers — "ambient light
 * slowly disappears" as the object moves further from the surface, exactly
 * as Refactoring UI describes.
 *
 * A ruler on the left names each tier; the live `box-shadow` string is
 * printed below the card so you can steal it.
 */

type Tier = {
  name: string;
  role: string;
  /** Full `box-shadow` value — a two-part shadow where possible. */
  shadow: string;
};

const TIERS: Tier[] = [
  {
    name: 'Foundation',
    role: 'Page surface',
    shadow: 'none',
  },
  {
    name: 'Raised',
    role: 'Button, chip',
    // ambient is still quite visible at this height
    shadow:
      '0 1px 3px -1px rgba(24, 20, 12, 0.12), 0 1px 1px rgba(24, 20, 12, 0.09)',
  },
  {
    name: 'Floating',
    role: 'Dropdown, menu',
    shadow:
      '0 8px 20px -6px rgba(24, 20, 12, 0.18), 0 2px 4px -2px rgba(24, 20, 12, 0.07)',
  },
  {
    name: 'Hovering',
    role: 'Card, popover',
    shadow:
      '0 18px 40px -12px rgba(24, 20, 12, 0.22), 0 4px 8px -6px rgba(24, 20, 12, 0.05)',
  },
  {
    name: 'Aloft',
    role: 'Modal, sheet',
    // ambient has all but disappeared at this height
    shadow:
      '0 36px 80px -24px rgba(24, 20, 12, 0.30), 0 8px 18px -14px rgba(24, 20, 12, 0.02)',
  },
];

/** Pixels of vertical "lift" per tier — a subtle physical cue on top of shadow. */
const LIFT_PER_TIER = 22;

function liftFor(tier: number) {
  return -LIFT_PER_TIER * tier;
}

export default function Strata() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [tier, setTier] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const startYRef = useRef(0);
  const startTierRef = useRef(1);

  // Idle auto-demo: cycle through tiers slowly when the user isn't touching.
  useEffect(() => {
    let raf = 0;
    let lastInput = performance.now();
    let next = performance.now() + 2000;
    let direction: 1 | -1 = 1;

    function markInput() {
      lastInput = performance.now();
      next = lastInput + 1600;
    }

    const stage = stageRef.current;
    if (!stage) return;
    stage.addEventListener('pointermove', markInput);
    stage.addEventListener('pointerdown', markInput);

    function tick(t: number) {
      if (!isDragging && t - lastInput > 1500 && t >= next) {
        setTier((prev) => {
          if (prev >= 4) direction = -1;
          else if (prev <= 0) direction = 1;
          return prev + direction;
        });
        next = t + 1400;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('pointermove', markInput);
      stage.removeEventListener('pointerdown', markInput);
    };
  }, [isDragging]);

  function onPointerDown(e: React.PointerEvent) {
    startYRef.current = e.clientY;
    startTierRef.current = tier;
    setIsDragging(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const dy = e.clientY - startYRef.current;
    setDragDelta(dy);
    // Live tier update — triggers shadow morph as the user crosses thresholds
    const effectiveY = liftFor(startTierRef.current) + dy;
    const live = Math.max(0, Math.min(4, Math.round(-effectiveY / LIFT_PER_TIER)));
    if (live !== tier) setTier(live);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!isDragging) return;
    const effectiveY = liftFor(startTierRef.current) + dragDelta;
    const snapped = Math.max(
      0,
      Math.min(4, Math.round(-effectiveY / LIFT_PER_TIER)),
    );
    setTier(snapped);
    setDragDelta(0);
    setIsDragging(false);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  const cardY = isDragging
    ? liftFor(startTierRef.current) + dragDelta
    : liftFor(tier);

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full overflow-hidden bg-[#efe9dd] [font-family:'Inter_Tight',sans-serif]"
    >
      {/* faint horizon — suggests a floor the card lifts off of */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 88%, rgba(60,40,20,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex h-full w-full flex-col px-10 py-8">
        {/* masthead */}
        <div className="flex items-baseline justify-between text-[#3a3228]">
          <div className="flex items-baseline gap-3">
            <span className="[font-family:'Fraunces',serif] text-[28px] font-light italic leading-none tracking-tight">
              Strata
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#7a6d58]">
              five heights
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#7a6d58]">
            drag card · elevate
          </span>
        </div>

        {/* main stage */}
        <div className="relative mt-8 flex flex-1 items-center">
          {/* left ruler */}
          <div className="relative flex flex-col-reverse gap-7 pr-10">
            {TIERS.map((t, i) => (
              <div key={t.name} className="flex items-center gap-4">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.32em] transition-opacity"
                  style={{
                    opacity: tier === i ? 1 : 0.4,
                    color: '#3a3228',
                    width: '72px',
                    display: 'inline-block',
                  }}
                >
                  {String(i + 1).padStart(2, '0')} · {t.name}
                </span>
                <span
                  className="h-px transition-all"
                  style={{
                    width: tier === i ? '56px' : '20px',
                    background: tier === i ? '#3a3228' : 'rgba(58,50,40,0.35)',
                  }}
                />
                <span
                  className="font-mono text-[9.5px] uppercase tracking-[0.32em] transition-opacity"
                  style={{
                    opacity: tier === i ? 0.8 : 0,
                    color: '#7a6d58',
                  }}
                >
                  {t.role}
                </span>
              </div>
            ))}
          </div>

          {/* card */}
          <div className="relative flex-1">
            <div
              ref={cardRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative mx-auto h-[200px] w-[320px] cursor-grab touch-none select-none rounded-[18px] bg-white active:cursor-grabbing"
              style={{
                transform: `translateY(${cardY}px)`,
                boxShadow: TIERS[tier].shadow,
                transition: isDragging
                  ? 'box-shadow 180ms cubic-bezier(.2,.8,.2,1)'
                  : 'transform 420ms cubic-bezier(.22,1.2,.36,1), box-shadow 360ms cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <div className="flex h-full flex-col justify-between p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#7a6d58]">
                    tier
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#7a6d58]">
                    {String(tier + 1).padStart(2, '0')} / 05
                  </span>
                </div>
                <div>
                  <div className="[font-family:'Fraunces',serif] text-[30px] font-light italic leading-none tracking-tight text-[#1a1610]">
                    {TIERS[tier].name}
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-[#7a6d58]">
                    {TIERS[tier].role}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* spacer for visual symmetry */}
          <div className="w-[92px]" />
        </div>

        {/* shadow readout */}
        <div className="mt-2 flex items-end justify-between gap-8 text-[#3a3228]">
          <div className="max-w-[80%]">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#7a6d58]">
              box-shadow
            </div>
            <div className="mt-1.5 font-mono text-[11px] leading-snug text-[#3a3228] break-all">
              {TIERS[tier].shadow}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[#7a6d58]">
              ambient
            </div>
            <div
              className="mt-1.5 h-1 w-24 rounded-full"
              style={{
                background: 'linear-gradient(to right, #3a3228 0%, rgba(58,50,40,0.05) 100%)',
              }}
            >
              <div
                className="h-full w-2 rounded-full bg-[#d4a73c]"
                style={{
                  transform: `translateX(${(tier / 4) * 88}px)`,
                  transition: 'transform 360ms cubic-bezier(.2,.8,.2,1)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
