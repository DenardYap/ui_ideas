import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { PREVIEW_HEIGHT, PREVIEW_WIDTH } from '@/lib/ideas';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
  /** Disable interaction; cards typically want this on. */
  interactive?: boolean;
};

/**
 * Renders an idea at a fixed design viewport (1280x800) and CSS-scales it
 * to fill the parent container. The container preserves the design aspect ratio
 * so the preview is always pixel-faithful, just shrunk.
 */
export function IdeaPreview({ children, className, interactive = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => {
      const { width } = node.getBoundingClientRect();
      if (width > 0) setScale(width / PREVIEW_WIDTH);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-white', className)}
      style={{ aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}` }}
    >
      <div
        style={{
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
