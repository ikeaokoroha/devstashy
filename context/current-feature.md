# Current Feature

<!-- Feature name and short description -->

## Status

<!-- Not Started | In Progress | Completed -->

## Goals

<!-- Goals and requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

Initial Next.js and Tailwind setup
Scaffolded the project with Next.js 16.3.4 / React 19.2.8 (TypeScript, App Router) and Tailwind CSS v4. Stripped the create-next-app boilerplate, set up the root layout with Geist fonts, and added CLAUDE.md and the context/ docs.

Dashboard UI Phase 1
Initialized shadcn/ui (base-nova style, Base UI) with button, input, and kbd components, wired the Geist fonts into the theme, and enabled dark mode by default. Added the /dashboard route with a full-width top bar (Devstashy title, centered search with ⌘K hint, New Collection and New Item buttons — display only) and placeholder sidebar and main areas.

Dashboard UI Phase 2
Added the dashboard sidebar with the shadcn sidebar component (collapsible off-canvas, ⌘B toggle, state persisted via cookie, always a drawer on mobile) and a toggle in the top bar. It holds the brand header, collapsible Types (colored icons, counts, links to /items/TYPE) and Collections groups (favorites plus recent non-favorites), and a user avatar area, all fed from mock data. Added item type color tokens in globals.css and an item type icon/color map in src/lib/item-types.ts.

Dashboard UI Phase 3
Built the dashboard main area with shadcn card and badge: a page header, 4 stats cards (items, collections, favorite items, favorite collections), the 6 most recently updated collections (cards bordered by their dominant item type, with type icons, linking to /collections/[id]), pinned items, and the 10 most recent items. Data comes from mock-backed queries in src/lib/dashboard-data.ts, ready to swap for Prisma. Widened the main content's side padding.
