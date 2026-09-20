# Current Feature: Forgot Password

Let users who signed up with email/password reset it from a link on the sign-in page, using a
single-use emailed token stored in the existing `VerificationToken` model.

## Status

In Progress

## Goals

- "Forgot password?" link on the sign-in page, next to the password field, going to `/forgot-password`.
- `/forgot-password` page: email field, submits to a server action that emails a reset link.
  Always shows the same confirmation, whether or not the address has an account, so the form
  can't be used to discover registered emails.
- Reset tokens reuse `VerificationToken` — no migration. Same shape as email verification:
  32 random bytes, stored as a SHA-256 hash, single-use, but with a short TTL (1 hour) and a
  namespaced `identifier` so a reset token can't be mistaken for a verification token.
- `/reset-password` page: reads `email` and `token` from the query string, validates the token
  before showing the form, and shows an expired/invalid message with a link back to
  `/forgot-password` when it doesn't check out.
- Submitting a new password (with confirmation, validated by a shared zod schema) hashes it with
  12 bcrypt rounds, updates the user, consumes the token, and redirects to `/sign-in` with a
  success banner.
- Resend goes through the same cooldown treatment as verification: skip addresses sent a reset
  link in the last 60 seconds.
- Reset emails go through the existing Resend setup in `src/lib/email.ts`, with the link built
  from `APP_URL` rather than the request Host header.

## Notes

- Mirror `src/lib/email-verification.ts` in a new `src/lib/password-reset.ts`; the hashing,
  `getAppUrl`, and cooldown logic are worth sharing rather than copying if it stays readable.
- `VerificationToken` is keyed on `@@unique([identifier, token])`, and email verification uses the
  bare email as `identifier`. Password reset must use a prefixed identifier (e.g.
  `password-reset:{email}`) so `deleteMany({ identifier: email })` in the verification flow doesn't
  wipe reset tokens and vice versa.
- Only users with a `password` set can reset — GitHub-only accounts get the same silent no-op the
  resend-verification flow uses.
- A successful reset should also set `emailVerified` if it's null: receiving the email proves
  ownership. Keeps `REQUIRE_EMAIL_VERIFICATION` from locking out someone who resets before verifying.
- With `REQUIRE_EMAIL_VERIFICATION=false` in `.env`, email sending still needs to work for this
  feature — and per the known gap, Resend only delivers to the account owner's address until a
  domain is verified, so testing is limited to that address.
- Pages live in the existing `(auth)` route group; reuse `FormField`, `FormMessage`, the
  `ActionResult` type, and the `useActionState` pattern from `SignInForm`.

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

Auth Phase 1 — NextAuth + GitHub Provider
Added NextAuth v5 (next-auth 5.0.0-beta.32) with @auth/prisma-adapter 2.11.3 and GitHub OAuth, using NextAuth's default sign-in page. Split config for edge compatibility: src/auth.config.ts holds the GitHub provider and a session callback that copies token.sub into session.user.id, and src/auth.ts adds the Prisma adapter (the existing Neon client) with the JWT session strategy and exports handlers, auth, signIn, and signOut, served by src/app/api/auth/[...nextauth]/route.ts. src/proxy.ts builds its own instance from the adapter-free config and redirects unauthenticated requests to /dashboard/:path* to /api/auth/signin with a callbackUrl back to the original page. src/types/next-auth.d.ts types session.user.id. getCurrentUserId still returns the demo user; wiring the dashboard to the signed-in user is left for a later phase.

Auth Phase 2 — Email/Password Credentials
Added email/password sign-in alongside GitHub, plus a registration API. src/auth.config.ts registers a Credentials provider placeholder (email and password fields via CREDENTIALS_FIELDS, authorize returning null) so it stays edge-safe, and src/auth.ts swaps it for the real authorize, which looks the user up by email and checks the password with bcrypt (users without a password, e.g. GitHub-only, are rejected). POST /api/auth/register (src/app/api/auth/register/route.ts) validates name, email, password, and confirmPassword with zod (added as a dependency; schemas in src/lib/auth-validation.ts, emails trimmed and lowercased, passwords 8–72 characters and matching), returns 409 for a taken email (including a P2002 race), hashes with 12 bcrypt rounds, and responds with `{ success, data, error }` (201 on success). No migration was needed since User.password already existed. Known gap: GitHub-created users keep their email's original case, so the same address in a different case can register a second account.

