import { Search, X } from 'lucide-react';
import { useGalleryStore } from '@/stores/gallery-store';

type Props = {
  resultCount: number;
  totalCount: number;
};

export function SearchBar({ resultCount, totalCount }: Props) {
  const query = useGalleryStore((s) => s.query);
  const setQuery = useGalleryStore((s) => s.setQuery);
  const clearQuery = useGalleryStore((s) => s.clearQuery);

  return (
    <div className="flex items-center gap-4 border-y border-ink/15 py-3">
      <Search className="h-4 w-4 flex-none text-ink-muted" strokeWidth={1.75} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, tag, vibe …"
        className="min-w-0 flex-1 bg-transparent font-display text-2xl font-light tracking-[-0.01em] text-ink placeholder:text-ink-muted/60 focus:outline-none"
        aria-label="Search ideas"
      />
      <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted sm:inline">
        {resultCount}/{totalCount} specimens
      </span>
      {query && (
        <button
          onClick={clearQuery}
          className="rounded-full border border-ink/20 p-1.5 text-ink-muted transition hover:bg-ink hover:text-paper"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
