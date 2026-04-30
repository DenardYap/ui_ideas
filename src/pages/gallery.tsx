import { useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { ideas } from '@/ideas';
import { matchesFilters, matchesQuery } from '@/lib/ideas';
import { useGalleryStore } from '@/stores/gallery-store';
import { IdeaCard } from '@/components/idea-card';
import { SearchBar } from '@/components/search-bar';
import {
  FilterPanel,
  FilterReset,
  FilterToggle,
} from '@/components/filter-bar';
import { GithubStarsPill } from '@/components/github-stars-pill';
import { useCommandPaletteStore } from '@/stores/command-palette-store';

export function GalleryPage() {
  const query = useGalleryStore((s) => s.query);
  const concepts = useGalleryStore((s) => s.concepts);
  const usages = useGalleryStore((s) => s.usages);
  const clearAll = useGalleryStore((s) => s.clearAll);
  const openPalette = useCommandPaletteStore((s) => s.setOpen);

  const filtered = useMemo(
    () =>
      ideas.filter(
        (i) =>
          matchesQuery(i, query) && matchesFilters(i, { concepts, usages }),
      ),
    [query, concepts, usages],
  );

  const hasActiveFilters = concepts.length + usages.length > 0;

  return (
    <div className="paper-grain min-h-full">
      <GithubStarsPill />
      <div className="mx-auto max-w-[1320px] px-8 pt-14 pb-24 sm:px-12 lg:px-16">
        {/* masthead */}
        <header className="grid grid-cols-12 items-end gap-6 pb-8">
          <div className="col-span-12 lg:col-span-9">
            <h1 className="mt-5 font-display text-[clamp(32px,5vw,64px)] font-light leading-[0.88] tracking-[-0.035em] text-ink">
              UI Ideas
              <span className="ml-3 align-top font-mono text-base font-normal tracking-[0.2em] text-ink-muted">
                №{String(ideas.length).padStart(2, '0')}
              </span>
            </h1>
            <p className="mt-6 max-w-[58ch] font-display text-[19px] font-light italic leading-relaxed text-ink-soft">
              A small, growing room of interface specimens.
            </p>
          </div>

        </header>

        {/* Toolbar: two independent bands, each with its own top/bottom rule
            and a small horizontal gap between them so they read as separate
            controls. The filter panel only opens within its own column. */}
        <div className="grid grid-cols-1 items-start gap-x-6 md:grid-cols-[1fr_minmax(280px,38%)]">
          <div className="flex h-11 items-center border-y border-ink/15">
            <SearchBar
              resultCount={filtered.length}
              totalCount={ideas.length}
            />
          </div>
          <div className="border-y border-ink/15">
            <div className="flex h-11 items-center justify-between gap-4">
              <FilterToggle />
              <FilterReset />
            </div>
            <FilterPanel ideas={ideas} />
          </div>
        </div>

        {/* grid */}
        <main className="mt-12">
          {filtered.length === 0 ? (
            <EmptyState
              query={query}
              hasActiveFilters={hasActiveFilters}
              onReset={clearAll}
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((idea, i) => (
                  <IdeaCard key={idea.slug} idea={idea} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        <footer className="mt-24 flex items-center justify-between border-t border-ink/15 pt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted">
          <span>End of catalog</span>
          <button
            type="button"
            onClick={() => openPalette(true)}
            className="inline-flex items-center gap-2 transition hover:text-ink"
          >
            <span>Quick find</span>
            <kbd className="inline-flex items-center gap-0.5 rounded border border-ink/15 bg-paper px-1.5 py-0.5 text-[10px] tracking-[0.18em] text-ink-soft">
              <span aria-hidden>⌘</span>
              <span>K</span>
            </kbd>
          </button>
        </footer>
      </div>
    </div>
  );
}

function EmptyState({
  query,
  hasActiveFilters,
  onReset,
}: {
  query: string;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  const message = query
    ? `No specimens match “${query}”.`
    : 'No specimens match these filters.';
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">
        Nothing in the drawer
      </div>
      <p className="mt-4 max-w-md font-display text-3xl font-light italic text-ink-soft">
        {message}
      </p>
      {(query || hasActiveFilters) && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 rounded-full border border-ink/30 px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.25em] text-ink transition hover:bg-ink hover:text-paper"
        >
          Reset everything
        </button>
      )}
    </div>
  );
}
