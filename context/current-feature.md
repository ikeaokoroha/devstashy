# Current Feature: Auth Phase 1 — NextAuth + GitHub Provider

Set up NextAuth v5 with the Prisma adapter and GitHub OAuth, using NextAuth's default pages for testing.

## Status

In Progress

## Goals

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up the split auth config pattern for edge compatibility
- Add the GitHub OAuth provider
- Protect `/dashboard/*` routes using the Next.js 16 proxy
- Redirect unauthenticated users to sign-in
- Files to create:
  - `src/auth.config.ts` — edge-compatible config (providers only, no adapter)
  - `src/auth.ts` — full config with Prisma adapter and JWT strategy
  - `src/app/api/auth/[...nextauth]/route.ts` — export handlers from auth.ts
  - `src/proxy.ts` — route protection with redirect logic
  - `src/types/next-auth.d.ts` — extend the Session type with `user.id`

## Notes

- Use Context7 to verify the newest config and conventions.
- Use `next-auth@beta` (not `@latest`, which installs v4).
- Proxy file must be at `src/proxy.ts` (same level as `app/`).
- Use a named export: `export const proxy = auth(...)`, not a default export.
- Use `session: { strategy: 'jwt' }` with the split config pattern.
- Don't set a custom `pages.signIn` — use NextAuth's default page.
- Environment variables: `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
- Testing:
  1. Go to `/dashboard` — should redirect to sign-in
  2. Click "Sign in with GitHub"
  3. Verify redirect back to `/dashboard` after auth
- References:
  - Edge compatibility: https://authjs.dev/getting-started/installation#edge-compatibility
  - Prisma adapter: https://authjs.dev/getting-started/adapters/prisma

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

Dashboard Collections
Replaced the mock recent collections in the dashboard main area with real data from Neon via Prisma. Added src/lib/db/collections.ts with getRecentCollections (the 6 most recently updated collections, fetched in one query with each item's type; types ranked by usage so the dominant type sets the card's border color, with icons for every type present) and getCollectionStats (total and favorite collection counts). The dashboard page is now an async server component; queries are scoped to the seeded demo user through a placeholder getCurrentUserId in src/lib/db/users.ts until auth lands. Item stats, pinned items, and recent items remain mock-backed for now.

Dashboard Items
Replaced the mock item stats, pinned items, and recent items in the dashboard main area with real data from Neon via Prisma. Added src/lib/db/items.ts with getItemStats (total and favorite item counts), getPinnedItems, and getRecentItems (the 10 most recently updated), sharing one select of just the card fields (type id/name for the icon and border color, tags sorted by name). The dashboard page fetches all item and collection data in parallel, the stats cards now show real counts for both, and the pinned section stays hidden when nothing is pinned. ItemWithType is now a standalone type rather than extending the mock Item, and the unused mock queries in src/lib/dashboard-data.ts were removed (the sidebar still uses mock-data.ts). Two demo items were pinned directly in the dev database for testing; reseeding clears them.

Stats & Sidebar
Replaced the sidebar's mock types and collections with real data from Neon via Prisma. Added getSystemItemTypes to src/lib/db/items.ts (system types with the user's item count per type, in one query using a filtered relation count, sorted in spec order via SYSTEM_ITEM_TYPE_ORDER) and getSidebarCollections to src/lib/db/collections.ts (all favorites plus the 5 most recent non-favorites, each with its dominant item type from the shared ranking). The dashboard layout fetches both in parallel and passes them down through AppSidebar; getCurrentUserId is now wrapped in React cache so the layout and page share one lookup per request. Types link to /items/[type]s with their colored icons and counts; favorite collections keep the star, recent ones show a dot colored by their dominant type (via a new dotClass in item-types.ts, muted for empty collections), and a "View all collections" link goes to /collections. The seed now marks React Patterns and AI Workflows as favorites (applied directly to the dev database to preserve the pinned items). The sidebar user area still uses mock-data.ts until auth lands.

Add Pro Badge to Sidebar
Added a subtle PRO badge next to the File and Image types in the sidebar's Types group, using the shadcn Badge (outline variant, muted 10px semibold text, 16px tall). The Pro-only types are listed once as PRO_ITEM_TYPES in src/lib/item-types.ts and checked in SidebarTypesNav. The badge is display only; Pro gating is not enforced yet.

Code Scan Quick Wins
Applied low-risk fixes from the code-scanner audit using Prisma APIs only. Capped the unbounded dashboard queries: getPinnedItems takes a limit (PINNED_ITEMS_LIMIT = 10 in the dashboard page) and getSidebarCollections caps favorites (SIDEBAR_FAVORITE_COLLECTIONS_LIMIT = 10 in the dashboard layout). getRecentCollections now takes itemCount from _count, though item rows are still loaded to rank types. Added an (userId, isPinned, updatedAt) index on Item through the add_pinned_items_index migration, applied to the dev branch; prod gets it from Vercel's `prisma migrate deploy && next build` build command. The seed's delete-and-recreate of the demo user's collections and items now runs in one transaction with a 60s timeout, so a failed insert rolls back instead of leaving partial data. Deferred: the seed environment guard, mock-data.ts cleanup, security headers, the DATABASE_URL check, and a unique constraint on system type names.
