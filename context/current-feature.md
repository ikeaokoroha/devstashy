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

Prisma + Neon PostgreSQL Setup
Set up Prisma 7.10 with Neon PostgreSQL. Added prisma.config.ts (loads .env with dotenv; CLI uses DIRECT_URL, falling back to DATABASE_URL) and the Rust-free prisma-client generator outputting to src/generated/prisma (gitignored, regenerated on postinstall). Created the initial schema from the project overview plus the NextAuth models (Account, Session, VerificationToken), with a URL content type, a hashed password field, indexes on common queries and foreign keys, and cascade deletes; applied it as the init migration on the dev branch. Added a Prisma client singleton in src/lib/prisma.ts using the Neon serverless driver adapter, and a scripts/test-db.ts connection check (npm run db:test, via tsx).

Seed Data
Added prisma/seed.ts (run with npx prisma db seed, configured via migrations.seed in prisma.config.ts) that seeds the demo user (demo@devstash.io, bcryptjs-hashed password with 12 rounds, email verified), the 7 system item types, and 5 collections with 18 items (TypeScript snippets, prompts, commands, and real documentation/design links). Re-runnable: the user and system types are upserted and the demo user's collections and items are recreated. Expanded scripts/test-db.ts to display the seeded data (system types, demo user, collections and their items) and verify the password hash, content types, and collection links.
