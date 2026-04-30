import type { Idea } from '@/lib/ideas';
import Pyre from './pyre';
import Variations from './variations';
import Drift from './drift';
import Revolve from './revolve';
import NeonTerminal from './neon-terminal';
import BrutalistPortfolio from './brutalist-portfolio';
import AuroraOnboarding from './aurora-onboarding';

/**
 * Add a new UI idea by:
 *   1. dropping a folder into `src/ideas/<your-slug>/index.tsx`
 *      — the component should fill its container (`h-full w-full`).
 *   2. importing it here and adding an entry to this array.
 */
export const ideas: Idea[] = [
  {
    slug: 'pyre',
    name: 'Pyre',
    blurb:
      'Geometric coals on a dark hearth. Wave the cursor to fan the heat — click to ignite a burst of embers.',
    tags: ['canvas', 'physics', 'particles', 'fire', 'interactive', 'dark'],
    date: '2026-04-30',
    accent: '#ff7a1f',
    credits: [
      {
        label: 'Inspired by',
        source: 'Shift Nudge',
        url: 'https://shiftnudge.com',
      },
    ],
    Component: Pyre,
  },
  {
    slug: 'variations',
    name: 'Variations',
    blurb:
      'The same frame, different states. Pictures that share a composition crossfade in place — light flips on, seasons turn, sides swap — making the world feel like it changes without moving.',
    tags: ['interactive', 'crossfade', 'photography', 'minimal'],
    date: '2026-04-30',
    accent: '#a73f29',
    Component: Variations,
  },
  {
    slug: 'drift',
    name: 'Drift',
    blurb:
      'Scroll to fall forward through a field of shapes — they zoom toward you and fade out as new ones appear from the distance.',
    tags: ['canvas', 'scroll', 'parallax', 'animation', 'shapes', 'dark'],
    date: '2026-04-30',
    accent: '#d4a73c',
    Component: Drift,
  },
  {
    slug: 'revolve',
    name: 'Revolve',
    blurb:
      'A vertical wheel of editorial cards. Scroll and each one tilts up into view, faces you for a beat, then falls back over the top.',
    tags: ['scroll', '3d', 'editorial', 'parallax', 'cards', 'minimal'],
    date: '2026-04-30',
    accent: '#a73f29',
    Component: Revolve,
  },
  {
    slug: 'neon-terminal',
    name: 'Neon Terminal',
    blurb: 'A dense, after-hours trading desk. Live tickers, glowing charts, log spew.',
    tags: ['dashboard', 'dark', 'data', 'monospace', 'animated'],
    date: '2026-04-30',
    accent: '#34d399',
    Component: NeonTerminal,
  },
  {
    slug: 'brutalist-portfolio',
    name: 'Concrete Suite',
    blurb: 'A typographic, no-nonsense studio index. All edges, no filler.',
    tags: ['portfolio', 'editorial', 'brutalist', 'typography'],
    date: '2026-04-29',
    accent: '#111111',
    Component: BrutalistPortfolio,
  },
  {
    slug: 'aurora-onboarding',
    name: 'Aurora Onboarding',
    blurb: 'A warm, soft-light first run. Gradient sky, glass cards, gentle pacing.',
    tags: ['onboarding', 'soft', 'gradient', 'glassmorphism', 'mobile'],
    date: '2026-04-28',
    accent: '#a78bfa',
    Component: AuroraOnboarding,
  },
];

export function getIdeaBySlug(slug: string): Idea | undefined {
  return ideas.find((i) => i.slug === slug);
}
