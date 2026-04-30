# UI Ideas — A Working Catalog

A personal gallery for one-off UI experiments. Each idea is its own page; the
home page is a searchable grid of **live previews** (not screenshots) of every
idea in the catalog.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`, all theming in `src/index.css`)
- **React Router** for `/` (gallery) and `/idea/:slug`
- **Zustand** for gallery state (search query)
- **TanStack Query** wired up for any future async work
- **Motion** (Framer Motion) for card transitions
- **lucide-react** for icons

Path alias `@/*` → `src/*`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Add a new UI idea

1. Create `src/ideas/<your-slug>/index.tsx`. The default-exported component
   should fill its container — i.e. start with `h-full w-full`. Design it as
   if it were rendering into a 1280×800 viewport (that's the preview frame).

   ```tsx
   export default function MyIdea() {
     return (
       <div className="h-full w-full bg-black text-white p-12">
         {/* … */}
       </div>
     );
   }
   ```

2. Register it in `src/ideas/index.ts`:

   ```ts
   import MyIdea from './my-idea';

   export const ideas: Idea[] = [
     // …
     {
       slug: 'my-idea',
       name: 'My Idea',
       blurb: 'One-line description shown on the card.',
       tags: ['dashboard', 'dark'],
       date: '2026-05-01',
       accent: '#ff6b35',
       Component: MyIdea,
     },
   ];
   ```

That's it — it appears on the home grid (live preview, scaled to fit) and at
`/idea/my-idea`.

## How the live preview works

`<IdeaPreview>` renders the idea at a fixed 1280×800 design viewport, then
CSS-scales it down to whatever container it sits in (and locks the container
to the matching aspect ratio). Pointer events are disabled inside the card so
the click is captured by the card itself.

This means each idea is built once against a real screen size — no separate
"thumbnail" art needed.

## Project layout

```
src/
  ideas/                 ← one folder per idea + a registry
    index.ts             ← list every idea here
    neon-terminal/
    brutalist-portfolio/
    aurora-onboarding/
  components/
    idea-card.tsx        ← grid card with live preview + metadata
    idea-preview.tsx     ← fixed-viewport scaler
    search-bar.tsx
  pages/
    gallery.tsx          ← home, filterable grid
    idea-page.tsx        ← full-screen idea + floating back nav
  stores/
    gallery-store.ts     ← Zustand: search query
  lib/
    ideas.ts             ← Idea type + helpers
    utils.ts             ← `cn` (clsx + tailwind-merge)
```
# ui_ideas
