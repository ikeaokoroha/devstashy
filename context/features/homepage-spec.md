# Homepage

## Overview

Rebuild the static mockup in `prototypes/homepage/` as the real app homepage at `/`, replacing the current placeholder `src/app/page.tsx`. Same sections, same layout, same animations — rebuilt in React, Tailwind v4 and shadcn/ui, with every button and link pointing at a real route.

Keep `prototypes/homepage/` in place as the visual reference; nothing in `src/` imports it.

## Routing & Auth

- `/` is public. The proxy matcher doesn't cover it and must not gain it.
- The page is a server component that calls `auth()`, so the nav can render its signed-in state:
  - Signed out: **Sign In** → `/sign-in`, **Get Started** → `/register`
  - Signed in: a single **Go to Dashboard** → `/dashboard` (no redirect — a signed-in user can still read the marketing page)
- Export `metadata` (title and description from the mockup's `<head>`).

## Link Map

| Mockup link | Destination |
| --- | --- |
| Nav Features / Pricing | `#features` / `#pricing` anchors |
| Nav Sign In | `/sign-in` |
| Nav Get Started, hero CTA, Free plan, final CTA | `/register` |
| Hero "See how it works" | `#features` |
| Pro plan "Go Pro" | `/register` (no billing yet) |
| Footer Product | `#features`, `#pricing` |
| Footer Changelog / Docs / Shortcuts / Import & export / About / Privacy / Terms | Keep all three columns. No routes exist yet, so they render as links pointing at `#top` through one `PLACEHOLDER_HREF` constant — each becomes real by filling in its href. |

Anchors use `next/link` with `scroll-mt-*` on the section headings; smooth scrolling comes from CSS, not JS.

## Component Breakdown

All under `src/components/home/`. Server by default — only the four listed as client get `"use client"`.

**Server**

- `HomeNav` — logo, anchor links, auth-aware actions (rendered as children inside the client scroll shell)
- `Hero` — eyebrow, headline, subhead, CTAs, note
- `DashboardPreview` — the static "…with DevStash" panel (mini sidebar, ⌘K search bar, six type-coloured cards)
- `FeatureCards` — the six cards, driven by one array of `{ type, icon, title, body }`
- `AiSection` — Pro badge, checklist, editor mockup with the AI tag row
- `PricingPlans` — the two plan cards, driven by a plan array
- `FinalCta`, `SiteFooter`

**Client**

- `HomeNavShell` — scroll listener adding the opaque/bordered state past 8px (passive listener); takes the nav content as `children` so the nav itself stays server-rendered
- `ChaosField` — the 8 drifting icons: `requestAnimationFrame` loop, wall bounce, rotation/scale pulse, pointer repulsion. Port the loop from `prototypes/homepage/script.js` including its safeguards — damping back to base speed, a hard max speed, a 32ms delta cap, and stopping when the hero leaves the viewport or the tab is hidden
- `Reveal` — `IntersectionObserver` fade-in wrapper taking `children`, so every revealed section stays a server component. One component, used everywhere the mockup has `.reveal`
- `BillingPeriodProvider` + `BillingToggle` + `ProPrice` — monthly/yearly state in context (following `ItemDrawerProvider`/`SearchProvider`), so the toggle and the Pro card's price line are the only client leaves inside the server-rendered pricing section

The footer year is `new Date().getFullYear()` on the server — no client component for it.

## Styling

- Tailwind v4 utilities and existing shadcn components; no new CSS files, no `tailwind.config.*`. Anything that can't be expressed as a utility (the hero glow, the chaos keyframes) goes in `globals.css` under `@layer components`, the way `.markdown-preview` does.
- Use the existing shadcn `Button`, `Badge`, `Card` and `Kbd` rather than re-styling anchors and boxes by hand.
- **Type colours come from the app's `--color-type-*` tokens in `globals.css`, not the mockup's palette.** The prototype invented its own (amber prompt, cyan command, green note, indigo link); the real page uses the product's colours so marketing and app can't drift. Reuse `getItemTypeStyle` from `src/lib/item-types.ts` for icon + colour wherever a type is shown, and use `link` where the mockup says `url`.
- Item-type icons are Lucide, via `getItemTypeStyle`. The brand marks in the chaos panel (Notion, GitHub, Slack, VS Code) stay as inline SVG since Lucide has no brand icons — put them in one `BrandIcons.tsx` beside the existing `src/components/shared/GitHubIcon.tsx` pattern.
- Section content, feature cards and plan features are arrays in one module (`src/lib/home-content.ts`), not repeated JSX.

## Animations

- Chaos icons: `requestAnimationFrame`, `transform` only — never `left`/`top`.
- Arrow: CSS pulse, rotated to point down on mobile (the mockup's `arrow-pulse-down` keyframes — an animated `transform` overrides a static `rotate`, so the rotation must live in every keyframe step).
- Reveals: fade/translate in once, then unobserve.
- Nav: opacity/border change on scroll.
- Respect `prefers-reduced-motion`: the chaos loop never starts and the icons fall back to a static scatter; reveals render visible.

## Responsive

- Desktop-first like the rest of the app; mobile usable.
- Chaos → arrow → dashboard stack vertically below `md`, arrow rotated 90°.
- Feature and plan grids collapse to one column; keep the preview's mini grid at two columns on the narrowest widths so it doesn't clip.

## Testing

Components aren't unit tested per the Testing section of coding-standards.md, so the suite stays as is unless a helper lands in `src/lib/` (e.g. pricing/period formatting), which gets its own `*.test.ts`.

## Out of Scope

- Billing — "Go Pro" sends users to `/register`; Stripe isn't wired up.
- Light mode. The app is dark-only (`dark` on `<html>`, no theme provider), so the page is dark-only too.
- Docs, changelog, legal pages.
