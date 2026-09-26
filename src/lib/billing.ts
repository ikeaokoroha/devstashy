import type Stripe from "stripe";

import {
  activateSubscription,
  deactivateSubscription,
  getBillingUser,
  setStripeCustomerId,
  type BillingUser,
} from "@/lib/db/users";
import { isProStatus } from "@/lib/usage-limits";

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

// Re-reads the subscription rather than trusting an event payload, so a
// duplicate, late or out-of-order event just re-applies Stripe's current state.
export async function syncSubscription(stripe: Stripe, subscriptionId: string): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = getCustomerId(subscription.customer);

  if (isProStatus(subscription.status)) {
    await activateSubscription(customerId, subscription.id);
  } else {
    await deactivateSubscription(customerId, subscription.id);
  }
}

export async function handleStripeEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        await syncSubscription(stripe, session.subscription);
      }
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await syncSubscription(stripe, event.data.object.id);
      return;
    default:
      // Unsubscribed types can still arrive (e.g. a CLI trigger); ack and ignore.
      return;
  }
}

// Used by the checkout return route. The client_reference_id check means a
// user can only sync a session they started.
export async function syncCheckoutSession(
  stripe: Stripe,
  userId: string,
  sessionId: string
): Promise<boolean> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (
    session.client_reference_id !== userId ||
    session.mode !== "subscription" ||
    session.status !== "complete" ||
    typeof session.subscription !== "string"
  ) {
    return false;
  }

  await syncSubscription(stripe, session.subscription);
  return true;
}

// Creates the Stripe customer once and stores it, so every later event maps
// back to this user by customer id. The idempotency key collapses a
// double-click into one customer.
export async function ensureStripeCustomer(stripe: Stripe, user: BillingUser): Promise<string> {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create(
    { email: user.email, name: user.name ?? undefined, metadata: { userId: user.id } },
    { idempotencyKey: `customer-create:${user.id}` }
  );

  const saved = await setStripeCustomerId(user.id, customer.id);
  if (saved) {
    return customer.id;
  }

  // Another request stored a customer first; use the stored one.
  const current = await getBillingUser(user.id);
  return current?.stripeCustomerId ?? customer.id;
}
