import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ClipboardCopy, X } from 'lucide-react';
import { usePromptStore } from '@/stores/prompt-store';
import { getIdeaBySlug } from '@/ideas';
import { buildPrompt, getReferenceImageUrl } from '@/lib/prompt';
import type { Idea } from '@/lib/ideas';

export function PromptModal() {
  const slug = usePromptStore((s) => s.slug);
  const close = usePromptStore((s) => s.close);
  const idea = slug ? getIdeaBySlug(slug) : undefined;

  useEffect(() => {
    if (!idea) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [idea, close]);

  return (
    <AnimatePresence>
      {idea && <Sheet idea={idea} onClose={close} />}
    </AnimatePresence>
  );
}

function Sheet({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  // Built lazily on open so window.location is read after route mounts.
  const prompt = useMemo(() => buildPrompt(idea), [idea]);
  const imageUrl = useMemo(() => getReferenceImageUrl(idea), [idea]);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail in non-secure contexts; surface a fallback.
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-ink/55 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Copy prompt for ${idea.name}`}
        className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-[3px] border border-ink/15 bg-paper shadow-[0_30px_120px_-20px_rgba(20,17,15,0.55)]"
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-ink-muted">
              Copy as prompt · {idea.slug}
            </div>
            <h2 className="mt-2 font-display text-3xl font-light italic leading-tight text-ink">
              Recreate “{idea.name}”
            </h2>
            <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink-muted">
              Paste this into Cursor (or any coding agent) to rebuild the
              specimen. The reference image and full source are included.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-ink/5 hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* meta strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ink/10 bg-paper-dark/40 px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: idea.accent ?? 'var(--color-ink-muted)' }}
              aria-hidden
            />
            {imageUrl ? 'Reference image attached' : 'No screenshot · live demo only'}
          </span>
          <span aria-hidden>·</span>
          <span>{idea.tags.slice(0, 4).map((t) => `#${t}`).join('  ')}</span>
        </div>

        {/* prompt body */}
        <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words px-6 py-5 font-mono text-[11.5px] leading-[1.6] text-ink-soft">
          {prompt}
        </pre>

        {/* actions */}
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-paper-dark/40 px-6 py-4">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.25em] text-ink-muted">
            {prompt.length.toLocaleString()} chars
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-ink/15 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.25em] text-ink-muted transition hover:border-ink/40 hover:text-ink"
            >
              Close
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.25em] text-paper transition hover:bg-accent"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3 w-3" strokeWidth={2.5} />
                  Copy prompt
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
