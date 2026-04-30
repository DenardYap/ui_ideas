import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

type Card = {
  n: string;
  title: string;
  tag: string;
  time: string;
  excerpt: string;
  accent: string;
};

const CARDS: Card[] = [
  {
    n: '01',
    title: 'Why we let things go cold and warm again',
    tag: 'Field Notes',
    time: '14 min',
    accent: '#a73f29',
    excerpt:
      'An essay on routines, rhythms, and the small heat of returning attention to things you thought you had finished with.',
  },
  {
    n: '02',
    title: 'A taxonomy of small kindnesses',
    tag: 'Notes',
    time: '8 min',
    accent: '#d4a73c',
    excerpt:
      'Holding doors. Texting back. The art of meeting someone exactly where the day has left them.',
  },
  {
    n: '03',
    title: 'On afternoons that refuse to end',
    tag: 'Reading',
    time: '11 min',
    accent: '#6a8c6e',
    excerpt:
      'Three writers on time, attention, and the particular slowness of light between four and five.',
  },
  {
    n: '04',
    title: 'What the hands learn before the eyes',
    tag: 'Practice',
    time: '6 min',
    accent: '#7a8aa8',
    excerpt:
      'Notes from a pottery studio: muscle memory, embodied knowledge, and trusting the body to lead.',
  },
  {
    n: '05',
    title: 'Postcards from a city without weather',
    tag: 'Travel',
    time: '9 min',
    accent: '#b86843',
    excerpt:
      'Three days in a place where the temperature never moves. What changes when nothing in the air does.',
  },
  {
    n: '06',
    title: 'The room you forget you keep',
    tag: 'Memory',
    time: '12 min',
    accent: '#5a4a3c',
    excerpt:
      'On the small rooms in our lives we maintain without quite meaning to. Sheds, drawers, group chats.',
  },
  {
    n: '07',
    title: 'Light, before language',
    tag: 'Photography',
    time: '7 min',
    accent: '#a73f29',
    excerpt:
      'Why some photographs feel older than the words we use to describe them.',
  },
  {
    n: '08',
    title: 'A brief history of the metronome',
    tag: 'Sound',
    time: '15 min',
    accent: '#d4a73c',
    excerpt:
      'Mechanical pulse, drift, the weird politics of keeping time together. From wind-up to atomic.',
  },
  {
    n: '09',
    title: 'Things that are quiet but not silent',
    tag: 'Listening',
    time: '5 min',
    accent: '#6a8c6e',
    excerpt:
      'A short field guide to the audible textures we tune out: refrigerators, distant trains, breath.',
  },
  {
    n: '10',
    title: 'The shape of habit, slowed down',
    tag: 'Practice',
    time: '10 min',
    accent: '#7a8aa8',
    excerpt:
      'What you find when you film a routine and play it back at one-quarter speed.',
  },
  {
    n: '11',
    title: 'Index of moments not yet named',
    tag: 'Glossary',
    time: '4 min',
    accent: '#b86843',
    excerpt:
      'A growing list of common feelings we have no single English word for. Open submissions.',
  },
  {
    n: '12',
    title: 'On finishing for the wrong reasons',
    tag: 'Field Notes',
    time: '9 min',
    accent: '#5a4a3c',
    excerpt:
      'When stubbornness, deadlines, and momentum complete a project. What we owe ourselves to admit.',
  },
];

const AUTO_SPEED = 110;        // pixels per second of idle drift
const IDLE_BEFORE_AUTO = 1500; // ms after last user input before resuming auto-scroll
const MAX_TILT_DEG = 60;
const SCALE_FALLOFF = 0.18;
const OPACITY_FALLOFF = 0.85;

export default function Revolve() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
    let lastT = performance.now();
    let lastUserInput = 0;
    let direction = 1;

    function markUserInput() {
      lastUserInput = performance.now();
    }

    function tick(t: number) {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;

      if (!scroller) return;
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

      // Per-card transform based on distance from viewport center
      const rect = scroller.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const halfH = rect.height / 2;

      for (const card of cardsRef.current) {
        if (!card) continue;
        const cr = card.getBoundingClientRect();
        const cardCenter = cr.top + cr.height / 2;
        const dist = (cardCenter - centerY) / halfH;
        const clamped = Math.max(-1.4, Math.min(1.4, dist));
        const abs = Math.abs(clamped);

        const rotation = clamped * MAX_TILT_DEG;
        const scale = Math.max(0.4, 1 - abs * SCALE_FALLOFF);
        const opacity = Math.max(0, 1 - abs * OPACITY_FALLOFF);

        card.style.transform = `rotateX(${rotation}deg) scale(${scale})`;
        card.style.opacity = String(opacity);
      }

      raf = requestAnimationFrame(tick);
    }

    scroller.addEventListener('wheel', markUserInput, { passive: true });
    scroller.addEventListener('touchstart', markUserInput, { passive: true });
    scroller.addEventListener('touchmove', markUserInput, { passive: true });
    scroller.addEventListener('keydown', markUserInput);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener('wheel', markUserInput);
      scroller.removeEventListener('touchstart', markUserInput);
      scroller.removeEventListener('touchmove', markUserInput);
      scroller.removeEventListener('keydown', markUserInput);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#ece6db] [font-family:'Inter_Tight',sans-serif]">
      <div
        ref={scrollerRef}
        tabIndex={0}
        className="absolute inset-0 overflow-y-scroll outline-none [perspective:900px] [perspective-origin:50%_50%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-col items-center gap-6 px-8 py-[44vh]">
          {CARDS.map((card, i) => (
            <article
              key={card.n}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className="relative w-full max-w-[640px] overflow-hidden rounded-[3px] bg-[#faf6ed] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_60px_-30px_rgba(20,17,15,0.45)] ring-1 ring-black/[0.06] [transform-style:preserve-3d] will-change-[transform,opacity]"
              style={{ transformOrigin: '50% 50%' }}
            >
              {/* Accent stripe */}
              <div
                className="absolute inset-y-0 left-0 w-[5px]"
                style={{ background: card.accent }}
                aria-hidden
              />

              <div className="px-9 py-7 pl-11">
                <div className="flex items-baseline justify-between font-mono text-[10.5px] uppercase tracking-[0.32em] text-neutral-500">
                  <span>N° {card.n}</span>
                  <span>{card.tag}</span>
                </div>

                <h3 className="mt-5 [font-family:'Fraunces',serif] text-[34px] font-light leading-[0.98] tracking-[-0.02em] text-neutral-900">
                  {card.title}
                </h3>

                <p className="mt-3 max-w-[48ch] text-[14px] leading-relaxed text-neutral-600">
                  {card.excerpt}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-neutral-200/80 pt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  <span>{card.time} · Read</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 text-neutral-700"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Top + bottom fade so cards revolving off-screen dissolve into the surface */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#ece6db] via-[#ece6db]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#ece6db] via-[#ece6db]/80 to-transparent" />

      {/* Scroll hint, low contrast */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-700/45 select-none">
        <span>scroll · revolve</span>
      </div>
    </div>
  );
}
