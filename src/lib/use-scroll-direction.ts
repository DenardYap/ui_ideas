import { useEffect, useState } from 'react';

export type ScrollDirection = 'up' | 'down';

type Options = {
  /** Min pixels of movement before the direction flips. Avoids jitter. */
  threshold?: number;
  /** Always treat scrolls within this many px of the top as 'up'. */
  topOffset?: number;
};

/**
 * Tracks the dominant vertical scroll direction of the window.
 * Defaults to `'up'` so chrome is visible on initial render.
 */
export function useScrollDirection({
  threshold = 8,
  topOffset = 32,
}: Options = {}): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('up');

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (y < topOffset) {
        setDirection('up');
        lastY = y;
      } else if (Math.abs(delta) >= threshold) {
        setDirection(delta > 0 ? 'down' : 'up');
        lastY = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, topOffset]);

  return direction;
}
