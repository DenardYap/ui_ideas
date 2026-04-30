import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import {
  CONCEPT_LABELS,
  CONCEPTS,
  USAGE_LABELS,
  USAGES,
  type Concept,
  type Idea,
  type Usage,
} from '@/lib/ideas';
import { useGalleryStore } from '@/stores/gallery-store';
import { cn } from '@/lib/utils';

/**
 * Sits inline in the toolbar (right of the search bar). A single, narrow
 * affordance: a chevron + label + active count. Opens / closes the panel.
 */
export function FilterToggle() {
  const open = useGalleryStore((s) => s.filtersOpen);
  const toggle = useGalleryStore((s) => s.toggleFiltersOpen);
  const concepts = useGalleryStore((s) => s.concepts);
  const usages = useGalleryStore((s) => s.usages);
  const totalActive = concepts.length + usages.length;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="filter-panel"
      className="group inline-flex flex-none items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.28em] text-ink-muted transition-colors hover:text-ink"
    >
      <ChevronDown
        className={cn(
          'h-3 w-3 transition-transform duration-300',
          open && 'rotate-180',
        )}
        strokeWidth={2}
      />
      <span>Filter</span>
      {totalActive > 0 && (
        <span className="text-ink normal-case tracking-[0.05em]">
          ({totalActive})
        </span>
      )}
    </button>
  );
}

/**
 * Inline reset button shown next to the toggle when there are active
 * filters. Backgroundless, mono micro-text — same vocabulary as the toggle.
 */
export function FilterReset() {
  const concepts = useGalleryStore((s) => s.concepts);
  const usages = useGalleryStore((s) => s.usages);
  const clearFilters = useGalleryStore((s) => s.clearFilters);
  const hasActive = concepts.length + usages.length > 0;
  if (!hasActive) return null;
  return (
    <button
      type="button"
      onClick={clearFilters}
      className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted transition-colors hover:text-ink"
    >
      Reset
    </button>
  );
}

type Props = {
  /** All ideas (pre-filter) — used to compute per-label counts. */
  ideas: Idea[];
};

/**
 * The animated panel that opens beneath the toolbar. Two narrow rows
 * (Concept / Usage) of plain text labels — no chips, just an underline
 * that locks in when active.
 */
export function FilterPanel({ ideas }: Props) {
  const open = useGalleryStore((s) => s.filtersOpen);
  const concepts = useGalleryStore((s) => s.concepts);
  const usages = useGalleryStore((s) => s.usages);
  const toggleConcept = useGalleryStore((s) => s.toggleConcept);
  const toggleUsage = useGalleryStore((s) => s.toggleUsage);

  const conceptCounts = useMemo(
    () => countBy(ideas, (i) => i.concepts),
    [ideas],
  );
  const usageCounts = useMemo(() => countBy(ideas, (i) => i.usages), [ideas]);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          id="filter-panel"
          key="panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-4 pt-3 pb-4">
            <FilterGroup
              label="Concept"
              items={CONCEPTS.map((id) => ({
                id,
                label: CONCEPT_LABELS[id],
                count: conceptCounts.get(id) ?? 0,
              }))}
              active={concepts}
              onToggle={(id) => toggleConcept(id as Concept)}
            />
            <FilterGroup
              label="Usage"
              items={USAGES.map((id) => ({
                id,
                label: USAGE_LABELS[id],
                count: usageCounts.get(id) ?? 0,
              }))}
              active={usages}
              onToggle={(id) => toggleUsage(id as Usage)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type Item = { id: string; label: string; count: number };

function FilterGroup({
  label,
  items,
  active,
  onToggle,
}: {
  label: string;
  items: Item[];
  active: readonly string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-baseline gap-x-5 gap-y-1.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-muted">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {items.map((item) => {
          const isActive = active.includes(item.id);
          const isEmpty = item.count === 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              aria-pressed={isActive}
              disabled={isEmpty && !isActive}
              className={cn(
                'group relative pb-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] transition-colors',
                isActive ? 'text-ink' : 'text-ink-muted/70 hover:text-ink',
                isEmpty && !isActive && 'pointer-events-none opacity-30',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'absolute inset-x-0 -bottom-px h-px origin-left transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                  isActive
                    ? 'scale-x-100 bg-ink'
                    : 'scale-x-0 bg-ink/40 group-hover:scale-x-100',
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function countBy<T, K>(items: T[], pick: (t: T) => K[]): Map<K, number> {
  const map = new Map<K, number>();
  for (const item of items) {
    for (const key of pick(item)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return map;
}
