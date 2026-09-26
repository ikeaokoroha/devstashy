import { PRO_GATING_ENABLED } from "@/lib/feature-flags";
import { PRO_ITEM_TYPES } from "@/lib/item-types";

// Free-plan limits and the rules that decide who gets past them. Pure, so the
// actions, routes and settings page share one definition. The constants and
// BILLING_INTERVALS are safe anywhere; hasProAccess and the helpers built on it
// read PRO_GATING_ENABLED, which is only correct on the server.

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

// Subscription statuses that grant Pro. past_due keeps access while Stripe
// retries the card; it becomes canceled or unpaid if the retries run out.
const PRO_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

export function isProStatus(status: string): boolean {
  return PRO_SUBSCRIPTION_STATUSES.has(status);
}

// With gating off (development), every account gets Pro features.
export function hasProAccess(isPro: boolean): boolean {
  return isPro || !PRO_GATING_ENABLED;
}

export function canUseItemType(isPro: boolean, typeName: string): boolean {
  return !PRO_ITEM_TYPES.includes(typeName) || hasProAccess(isPro);
}

// At the limit counts as over: a Free user with 50 items can't create a 51st.
export function isOverLimit(isPro: boolean, count: number, limit: number): boolean {
  return !hasProAccess(isPro) && count >= limit;
}

export const PLAN_ERRORS = {
  itemLimit: `You've reached the Free plan's ${FREE_ITEM_LIMIT}-item limit. Upgrade to Pro for unlimited items.`,
  collectionLimit: `You've reached the Free plan's ${FREE_COLLECTION_LIMIT}-collection limit. Upgrade to Pro for unlimited collections.`,
  proType: "File and image items are a Pro feature.",
  uploads: "File uploads are a Pro feature.",
} as const;
