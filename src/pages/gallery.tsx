import { useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { ideas } from '@/ideas';
import { matchesQuery } from '@/lib/ideas';
import { useGalleryStore } from '@/stores/gallery-store';
import { IdeaCard } from '@/components/idea-card';
import { SearchBar } from '@/components/search-bar';

export function GalleryPage() {
  const query = useGalleryStore((s) => s.query);

  const filtered = useMemo(
    () => ideas.filter((i) => matchesQuery(i, query)),
    [query],
  );

  return (
    <div className="paper-grain min-h-full">
      <div className="mx-auto max-w-[1320px] px-8 pt-14 pb-24 sm:px-12 lg:px-16">
        {/* masthead */}
        <header className="grid grid-cols-12 items-end gap-6 pb-8">
          <div className="col-span-12 lg:col-span-9">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Volume 01 · A working catalog</span>
            </div>
            <h1 className="mt-5 font-display text-[clamp(56px,9vw,128px)] font-light leading-[0.88] tracking-[-0.035em] text-ink">
              UI Ideas
              <span className="ml-3 align-top font-mono text-base font-normal tracking-[0.2em] text-ink-muted">
                №{String(ideas.length).padStart(2, '0')}
              </span>
            </h1>
            <p className="mt-6 max-w-[58ch] font-display text-[19px] font-light italic leading-relaxed text-ink-soft">
              A small, growing room of interface specimens. Some are finished
              thoughts, most are sketches — all live, none screenshots.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-3 lg:border-l lg:border-ink/15 lg:pl-6">
            <dl className="grid grid-cols-3 gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted lg:grid-cols-1 lg:gap-3">
              <div>
                <dt>Curator</dt>
                <dd className="mt-1 text-ink">B. Yap</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd className="mt-1 text-ink">{ideas[0]?.date ?? '—'}</dd>
              </div>
              <div>
                <dt>Edition</dt>
                <dd className="mt-1 text-ink">Open · live</dd>
              </div>
            </dl>
          </div>
        </header>

        <SearchBar resultCount={filtered.length} totalCount={ideas.length} />

        {/* grid */}
        <main className="mt-12">
          {filtered.length === 0 ? (
            <EmptyState query={query} />
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
          <span>Press / to search</span>
        </footer>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">
        Nothing in the drawer
      </div>
      <p className="mt-4 max-w-md font-display text-3xl font-light italic text-ink-soft">
        No specimens match “{query}”.
      </p>
    </div>
  );
}
