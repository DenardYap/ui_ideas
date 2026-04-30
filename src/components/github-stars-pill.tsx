import { Star } from 'lucide-react';
import {
  formatStarCount,
  GITHUB_REPO,
  GITHUB_REPO_URL,
  useGithubStars,
} from '@/lib/api';
import { useScrollDirection } from '@/lib/use-scroll-direction';

/**
 * Floating GitHub repo + star count pill anchored to the top-right of the
 * viewport. Styled to match the ink-on-paper chrome used elsewhere
 * (mono uppercase, white/backdrop-blur, subtle border + shadow).
 *
 * Hides when the user scrolls down and reveals on scroll up.
 */
export function GithubStarsPill() {
  const { data: stars, isLoading, isError } = useGithubStars();
  const direction = useScrollDirection();
  const hidden = direction === 'down';

  const count =
    isLoading || isError || stars === undefined
      ? '—'
      : formatStarCount(stars);

  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`${GITHUB_REPO} on GitHub`}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      className={
        'fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.25em] text-neutral-900 shadow-lg shadow-black/5 backdrop-blur transition-all duration-300 ease-out hover:bg-white ' +
        (hidden
          ? 'pointer-events-none -translate-y-3 opacity-0'
          : 'pointer-events-auto translate-y-0 opacity-100')
      }
    >
      <GithubMark className="h-3.5 w-3.5 text-neutral-900" />
      <span className="text-neutral-500">Star</span>
      <span className="inline-flex items-center gap-1 text-neutral-900">
        <Star
          className="h-2.5 w-2.5 fill-neutral-900 text-neutral-900"
          strokeWidth={2}
        />
        {count}
      </span>
    </a>
  );
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.16-.02-2.1-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.97 0 0 .94-.3 3.09 1.15a10.7 10.7 0 0 1 5.62 0c2.15-1.45 3.09-1.15 3.09-1.15.61 1.54.23 2.68.11 2.97.72.79 1.16 1.79 1.16 3.02 0 4.33-2.63 5.28-5.14 5.56.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.05 0 .3.2.65.78.54 4.46-1.49 7.68-5.7 7.68-10.66C23.25 5.48 18.27.5 12 .5z" />
    </svg>
  );
}
