# Stripe Integration Phase 2 - Integration & UI

## Overview

Turn Phase 1's infrastructure into working billing. Users upgrade through Stripe-hosted Checkout, manage their subscription in the Stripe Customer Portal, and a signed webhook keeps `User.isPro` in sync. Free-plan limits are enforced on the server, mirrored in the UI, and switched by the `PRO_GATING` flag (off in development). End-to-end testing needs the Stripe CLI (`stripe listen`).

Depends on Phase 1 (`usage-limits.ts`, `stripe.ts`, `isPro` on the session, the billing and count queries). Full design and code sketches: `docs/stripe-integration-plan.md` (sections referenced below as §).

## Requirements

- Stripe ↔ DB sync that re-retrieves the subscription on every event instead of trusting the payload (idempotent, order-safe)
- Signed webhook at `POST /api/webhooks/stripe`
- `startCheckout` and `openBillingPortal` server actions that `redirect()` to Stripe
- Checkout return route that syncs the session eagerly, so the user lands on `/settings` already Pro even before the webhook
- Billing card on `/settings` with plan, usage and upgrade/manage buttons
- Server-side gating on item creation, collection creation and file uploads; edit and delete never gated
- UI mirrors of the gates through a server-computed `PlanProvider`
- `deleteAccount` cancels the subscription before deleting the user
- Homepage "Go Pro" sends signed-in users to `/settings#billing`

## Files to Create

1. `src/lib/billing.ts` - `syncSubscription`, `handleStripeEvent`, `syncCheckoutSession` (checks `client_reference_id`), `ensureStripeCustomer` (idempotency key, race fallback) (§5.3)
2. `src/app/api/webhooks/stripe/route.ts` - raw-body `constructEvent`, 503 unconfigured, 400 bad/missing signature, 500 on handler failure so Stripe retries (§5.4)
3. `src/app/api/billing/checkout-return/route.ts` - Checkout's `success_url`; syncs, logs on failure, always redirects to `/settings?checkout=success` (§5.5)
4. `src/actions/billing.ts` - `startCheckout` (portal instead when already subscribed) and `openBillingPortal`, `useActionState` signature, `redirect` outside the try (§5.6)
5. `src/components/settings/BillingCard.tsx` - server card, `id="billing"`: Free (usage "12 / 50 items", Pro features from `PRO_PLAN.features`, upgrade buttons) or Pro (badge, manage button), plus the `checkout` success/canceled banner (§5.7)
6. `src/components/settings/UpgradeForm.tsx` / `ManageBillingForm.tsx` - client forms over the two actions; errors through `FormMessage`, buttons disabled while pending
7. `src/components/billing/PlanProvider.tsx` - `{ isPro, hasProAccess }` context, value computed on the server (§5.8)
8. Tests: `src/lib/billing.test.ts`, `src/app/api/webhooks/stripe/route.test.ts`, `src/app/api/billing/checkout-return/route.test.ts`, `src/actions/billing.test.ts` (§5.9)

## Files to Modify

1. `src/actions/items.ts` - `createItem` uses `requireSessionUser()`; rejects a Pro type with `PLAN_ERRORS.proType` and, inside the try, the 50-item limit (§6.6)
2. `src/actions/collections.ts` - `createCollection` checks the 3-collection limit (§6.7)
3. `src/app/api/uploads/route.ts` - 403 with `PLAN_ERRORS.uploads` without Pro access (§6.8). Downloads stay ungated
4. `src/actions/profile.ts` - `deleteAccount` cancels the subscription first; refuses the delete if Stripe fails or is unconfigured while a subscription id is stored. The Stripe Customer is kept (§6.9)
5. `src/app/(app)/settings/page.tsx` - await `searchParams` for the banner; `Promise.all` of profile, billing user and both stats queries; `BillingCard` between `EditorPreferencesCard` and `AccountActions`; subtitle "Manage your account and plan" (§6.10)
6. `src/app/(app)/layout.tsx` - wrap the tree in `PlanProvider` with `hasProAccess(isPro)` computed server side
7. `NewItemDialog` type picker - File/Image disabled with the outline PRO badge and an "Upgrade to Pro" link when `!hasProAccess`; a Pro `defaultType` falls back to `snippet` (§6.11)
8. `src/app/(app)/items/[type]/page.tsx` - "New File"/"New Image" button only when `canUseItemType`
9. `src/app/page.tsx` + pricing section - Pro card links to `SIGNED_IN_PRO_HREF = "/settings#billing"` when signed in, `/register` otherwise
10. Existing tests - `items.test.ts`, `collections.test.ts`, `uploads/route.test.ts`, `profile.test.ts` gain `requireSessionUser`/`isPro` mocks and the gating and cancel cases (§6.12)

