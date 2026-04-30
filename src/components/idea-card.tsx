import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Idea } from '@/lib/ideas';
import { IdeaPreview } from './idea-preview';

type Props = {
  idea: Idea;
  index: number;
};

export function IdeaCard({ idea, index }: Props) {
  const num = String(index + 1).padStart(3, '0');
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        to={`/idea/${idea.slug}`}
        className="group block focus-visible:outline-none"
      >
        {/* preview frame */}
        <div className="relative overflow-hidden rounded-[2px] border border-ink/10 bg-white shadow-[0_1px_0_rgba(20,17,15,0.04),0_18px_40px_-30px_rgba(20,17,15,0.45)] transition duration-500 group-hover:translate-y-[-2px] group-hover:shadow-[0_1px_0_rgba(20,17,15,0.04),0_28px_60px_-30px_rgba(20,17,15,0.55)]">
          <IdeaPreview>
            <idea.Component />
          </IdeaPreview>
          {/* hover veil */}
          <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-ink/40 via-ink/0 to-ink/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <span className="m-4 inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-ink">
              Open specimen <span aria-hidden>→</span>
            </span>
          </div>
        </div>

        {/* metadata */}
        <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4">
          <span className="font-mono text-[11px] tracking-[0.18em] text-ink-muted">
            N°{num}
          </span>
          <h3 className="font-display text-[22px] font-medium leading-tight tracking-[-0.01em] text-ink transition-colors group-hover:text-accent">
            {idea.name}
          </h3>
          {idea.accent && (
            <span
              className="h-3 w-3 rounded-full ring-1 ring-ink/10"
              style={{ background: idea.accent }}
              aria-hidden
            />
          )}
        </div>
        <p className="mt-1.5 max-w-[44ch] pl-[44px] text-[13.5px] leading-relaxed text-ink-muted">
          {idea.blurb}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[44px] font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-muted/80">
          <span>{idea.date}</span>
          <span aria-hidden>·</span>
          {idea.tags.slice(0, 4).map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
