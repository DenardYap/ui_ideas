import type { ComponentType } from 'react';

export type IdeaCredit = {
  /** Short prefix label, e.g. "Inspired by", "Photography" */
  label: string;
  /** The source being credited */
  source: string;
  /** Optional external link */
  url?: string;
};

export type Idea = {
  /** URL-safe identifier, also used as route param */
  slug: string;
  /** Display name */
  name: string;
  /** Short one-line description shown on the card */
  blurb: string;
  /** Free-form tags used by search */
  tags: string[];
  /** YYYY-MM-DD added date */
  date: string;
  /** Optional swatch shown on the card; any CSS color */
  accent?: string;
  /** Attribution / inspiration; rendered on the idea page */
  credits?: IdeaCredit[];
  /**
   * Optional reference image used by the "Copy prompt" feature. Either an
   * absolute URL or a path under `public/` (e.g. `/screenshots/pyre.png`).
   * Coding agents pasted into Cursor will fetch this to "see" the design.
   */
  screenshot?: string;
  /** The page-level component. It should fill its container (h-full w-full). */
  Component: ComponentType;
};

/**
 * Live previews are rendered at this fixed "design viewport" and then
 * CSS-scaled down to whatever container they sit in. This lets ideas be
 * designed against a real screen size without caring about card dimensions.
 */
export const PREVIEW_WIDTH = 1280;
export const PREVIEW_HEIGHT = 800;

export function matchesQuery(idea: Idea, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    idea.name.toLowerCase().includes(q) ||
    idea.blurb.toLowerCase().includes(q) ||
    idea.slug.toLowerCase().includes(q) ||
    idea.tags.some((t) => t.toLowerCase().includes(q))
  );
}