## Key Gotchas

Use Context7 to verify the current Stripe Checkout, Billing Portal and webhook APIs.

- Read the webhook body with `request.text()`, never JSON: the signature covers the exact bytes
- Every handler re-retrieves the subscription, so duplicate or out-of-order events just re-apply current state
- `deactivateSubscription` is scoped to the stored subscription id, so a late `deleted` event for an old subscription can't revoke a resubscribed user
- Price ids are resolved on the server from the interval; the browser never sends a price id
- `redirect()` throws to signal, so it must stay outside try/catch in the actions
- Client components read `usePlan()`; they never call `hasProAccess()` (the flag reads as on in a client bundle)
- The Customer Portal must have a saved configuration in the Dashboard or portal sessions fail
- `APP_URL` is unset on Vercel and `getAppUrl()` throws in production without it: billing is blocked in production until it's set
- Count-then-create can overshoot the limit by one or two under concurrent requests; accepted (§2.3)

## Environment Variables

```
STRIPE_WEBHOOK_SECRET=      # whsec_… printed by `stripe listen`; restart dev after setting
```

Production (Vercel, then redeploy): live `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, both live price ids, `PRO_GATING=true`, `APP_URL=https://<domain>` (§7.2).

## Stripe Setup

1. Dashboard (test mode): confirm both prices are recurring USD $8/month and $72/year on one product; configure and save the Customer Portal (payment method, invoices, cancel at period end, switch between both prices) (§7.1)
2. Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed
```

## Testing

Automated: all new and updated tests pass (`npm run test:run`), plus typecheck, lint and build. Stripe is mocked through `@/lib/stripe`, never the network; `redirect` is mocked to throw a sentinel so the URL can be asserted.

Manual, with `stripe listen` running and `PRO_GATING=true` temporarily in `.env` (full checklist in §8):

1. Free limits: 51st item and 4th collection show the limit toast; edit and delete still work
2. File/Image disabled in the picker, no "New File" button, crafted `POST /api/uploads` returns 403
3. Upgrade with `4242 4242 4242 4242`: land on `/settings?checkout=success` already Pro, even with `stripe listen` stopped
4. Webhook events log 200; `stripe events resend evt_…` changes nothing
5. Upgrading again while Pro opens the portal, not Checkout
6. Portal monthly → yearly keeps Pro; cancel at period end + test clock drops to Free with data intact
7. Delete account while Pro cancels the subscription, and the follow-up webhook is a 200 no-op
8. With `STRIPE_SECRET_KEY` removed: "Billing isn't available right now." and a 503 webhook, no crash
9. Reset `PRO_GATING=false` in `.env` afterwards

## References

- Plan: `docs/stripe-integration-plan.md` §2, §4, §5.3–5.9, §6.6–6.12, §7, §8, §9 steps 4–9, §10
- Stripe webhooks: https://docs.stripe.com/webhooks
- Checkout subscriptions: https://docs.stripe.com/billing/subscriptions/build-subscriptions
- Customer Portal: https://docs.stripe.com/customer-management
- Stripe CLI: https://docs.stripe.com/stripe-cli
