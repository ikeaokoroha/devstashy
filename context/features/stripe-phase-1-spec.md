# Stripe Integration Phase 1 - Core Infrastructure

## Overview

Lay the groundwork for DevStash Pro ($8/month, $72/year) without changing anything a user can see. This phase adds the Stripe SDK and a lazy client, the `PRO_GATING` flag, a pure usage-limits module with unit tests, `isPro` on the session, and the billing queries Phase 2 will call. Nothing is gated yet, and there is no webhook, checkout or UI. Every account still behaves exactly as it does today.

Full design and code sketches: `docs/stripe-integration-plan.md` (sections referenced below as §).

## Requirements

- Install `stripe` (22.x). No client package: hosted Checkout and Portal need no Stripe.js
- Add the `PRO_GATING` feature flag, following the `RATE_LIMITING` pattern
- Create `src/lib/usage-limits.ts`: Free-plan limits and the pure access rules, fully unit tested
- Create `src/lib/stripe.ts`: lazy, cached Stripe client and server-side price lookup
- Put `isPro` on the session through a DB-reading `jwt` callback in `auth.ts` only, so the proxy stays database-free
- Add a cached `getSession()` and `requireSessionUser()` so a page request runs one `isPro` query, not two
- Add the billing queries to `src/lib/db/users.ts` and lean count queries for items and collections
- No schema change and no migration: `isPro`, `stripeCustomerId @unique` and `stripeSubscriptionId @unique` already exist

## Files to Create

1. `src/lib/usage-limits.ts` - Limits and access rules (§5.2, named `plan.ts` there)
   - `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`
   - `BILLING_INTERVALS = ["monthly", "yearly"] as const` and the `BillingInterval` type
   - `isProStatus(status)`: true for `active`, `trialing`, `past_due`
   - `hasProAccess(isPro)`: `isPro || !PRO_GATING_ENABLED`
   - `canUseItemType(isPro, typeName)`: false only for a `PRO_ITEM_TYPES` type without Pro access
   - `isOverLimit(isPro, count, limit)`: `!hasProAccess(isPro) && count >= limit`
   - `PLAN_ERRORS`: the four user-facing messages (item limit, collection limit, Pro type, uploads)
2. `src/lib/usage-limits.test.ts` - Unit tests (see Testing)
3. `src/lib/stripe.ts` - `getStripe()` (undefined = unresolved, null = unconfigured, warns once), `STRIPE_API_VERSION = "2026-08-26.dahlia"`, `getPriceId(interval)` reading `STRIPE_PRICE_ID_MONTHLY` / `_YEARLY` (§5.1)
4. `src/lib/stripe.test.ts` - `getStripe` returns null without a key and caches; `getPriceId` maps each interval and returns null when unset (fresh module per test, as `r2.test.ts` does)

## Files to Modify

1. `package.json` - add `stripe`
2. `src/lib/feature-flags.ts` - `PRO_GATING_ENABLED`, on unless exactly `"false"` (§6.2)
3. `.env` / `.env.production` - `PRO_GATING=false` in `.env`, `PRO_GATING=true` explicitly in `.env.production`
4. `src/auth.ts` - `jwt` callback that re-reads `isPro` from the DB on every `auth()` (§6.3)
5. `src/auth.config.ts` - session callback copies `token.isPro` into `session.user.isPro`
6. `src/types/next-auth.d.ts` - `Session.user.isPro: boolean` and `JWT.isPro?: boolean`
7. `src/lib/session.ts` - `getSession = cache(() => auth())`, `requireSessionUser()` returning `{ id, isPro }`, and `requireUserId` rebuilt on top of it (§6.3)
8. `src/app/(app)/layout.tsx` - use `getSession()` instead of calling `auth()` directly, removing the duplicate `isPro` query
9. `src/lib/db/users.ts` - `BillingUser`, `getBillingUser`, `setStripeCustomerId` (only fills a null column), `activateSubscription`, `deactivateSubscription` (scoped to the subscription id) (§6.5)
10. `src/lib/db/items.ts` / `src/lib/db/collections.ts` - `countItems(userId)` and `countCollections(userId)`
11. `src/lib/db/users.test.ts` - extend for the four billing queries
12. `src/lib/db/items.test.ts` / `collections.test.ts` - the two count queries

## Key Gotchas

Use Context7 to verify the current `stripe` Node SDK and NextAuth v5 callback signatures.

- The `jwt` callback that queries Prisma lives in `auth.ts` only. `auth.config.ts` is shared with `src/proxy.ts`, which must never load Prisma
- Confirm the `next-auth/jwt` module augmentation path typechecks under `5.0.0-beta.32` (`npx next typegen && npx tsc --noEmit`)
- `PRO_GATING_ENABLED` reads `process.env` at module load, so in a client bundle it reads as **on**. Client components must not call `hasProAccess()`; Phase 2 hands them a server-computed value. The constants and `BILLING_INTERVALS` are safe anywhere
- `.env.production` needs `PRO_GATING=true` explicitly, or a local production build inherits the `false` from `.env` (the `RATE_LIMITING` lesson)
- Existing action tests mock `@/lib/session`; `requireUserId` must keep its signature so they still pass untouched in this phase
- Billing writes use `updateMany` and return `count > 0`, so an event for an unknown customer is a quiet no-op rather than a throw
- `STRIPE_PUBLISHABLE_KEY` is not used by this plan

## Environment Variables

```
STRIPE_SECRET_KEY=          # already set in .env (sk_test_…)
STRIPE_PRICE_ID_MONTHLY=    # already set
STRIPE_PRICE_ID_YEARLY=     # already set
PRO_GATING=false            # new; true in .env.production
```

## Testing

`src/lib/usage-limits.test.ts`, with `vi.mock("@/lib/feature-flags")` so each case controls the flag:

- `isProStatus`: true for `active`, `trialing`, `past_due`; false for `canceled`, `unpaid`, `incomplete`, `incomplete_expired`, `paused`
- `hasProAccess`: gating on → mirrors `isPro`; gating off → always true
- `canUseItemType`: `file` and `image` blocked on Free with gating on; `snippet` always allowed; everything allowed on Pro or with gating off
- `isOverLimit`: at 49 / 50 / 51 against a limit of 50 on Free (false / true / true); always false on Pro and with gating off
- `PLAN_ERRORS` interpolates the actual limit constants

Plus the `stripe.test.ts`, `users.test.ts` and count-query cases listed above, then:

1. `npm run test:run`, `npx next typegen && npx tsc --noEmit`, `npm run lint`, `npm run build` all pass
2. Signing in and out still works with credentials and GitHub, and the dashboard renders as before (no visible change expected)

## References

- Plan: `docs/stripe-integration-plan.md` §0, §1.2, §3, §5.1, §5.2, §6.1–6.5, §9 steps 1–3
- Research: `context/research/stripe-integration-research.md`
- Stripe Node SDK: https://github.com/stripe/stripe-node
