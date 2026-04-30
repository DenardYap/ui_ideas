import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Lightbulb,
  LightbulbOff,
  Snowflake,
  Sprout,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { useIsInPreview } from '@/components/idea-preview';

type Item = {
  id: string;
  src: string;
  Icon: LucideIcon;
};

type FrameCredit = {
  label: string;
  source: string;
  href?: string;
};

type Frame = {
  id: string;
  /** CSS aspect-ratio for the photo container; matches the source so nothing is cropped. */
  aspectRatio: string;
  /** Optional attribution shown beneath the switcher. */
  credit?: FrameCredit;
  /** Two or more states. The first one is the initial value. */
  items: Item[];
};

const NOVOWYR: Frame = {
  id: 'novowyr',
  aspectRatio: '1 / 1',
  credit: {
    label: 'Photography',
    source: 'Novowyr',
    href: 'https://www.flickr.com/photos/nowovyr/16318939113/',
  },
  items: [
    { id: 'left', src: '/novowyr/left.jpg', Icon: ChevronLeft },
    { id: 'right', src: '/novowyr/right.jpg', Icon: ChevronRight },
  ],
};

const SEASONS: Frame = {
  id: 'seasons',
  aspectRatio: '256 / 461',
  credit: {
    label: 'Photography',
    source: 'Orlando Florin Rosu',
    href: 'https://stock.adobe.com/contributor/15404/orlando-florin-rosu?load_type=author&prev_url=detail',
  },
  items: [
    { id: 'spring', src: '/seasons/spring.jpeg', Icon: Sprout },
    { id: 'summer', src: '/seasons/summer.jpeg', Icon: Sun },
    { id: 'autumn', src: '/seasons/fall.jpeg', Icon: Leaf },
    { id: 'winter', src: '/seasons/winter.jpeg', Icon: Snowflake },
  ],
};

const FRAMES: Frame[] = [NOVOWYR, SEASONS];
const AUTOPLAY_MS = 4500;

export default function Variations() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#ece6db] [font-family:'Inter_Tight',sans-serif]">
      <div className="absolute inset-0 grid grid-cols-2 items-center gap-6 px-8 py-10">
        {FRAMES.map((frame) => (
          <CrossfadeFrame key={frame.id} frame={frame} />
        ))}
      </div>
    </div>
  );
}

function CrossfadeFrame({ frame }: { frame: Frame }) {
  const [active, setActive] = useState<string>(frame.items[0].id);
  // Cycle on the gallery card and until the user takes manual control.
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => {
      setActive((prev) => {
        const i = frame.items.findIndex((s) => s.id === prev);
        return frame.items[(i + 1) % frame.items.length].id;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoplay, frame]);

  function pick(id: string) {
    setActive(id);
    setAutoplay(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4">
      <div
        className="relative min-h-0 w-auto max-w-full overflow-hidden rounded-[2px] bg-stone-200 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_30px_80px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black/5"
        style={{ height: '100%', aspectRatio: frame.aspectRatio }}
      >
        {frame.items.map((s) => (
          <img
            key={s.id}
            src={s.src}
            alt={`${frame.id} — ${s.id}`}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)] select-none"
            style={{ opacity: active === s.id ? 1 : 0 }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/80 p-1.5 shadow-xl shadow-black/10 backdrop-blur">
        {frame.items.map((s) => {
          const isActive = active === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              aria-label={s.id}
              aria-pressed={isActive}
              className={
                'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ' +
                (isActive
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-900')
              }
            >
              {isActive && (
                <motion.span
                  layoutId={`variations-pill-${frame.id}`}
                  className="absolute inset-0 rounded-full bg-neutral-900"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <s.Icon
                className="relative z-10 h-[18px] w-[18px]"
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>

      {frame.credit && <CreditPill credit={frame.credit} />}
    </div>
  );
}

const PILL_CLASSNAME =
  'inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] shadow-md shadow-black/5 backdrop-blur transition hover:bg-white';

function CreditPill({ credit }: { credit: FrameCredit }) {
  const inPreview = useIsInPreview();
  const inner = (
    <>
      <span className="text-neutral-500">{credit.label}</span>
      <span className="text-neutral-900">{credit.source}</span>
      {credit.href && (
        <ArrowUpRight
          className="h-2.5 w-2.5 text-neutral-500"
          strokeWidth={2.5}
        />
      )}
    </>
  );
  return credit.href && !inPreview ? (
    <a
      href={credit.href}
      target="_blank"
      rel="noreferrer"
      className={PILL_CLASSNAME}
    >
      {inner}
    </a>
  ) : (
    <span className={PILL_CLASSNAME}>{inner}</span>
  );
}

