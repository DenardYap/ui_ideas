import type { Idea } from '@/lib/ideas';

/**
 * Eagerly load the raw source of every idea's `index.tsx` so the "Copy
 * prompt" action can ship the actual implementation alongside the
 * description. The `?raw` query tells Vite to return the file's text.
 */
const RAW_SOURCES = import.meta.glob('../ideas/*/index.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const SOURCE_BY_SLUG: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [path, source] of Object.entries(RAW_SOURCES)) {
    const match = path.match(/\/ideas\/([^/]+)\/index\.tsx$/);
    if (match) out[match[1]] = source;
  }
  return out;
})();

export function getIdeaSource(slug: string): string | undefined {
  return SOURCE_BY_SLUG[slug];
}

/** Absolute URL the agent can fetch to see the design, or null if unset. */
export function getReferenceImageUrl(idea: Idea): string | null {
  if (!idea.screenshot) return null;
  if (/^https?:\/\//i.test(idea.screenshot)) return idea.screenshot;
  const path = idea.screenshot.startsWith('/')
    ? idea.screenshot
    : `/${idea.screenshot}`;
  return `${window.location.origin}${path}`;
}

export function getLiveDemoUrl(idea: Idea): string {
  return `${window.location.origin}/idea/${idea.slug}`;
}

/**
 * Markdown prompt designed to be pasted into Cursor (or any coding agent)
 * to recreate the idea: description + image link + full source.
 */
export function buildPrompt(idea: Idea): string {
  const source = getIdeaSource(idea.slug)?.trim() ?? '// Source not available.';
  const imageUrl = getReferenceImageUrl(idea);
  const liveUrl = getLiveDemoUrl(idea);

  const referenceLines = [
    imageUrl
      ? `- Reference image (open this URL to see the design): ${imageUrl}`
      : `- No static screenshot is available — open the live demo to see the design.`,
    `- Live demo: ${liveUrl}`,
  ];

  const credits = (idea.credits ?? [])
    .map((c) => `- ${c.label}: ${c.source}${c.url ? ` (${c.url})` : ''}`)
    .join('\n');

  const sections: string[] = [
    `# Recreate "${idea.name}"`,
    '',
    idea.blurb,
    '',
    `**Tags:** ${idea.tags.join(', ')}`,
    '',
    '## Reference',
    ...referenceLines,
  ];

  if (credits) {
    sections.push('', '## Credits & inspiration', credits);
  }

  sections.push(
    '',
    '## Stack & constraints',
    '- React 19 + TypeScript',
    '- Tailwind CSS v4 (theme tokens, not hardcoded values where possible)',
    '- `motion` (Framer Motion successor) for animation',
    '- `lucide-react` for icons',
    '- The component must fill its container — start with `h-full w-full`',
    '- Designed against a 1280×800 viewport',
    '',
    '## Reference implementation',
    'This is the original implementation from the open-source UI Ideas catalog. Use it as a starting point — adapt naming, colors, and tokens to fit your project. Match the look, feel, and behavior of the reference image as closely as possible.',
    '',
    '```tsx',
    source,
    '```',
  );

  return sections.join('\n');
}