Auth Phase 3 — Sign In, Register & Sign Out UI
Replaced NextAuth's default pages with custom /sign-in and /register pages in a centered (auth) route group layout. src/auth.config.ts exports SIGN_IN_PATH and sets pages.signIn to it, and src/proxy.ts now redirects signed-out visitors there. Sign-in uses server actions in src/actions/auth.ts: signInWithCredentials (useActionState, validated with signInSchema, CredentialsSignin mapped to "Invalid email or password", the email echoed back so React's form reset doesn't clear it) and signInWithGitHub, both passing the callbackUrl through; the page also shows OAuth errors Auth.js redirects back with (?error=, e.g. OAuthAccountNotLinked) and a success banner after registering. RegisterForm validates with the shared registerSchema on the client (per-field errors via z.flattenError), posts to /api/auth/register, shows server errors like a taken email, and redirects to /sign-in?registered=1. Shared FormField and FormMessage components live in src/components/auth, and an ActionResult type in src/types/actions.ts. The sidebar footer now shows the session user (the dashboard layout reads auth() and passes name, email, and image through AppSidebar) with a reusable UserAvatar in src/components/shared (image, or initials from the first and last words of the name, falling back to the email's first letter) and an upward dropdown with Profile (links to /profile, not built yet) and Sign out (signOutUser, redirects to /sign-in). Added the shadcn dropdown-menu and label components. Dashboard data is still scoped to the demo user via getCurrentUserId, and mock-data.ts is no longer imported but kept for a later cleanup.

Email Verification on Register
New email/password users must verify their address before signing in. Registration sends a verification link through Resend (src/lib/email.ts; lazy client reading RESEND_API_KEY, sender from EMAIL_FROM defaulting to onboarding@resend.dev). src/lib/email-verification.ts reuses the VerificationToken model with no migration: tokens are 32 random bytes stored as a SHA-256 hash, expire after 24 hours, and replace any earlier token for the email; links are built from APP_URL (localhost fallback in dev, required in production) rather than the request host, so a spoofed Host header can't redirect the token. GET /api/auth/verify-email consumes the token in a transaction (deleted first, so single-use) and redirects to /sign-in with ?verified=1 or ?verifyError=expired|invalid. authorize in src/auth.ts throws EmailNotVerifiedError (a CredentialsSignin subclass in src/lib/auth-errors.ts) only after the password matches, and signInWithCredentials shows a verify-your-email message with a ResendVerificationForm. The resendVerificationEmail server action answers the same way for any email and skips addresses sent a link in the last 60 seconds. If the email fails at registration, the account is still created. The sign-in page's register banner now says to check your inbox. Also added scripts/delete-non-demo-users.ts (npm run db:delete-users, dry run unless --confirm) to delete every user except the demo user with their content; used it to clear test users from the dev branch.

Email Verification Toggle
Added src/lib/feature-flags.ts with REQUIRE_EMAIL_VERIFICATION, read once from the environment (trimmed and lowercased) and on unless the value is exactly "false", so a typo or missing variable can't silently disable verification. With the flag off, the register route creates users with emailVerified already set and sends no email (so re-enabling the flag doesn't lock them out), authorizeCredentials in src/auth.ts skips the EmailNotVerifiedError check, the sign-in page shows the old "Account created. Sign in to continue." banner and hides the verified/verifyError banners, and resendVerificationEmail returns success without sending in case a stale page submits it. The resend form inside SignInForm needed no change, since it only renders on the emailNotVerified result the flag prevents. /api/auth/verify-email still verifies links either way. All verification code is left intact, so switching the flag back on needs no code change. Set to false in .env with a comment; Vercel still needs the same variable (and a redeploy, since the value is read at startup), otherwise production defaults to verification on.
