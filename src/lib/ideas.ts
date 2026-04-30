import type { ComponentType } from 'react';

export type IdeaCredit = {
  /** Short prefix label, e.g. "Inspired by", "Photography" */
  label: string;
  /** The source being credited */
  source: string;
  /** Optional external link */
  url?: string;
};

/**
 * Closed vocabulary for "what UI design idea is this exploring?".
 * Keep this list short, opinionated, and visually orthogonal — every value
 * needs to mean something distinct on the filter bar.
 */
export const CONCEPTS = [
  'typography',
  'color',
  'light',
  'shadow',
  'depth',
  'motion',
  'interaction',
  '3d',
  'gradient',
  'texture',
  'layout',
] as const;
export type Concept = (typeof CONCEPTS)[number];

/**
 * Closed vocabulary for "where would you actually use this in a product?".
 * Think real screens / surfaces a designer would reach for.
 */
export const USAGES = [
  'hero',
  'landing-page',
  'portfolio',
  'dashboard',
  'onboarding',
  'gallery',
  'navigation',
  'card',
  'showcase',
  'mobile',
] as const;
export type Usage = (typeof USAGES)[number];

/** Display labels for the controlled vocabularies. */
export const CONCEPT_LABELS: Record<Concept, string> = {
  typography: 'Typography',
  color: 'Color',
  light: 'Light',
  shadow: 'Shadow',
  depth: 'Depth',
  motion: 'Motion',
  interaction: 'Interaction',
  '3d': '3D',
  gradient: 'Gradient',
  texture: 'Texture',
  layout: 'Layout',
};

export const USAGE_LABELS: Record<Usage, string> = {
  hero: 'Hero',
  'landing-page': 'Landing page',
  portfolio: 'Portfolio',
  dashboard: 'Dashboard',
  onboarding: 'Onboarding',
  gallery: 'Gallery',
  navigation: 'Navigation',
  card: 'Card',
  showcase: 'Showcase',
  mobile: 'Mobile',
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
  /** Which UI-design ideas this specimen explores. */
  concepts: Concept[];
  /** Which product surfaces this would slot into. */
  usages: Usage[];
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
    idea.tags.some((t) => t.toLowerCase().includes(q)) ||
    idea.concepts.some((c) => c.toLowerCase().includes(q)) ||
    idea.usages.some((u) => u.toLowerCase().includes(q))
  );
}

export type IdeaFilters = {
  concepts: Concept[];
  usages: Usage[];
};

/**
 * An idea passes when, for each non-empty filter group, it matches at least
 * one selected value (OR within a group, AND across groups).
 */
export function matchesFilters(idea: Idea, filters: IdeaFilters): boolean {
  const conceptOk =
    filters.concepts.length === 0 ||
    filters.concepts.some((c) => idea.concepts.includes(c));
  const usageOk =
    filters.usages.length === 0 ||
    filters.usages.some((u) => idea.usages.includes(u));
  return conceptOk && usageOk;
}
