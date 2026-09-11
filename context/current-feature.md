# Current Feature

Dashboard UI Phase 3 — build out the dashboard main area (phase 3 of 3).

## Status

In Progress

## Goals

- The main area to the right of the sidebar
- Recent collections
- Pinned items
- 10 recent items
- 4 stats cards at the top: number of items, collections, favorite items, and favorite collections (not in screenshot)

## Notes

- Use `context/screenshots/dashboard-ui-main.png` as the visual reference.
- Import data directly from `src/lib/mock-data.ts` until the database is implemented.
- References: `context/project-overview.md`, `context/features/dashboard-phase-1-spec.md`, `context/features/dashboard-phase-2-spec.md`.

## History

<!-- Keep this updated. Earliest to latest -->

Initial Next.js and Tailwind setup
Scaffolded the project with Next.js 16.3.4 / React 19.2.8 (TypeScript, App Router) and Tailwind CSS v4. Stripped the create-next-app boilerplate, set up the root layout with Geist fonts, and added CLAUDE.md and the context/ docs.

Dashboard UI Phase 1
Initialized shadcn/ui (base-nova style, Base UI) with button, input, and kbd components, wired the Geist fonts into the theme, and enabled dark mode by default. Added the /dashboard route with a full-width top bar (Devstashy title, centered search with ⌘K hint, New Collection and New Item buttons — display only) and placeholder sidebar and main areas.

Dashboard UI Phase 2
Added the dashboard sidebar with the shadcn sidebar component (collapsible off-canvas, ⌘B toggle, state persisted via cookie, always a drawer on mobile) and a toggle in the top bar. It holds the brand header, collapsible Types (colored icons, counts, links to /items/TYPE) and Collections groups (favorites plus recent non-favorites), and a user avatar area, all fed from mock data. Added item type color tokens in globals.css and an item type icon/color map in src/lib/item-types.ts.
