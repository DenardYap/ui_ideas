import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { ideas } from '@/ideas';
import { matchesQuery, type Idea } from '@/lib/ideas';
import { useCommandPaletteStore } from '@/stores/command-palette-store';

const RESULT_LIMIT = 8;

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const close = useCommandPaletteStore((s) => s.close);

  // Global Cmd/Ctrl+K listener — always mounted so the shortcut works on any route.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCmdK =
        (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
      if (!isCmdK) return;
      e.preventDefault();
      setOpen(!useCommandPaletteStore.getState().open);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  return (
    <AnimatePresence>
      {open && <Palette onClose={close} />}
    </AnimatePresence>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo<Idea[]>(() => {
    const q = query.trim();
    const matches = q ? ideas.filter((i) => matchesQuery(i, q)) : ideas;
    return matches.slice(0, RESULT_LIMIT);
  }, [query]);

  // Reset highlight whenever the result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Focus the input on open and lock body scroll while the palette is up.
  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Keep the highlighted row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function go(idea: Idea) {
    onClose();
    navigate(`/idea/${idea.slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) =>
        results.length === 0 ? 0 : (i - 1 + results.length) % results.length,
      );
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const idea = results[activeIndex];
      if (idea) go(idea);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[14vh] sm:pt-[18vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onKeyDown={onKeyDown}
    >
      <motion.button
        type="button"
        onClick={onClose}
        aria-label="Close command palette"
        className="absolute inset-0 cursor-default bg-ink/55 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Find an idea"
        className="relative w-full max-w-[640px] overflow-hidden rounded-[3px] border border-ink/15 bg-paper shadow-[0_30px_120px_-20px_rgba(20,17,15,0.55)]"
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.99 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* search field */}
        <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
          <Search
            className="h-4 w-4 flex-none text-ink-muted"
            strokeWidth={1.75}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, tag, vibe …"
            aria-label="Search ideas"
            className="min-w-0 flex-1 bg-transparent font-display text-[19px] font-light tracking-[-0.005em] text-ink placeholder:text-ink-muted/60 focus:outline-none"
          />
          <kbd className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted sm:inline">
            esc
          </kbd>
        </div>

        {/* meta strip */}
        <div className="flex items-center justify-between border-b border-ink/10 bg-paper-dark/40 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-muted">
          <span>{query.trim() ? 'Matches' : 'All specimens'}</span>
          <span>
            {results.length}/{ideas.length}
          </span>
        </div>

        {/* results */}
        <div
          ref={listRef}
          className="max-h-[min(56vh,420px)] overflow-y-auto py-1"
        >
          {results.length === 0 ? (
            <EmptyRow query={query} />
          ) : (
            results.map((idea, i) => (
              <ResultRow
                key={idea.slug}
                idea={idea}
                index={i}
                active={i === activeIndex}
                onSelect={() => go(idea)}
                onHover={() => setActiveIndex(i)}
              />
            ))
          )}
        </div>

        {/* footer: keyboard hints */}
        <div className="flex items-center justify-between border-t border-ink/10 bg-paper-dark/40 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          <div className="flex items-center gap-4">
            <Hint label="Open">
              <CornerDownLeft className="h-3 w-3" strokeWidth={2} />
            </Hint>
            <Hint label="Navigate">
              <span aria-hidden>↑</span>
              <span aria-hidden>↓</span>
            </Hint>
            <Hint label="Close">esc</Hint>
          </div>
          <span className="hidden sm:inline">UI Ideas catalog</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultRow({
  idea,
  index,
  active,
  onSelect,
  onHover,
}: {
  idea: Idea;
  index: number;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const num = String(
    ideas.findIndex((i) => i.slug === idea.slug) + 1,
  ).padStart(3, '0');

  return (
    <button
      type="button"
      data-index={index}
      onClick={onSelect}
      onMouseMove={onHover}
      className={
        'group flex w-full items-center gap-4 px-5 py-3 text-left transition-colors ' +
        (active ? 'bg-ink/[0.06]' : 'hover:bg-ink/[0.04]')
      }
    >
      <span className="w-10 flex-none font-mono text-[10.5px] tracking-[0.18em] text-ink-muted">
        N°{num}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[18px] font-light leading-tight tracking-[-0.005em] text-ink">
          {idea.name}
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-ink-muted">
          {idea.blurb}
        </span>
      </span>
      <span className="hidden flex-none items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted/80 md:inline-flex">
        {idea.tags.slice(0, 2).map((t) => (
          <span key={t}>#{t}</span>
        ))}
      </span>
      <CornerDownLeft
        className={
          'h-3.5 w-3.5 flex-none transition-opacity ' +
          (active ? 'text-ink opacity-100' : 'text-ink-muted opacity-0')
        }
        strokeWidth={2}
      />
    </button>
  );
}

function EmptyRow({ query }: { query: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-ink-muted">
        Nothing in the drawer
      </div>
      <p className="mt-2 font-display text-[17px] font-light italic text-ink-soft">
        {query.trim()
          ? `No specimens match “${query.trim()}”.`
          : 'No specimens to show.'}
      </p>
    </div>
  );
}

function Hint({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded border border-ink/15 bg-paper px-1.5 py-0.5 text-ink-soft">
        {children}
      </span>
      <span>{label}</span>
    </span>
  );
}
