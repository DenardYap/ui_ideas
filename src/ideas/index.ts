import type { Idea } from '@/lib/ideas';
import Pyre from './pyre';
import Tide from './tide';
import Lumen from './lumen';
import Loam from './loam';
import Volt from './volt';
import Variations from './variations';
import Drift from './drift';
import Revolve from './revolve';
import Orbit from './orbit';
import Relief from './relief';
import Strata from './strata';
import Flatland from './flatland';
import Tincture from './tincture';
import Verso from './verso';
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
      'Geometric coals on a dark hearth. Wave the cursor to fan the heat. Click to ignite a burst of embers.',
    tags: ['canvas', 'physics', 'particles', 'fire', 'interactive', 'dark'],
    concepts: ['motion', 'color', 'interaction'],
    usages: ['hero'],
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
    slug: 'tide',
    name: 'Tide',
    blurb:
      'The same composition as Pyre, submerged. Drift the cursor to leave ripples on the surface. Click to drop a stone: wavefronts race outward, foam jumps, and the stones below catch the light.',
    tags: ['canvas', 'physics', 'water', 'ripples', 'interactive', 'dark'],
    concepts: ['motion', 'color', 'interaction', 'texture'],
    usages: ['hero'],
    date: '2026-04-30',
    accent: '#2db4cf',
    credits: [
      {
        label: 'Inspired by',
        source: 'Shift Nudge',
        url: 'https://shiftnudge.com',
      },
    ],
    Component: Tide,
  },
  {
    slug: 'lumen',
    name: 'Lumen',
    blurb:
      'Pyre re-lit. The cursor is a single warm lamp, and every shape throws a real 2D shadow polygon away from it. Wander the dark room, watch dust drift through the beam, click to flare.',
    tags: ['canvas', 'physics', 'light', 'shadow', 'interactive', 'dark'],
    concepts: ['light', 'shadow', 'motion', 'interaction'],
    usages: ['hero'],
    date: '2026-04-30',
    accent: '#f0b85c',
    credits: [
      {
        label: 'Inspired by',
        source: 'Shift Nudge',
        url: 'https://shiftnudge.com',
      },
    ],
    Component: Lumen,
  },
  {
    slug: 'loam',
    name: 'Loam',
    blurb:
      'Pyre, but the world is granular. Sand falls grain by grain through a cellular automaton, piling up against the buried shapes. Drag to dig and push the dunes. Hold to pour a fresh load.',
    tags: ['canvas', 'physics', 'sand', 'cellular-automaton', 'interactive'],
    concepts: ['motion', 'interaction', 'texture'],
    usages: ['hero'],
    date: '2026-04-30',
    accent: '#a86238',
    credits: [
      {
        label: 'Inspired by',
        source: 'Shift Nudge',
        url: 'https://shiftnudge.com',
      },
    ],
    Component: Loam,
  },
  {
    slug: 'volt',
    name: 'Volt',
    blurb:
      'Pyre electrified. The cursor is a charged probe. Fractal arcs leap to the nearest conductor and leave it glowing with stored plasma. Click to summon a fork-bolt from the storm above.',
    tags: ['canvas', 'physics', 'lightning', 'fractal', 'interactive', 'dark'],
    concepts: ['light', 'motion', 'color', 'interaction'],
    usages: ['hero'],
    date: '2026-04-30',
    accent: '#9eb1ff',
    credits: [
      {
        label: 'Inspired by',
        source: 'Shift Nudge',
        url: 'https://shiftnudge.com',
      },
    ],
    Component: Volt,
  },
  {
    slug: 'variations',
    name: 'Variations',
    blurb:
      'The same frame, different states. Pictures that share a composition crossfade in place: light flips on, seasons turn, sides swap. The world changes without ever moving.',
    tags: ['interactive', 'crossfade', 'photography', 'minimal'],
    concepts: ['motion', 'interaction', 'layout'],
    usages: ['gallery', 'showcase'],
    date: '2026-04-30',
    accent: '#a73f29',
    Component: Variations,
  },
  {
    slug: 'drift',
    name: 'Drift',
    blurb:
      'Scroll to fall forward through a field of shapes. They zoom toward you and fade out as new ones appear from the distance.',
    tags: ['canvas', 'scroll', 'parallax', 'animation', 'shapes', 'dark'],
    concepts: ['motion', 'depth', 'interaction'],
    usages: ['hero', 'landing-page'],
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
    concepts: ['motion', '3d', 'depth', 'layout'],
    usages: ['gallery', 'showcase'],
    date: '2026-04-30',
    accent: '#a73f29',
    Component: Revolve,
  },
  {
    slug: 'orbit',
    name: 'Orbit',
    blurb:
      'A wheel of observation cards that swings in from the left, dives through the bottom of the screen, and arcs back out on the right.',
    tags: ['scroll', '3d', 'arc', 'cards', 'astronomy', 'dark'],
    concepts: ['motion', '3d', 'depth', 'layout'],
    usages: ['gallery', 'showcase'],
    date: '2026-04-30',
    accent: '#9bb0d8',
    Component: Orbit,
  },
  {
    slug: 'relief',
    name: 'Relief',
    blurb:
      'A wall of architectural panels, some raised and some inset. Your cursor is the light source, so every edge highlight and drop shadow reorients as you move. Click a panel to flip its state.',
    tags: ['depth', 'light', 'shadow', 'interactive', 'panels', 'architectural'],
    concepts: ['light', 'shadow', 'depth', 'interaction'],
    usages: ['gallery', 'showcase'],
    date: '2026-04-30',
    accent: '#ead9b4',
    credits: [
      {
        label: 'Inspired by',
        source: 'Refactoring UI — Depth',
        url: 'https://www.refactoringui.com',
      },
    ],
    Component: Relief,
  },
  {
    slug: 'strata',
    name: 'Strata',
    blurb:
      'Five elevation tiers in one card. Drag it up to lift it off the page. The two-part shadow grows while the tight ambient shadow underneath fades as it climbs, the way light really behaves.',
    tags: ['depth', 'elevation', 'shadow', 'drag', 'system', 'minimal'],
    concepts: ['shadow', 'depth', 'interaction'],
    usages: ['card'],
    date: '2026-04-30',
    accent: '#d4a73c',
    credits: [
      {
        label: 'Inspired by',
        source: 'Refactoring UI — Depth',
        url: 'https://www.refactoringui.com',
      },
    ],
    Component: Strata,
  },
  {
    slug: 'flatland',
    name: 'Flatland',
    blurb:
      'Depth without any blur. A monochrome grid where lighter tiles feel raised off the surface and darker ones feel inset, with solid offset shadows on the top tiers for a flat-design z-axis.',
    tags: ['depth', 'flat', 'color', 'monochrome', 'shadow', 'tiles'],
    concepts: ['shadow', 'depth', 'color'],
    usages: ['gallery', 'dashboard'],
    date: '2026-04-30',
    accent: '#e39672',
    credits: [
      {
        label: 'Inspired by',
        source: 'Refactoring UI — Depth',
        url: 'https://www.refactoringui.com',
      },
    ],
    Component: Flatland,
  },
  {
    slug: 'tincture',
    name: 'Tincture',
    blurb:
      'A specimen sheet of twelve pigments. Each shape (triangle, hexagon, arch, star) is filled with discrete HSL lightness bands of a single hue, so the interior reads as a gradient frozen at a shadow angle. Click any specimen to rotate its hue.',
    tags: ['color', 'hsl', 'palette', 'specimen', 'gradient', 'editorial'],
    concepts: ['color', 'gradient', 'interaction'],
    usages: ['showcase', 'gallery'],
    date: '2026-04-30',
    accent: '#e39672',
    Component: Tincture,
  },
  {
    slug: 'verso',
    name: 'Verso',
    blurb:
      'A studio shell with the index pinned to the left margin. Pieces auto-cycle and crossfade in a parenthesised plate. Toggle Plate, Strip, or Index to fit a portfolio, a catalog, or a contact sheet of work.',
    tags: ['portfolio', 'editorial', 'navigation', 'left-rail', 'showcase', 'paper'],
    concepts: ['typography', 'layout', 'motion'],
    usages: ['portfolio', 'navigation', 'showcase'],
    date: '2026-04-30',
    accent: '#1a1815',
    credits: [
      {
        label: 'Inspired by',
        source: 'Obys Agency',
        url: 'https://obys.agency',
      },
    ],
    Component: Verso,
  },
  {
    slug: 'neon-terminal',
    name: 'Neon Terminal',
    blurb: 'A dense, after-hours trading desk. Live tickers, glowing charts, log spew.',
    tags: ['dashboard', 'dark', 'data', 'monospace', 'animated'],
    concepts: ['typography', 'color', 'motion'],
    usages: ['dashboard'],
    date: '2026-04-30',
    accent: '#34d399',
    Component: NeonTerminal,
  },
  {
    slug: 'brutalist-portfolio',
    name: 'Concrete Suite',
    blurb: 'A typographic, no-nonsense studio index. All edges, no filler.',
    tags: ['portfolio', 'editorial', 'brutalist', 'typography'],
    concepts: ['typography', 'layout'],
    usages: ['portfolio', 'landing-page'],
    date: '2026-04-29',
    accent: '#111111',
    Component: BrutalistPortfolio,
  },
  {
    slug: 'aurora-onboarding',
    name: 'Aurora Onboarding',
    blurb: 'A warm, soft-light first run. Gradient sky, glass cards, gentle pacing.',
    tags: ['onboarding', 'soft', 'gradient', 'glassmorphism', 'mobile'],
    concepts: ['gradient', 'color', 'light'],
    usages: ['onboarding', 'mobile'],
    date: '2026-04-28',
    accent: '#a78bfa',
    Component: AuroraOnboarding,
  },
];

export function getIdeaBySlug(slug: string): Idea | undefined {
  return ideas.find((i) => i.slug === slug);
}
