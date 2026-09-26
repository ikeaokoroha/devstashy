import Stripe from "stripe";

import type { BillingInterval } from "@/lib/usage-limits";

// undefined = not resolved yet, null = not configured, so this only warns once.
let client: Stripe | null | undefined;

// Pinned to the SDK's own version so a Dashboard default change can't alter
// response shapes under us. Keep the webhook endpoint on the same version.
export const STRIPE_API_VERSION = "2026-08-26.dahlia";

// Built lazily so a missing key degrades billing instead of crashing at import.
export function getStripe(): Stripe | null {
  if (client !== undefined) {
    return client;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn("STRIPE_SECRET_KEY is not set — billing is unavailable.");
    client = null;
    return null;
  }

  client = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  return client;
}

// Price ids are resolved server side from the interval; the browser never
// chooses a price id, so it can't check out at an arbitrary price.
export function getPriceId(interval: BillingInterval): string | null {
  const priceId =
    interval === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;
  return priceId || null;
}
