import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ClipboardCopy } from 'lucide-react';
import { getIdeaBySlug } from '@/ideas';
import type { IdeaCredit } from '@/lib/ideas';
import { usePromptStore } from '@/stores/prompt-store';
import { PromptModal } from '@/components/prompt-modal';

export function IdeaPage() {
  const { slug } = useParams<{ slug: string }>();
  const idea = slug ? getIdeaBySlug(slug) : undefined;
  const openPrompt = usePromptStore((s) => s.open);

  if (!idea) return <NotFound />;
  const { Component, credits } = idea;

  return (
    <div className="relative h-full w-full">
      {/* The idea fills the viewport. */}
      <div className="absolute inset-0">
        <Component />
      </div>

      {/* Floating chrome — sits in a stacked column at top-left so it
          never collides with the idea's own UI. */}
      <div className="pointer-events-none absolute left-4 top-4 z-50 flex flex-col items-start gap-2">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.25em] text-neutral-900 shadow-lg shadow-black/5 backdrop-blur transition hover:bg-white"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />
          Catalog
        </Link>
        <span className="pointer-events-none rounded-full bg-black/70 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.25em] text-white backdrop-blur">
          {idea.name}
        </span>
        <button
          type="button"
          onClick={() => openPrompt(idea.slug)}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.25em] text-neutral-900 shadow-lg shadow-black/5 backdrop-blur transition hover:bg-white"
        >
          <ClipboardCopy className="h-3 w-3" strokeWidth={2.5} />
          Copy prompt
        </button>
        {credits?.map((c, i) => (
          <CreditPill key={`${c.source}-${i}`} credit={c} />
        ))}
      </div>

      <PromptModal />
    </div>
  );
}

function CreditPill({ credit }: { credit: IdeaCredit }) {
  const inner = (
    <>
      <span className="text-neutral-500">{credit.label}</span>
      <span className="text-neutral-900">{credit.source}</span>
      {credit.url && <ArrowUpRight className="h-2.5 w-2.5 text-neutral-500" strokeWidth={2.5} />}
    </>
  );
  const className =
    'pointer-events-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] shadow-md shadow-black/5 backdrop-blur transition hover:bg-white';
  return credit.url ? (
    <a href={credit.url} target="_blank" rel="noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <span className={className}>{inner}</span>
  );
}

function NotFound() {
  return (
    <div className="paper-grain flex min-h-full items-center justify-center px-6 text-center">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">
          404 · Specimen not found
        </div>
        <h1 className="mt-4 font-display text-7xl font-light italic text-ink">
          Out of the drawer.
        </h1>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-ink hover:bg-ink hover:text-paper"
        >
          <ArrowLeft className="h-3 w-3" /> Back to catalog
        </Link>
      </div>
    </div>
  );
}
