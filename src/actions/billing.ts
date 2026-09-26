"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getAppUrl } from "@/lib/auth-tokens";
import { ensureStripeCustomer } from "@/lib/billing";
import { getBillingUser } from "@/lib/db/users";
import { requireUserId } from "@/lib/session";
import { getPriceId, getStripe } from "@/lib/stripe";
import { BILLING_INTERVALS } from "@/lib/usage-limits";
import type { ActionResult } from "@/types/actions";

const intervalSchema = z.enum(BILLING_INTERVALS);

const BILLING_UNAVAILABLE = "Billing isn't available right now.";

// Sends the user to Stripe Checkout, or to the portal if they already hold a
// subscription, so a second click can't buy Pro twice.
export async function startCheckout(
  _previous: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();

  const parsed = intervalSchema.safeParse(formData.get("interval"));
  if (!parsed.success) {
    return { success: false, error: "Choose monthly or yearly." };
  }

  const stripe = getStripe();
  const priceId = getPriceId(parsed.data);
  if (!stripe || !priceId) {
    return { success: false, error: BILLING_UNAVAILABLE };
  }

  let url: string | null;
  try {
    const user = await getBillingUser(userId);
    if (!user) {
      return { success: false, error: BILLING_UNAVAILABLE };
    }
    const customer = await ensureStripeCustomer(stripe, user);
    const appUrl = getAppUrl();

    if (user.stripeSubscriptionId) {
      const portal = await stripe.billingPortal.sessions.create({
        customer,
        return_url: `${appUrl}/settings`,
      });
      url = portal.url;
    } else {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        client_reference_id: userId,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { metadata: { userId } },
        success_url: `${appUrl}/api/billing/checkout-return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/settings?checkout=canceled`,
      });
      url = session.url;
    }
  } catch (error) {
    console.error("Failed to start checkout", error);
    return { success: false, error: "Couldn't start checkout. Please try again." };
  }

  if (!url) {
    return { success: false, error: BILLING_UNAVAILABLE };
  }

  // Outside the try: redirect signals by throwing.
  redirect(url);
}

// Opens the Stripe Customer Portal (switch interval, update card, cancel,
// invoices). Takes no arguments, so it still fits useActionState's signature.
export async function openBillingPortal(): Promise<ActionResult> {
  const userId = await requireUserId();

  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: BILLING_UNAVAILABLE };
  }

  let url: string;
  try {
    const user = await getBillingUser(userId);
    if (!user?.stripeCustomerId) {
      return { success: false, error: "You don't have a subscription to manage." };
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppUrl()}/settings`,
    });
    url = portal.url;
  } catch (error) {
    console.error("Failed to open billing portal", error);
    return { success: false, error: "Couldn't open billing. Please try again." };
  }

  // Outside the try: redirect signals by throwing.
  redirect(url);
}
