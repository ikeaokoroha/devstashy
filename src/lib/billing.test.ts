import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

import {
  ensureStripeCustomer,
  handleStripeEvent,
  syncCheckoutSession,
  syncSubscription,
} from "@/lib/billing";
import {
  activateSubscription,
  deactivateSubscription,
  getBillingUser,
  setStripeCustomerId,
  type BillingUser,
} from "@/lib/db/users";

vi.mock("@/lib/db/users", () => ({
  activateSubscription: vi.fn(),
  deactivateSubscription: vi.fn(),
  getBillingUser: vi.fn(),
  setStripeCustomerId: vi.fn(),
}));

// Only the calls billing.ts makes; each test sets the responses it needs.
const stripeMock = {
  subscriptions: { retrieve: vi.fn() },
  checkout: { sessions: { retrieve: vi.fn() } },
  customers: { create: vi.fn() },
};
const stripe = stripeMock as unknown as Stripe;

function subscription(status: string, customer: unknown = "cus_1") {
  return { id: "sub_1", status, customer };
}

function event(type: string, object: Record<string, unknown>) {
  return { id: "evt_1", type, data: { object } } as unknown as Stripe.Event;
}

const user: BillingUser = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada",
  isPro: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

describe("syncSubscription", () => {
  it.each(["active", "trialing", "past_due"])("activates a %s subscription", async (status) => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(subscription(status));

    await syncSubscription(stripe, "sub_1");

    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(activateSubscription).toHaveBeenCalledWith("cus_1", "sub_1");
    expect(deactivateSubscription).not.toHaveBeenCalled();
  });

  it.each(["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"])(
    "deactivates a %s subscription",
    async (status) => {
      stripeMock.subscriptions.retrieve.mockResolvedValue(subscription(status));

      await syncSubscription(stripe, "sub_1");

      expect(deactivateSubscription).toHaveBeenCalledWith("cus_1", "sub_1");
      expect(activateSubscription).not.toHaveBeenCalled();
    }
  );

  it("reads the id from an expanded customer", async () => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(
      subscription("active", { id: "cus_expanded", object: "customer" })
    );

    await syncSubscription(stripe, "sub_1");

    expect(activateSubscription).toHaveBeenCalledWith("cus_expanded", "sub_1");
  });
});

describe("handleStripeEvent", () => {
  beforeEach(() => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(subscription("active"));
  });

  it("syncs the subscription a completed subscription checkout created", async () => {
    await handleStripeEvent(
      stripe,
      event("checkout.session.completed", { mode: "subscription", subscription: "sub_1" })
    );

    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(activateSubscription).toHaveBeenCalled();
  });

  it("ignores a completed checkout that isn't for a subscription", async () => {
    await handleStripeEvent(
      stripe,
      event("checkout.session.completed", { mode: "payment", subscription: null })
    );

    expect(stripeMock.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
  ])("re-retrieves the subscription on %s", async (type) => {
    // The payload's status is ignored; only the retrieved state counts.
    await handleStripeEvent(stripe, event(type, { id: "sub_1", status: "canceled" }));

    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(activateSubscription).toHaveBeenCalledWith("cus_1", "sub_1");
  });

  it("acknowledges an unrelated event without doing anything", async () => {
    await handleStripeEvent(stripe, event("invoice.paid", { id: "in_1" }));

    expect(stripeMock.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(activateSubscription).not.toHaveBeenCalled();
    expect(deactivateSubscription).not.toHaveBeenCalled();
  });
});

describe("syncCheckoutSession", () => {
  const completeSession = {
    client_reference_id: "user-1",
    mode: "subscription",
    status: "complete",
    subscription: "sub_1",
  };

  beforeEach(() => {
    stripeMock.subscriptions.retrieve.mockResolvedValue(subscription("active"));
  });

  it("syncs a completed session the user started", async () => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue(completeSession);

    expect(await syncCheckoutSession(stripe, "user-1", "cs_1")).toBe(true);
    expect(stripeMock.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_1");
    expect(activateSubscription).toHaveBeenCalledWith("cus_1", "sub_1");
  });

  it.each([
    ["another user's session", { client_reference_id: "user-2" }],
    ["a session that isn't complete", { status: "open" }],
    ["a session that isn't a subscription", { mode: "payment" }],
    ["a session with no subscription", { subscription: null }],
  ])("rejects %s", async (_label, override) => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({ ...completeSession, ...override });

    expect(await syncCheckoutSession(stripe, "user-1", "cs_1")).toBe(false);
    expect(stripeMock.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(activateSubscription).not.toHaveBeenCalled();
  });
});

describe("ensureStripeCustomer", () => {
  beforeEach(() => {
    stripeMock.customers.create.mockResolvedValue({ id: "cus_new" });
  });

  it("reuses a stored customer without calling Stripe", async () => {
    const customer = await ensureStripeCustomer(stripe, { ...user, stripeCustomerId: "cus_1" });

    expect(customer).toBe("cus_1");
    expect(stripeMock.customers.create).not.toHaveBeenCalled();
  });

  it("creates the customer with an idempotency key and stores it", async () => {
    vi.mocked(setStripeCustomerId).mockResolvedValue(true);

    const customer = await ensureStripeCustomer(stripe, user);

    expect(customer).toBe("cus_new");
    expect(stripeMock.customers.create).toHaveBeenCalledWith(
      { email: "ada@example.com", name: "Ada", metadata: { userId: "user-1" } },
      { idempotencyKey: "customer-create:user-1" }
    );
    expect(setStripeCustomerId).toHaveBeenCalledWith("user-1", "cus_new");
  });

  it("leaves the name out when the user has none", async () => {
    vi.mocked(setStripeCustomerId).mockResolvedValue(true);

    await ensureStripeCustomer(stripe, { ...user, name: null });

    expect(stripeMock.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: undefined }),
      expect.anything()
    );
  });

  it("falls back to the stored customer when another request saved one first", async () => {
    vi.mocked(setStripeCustomerId).mockResolvedValue(false);
    vi.mocked(getBillingUser).mockResolvedValue({ ...user, stripeCustomerId: "cus_winner" });

    const customer = await ensureStripeCustomer(stripe, user);

    expect(customer).toBe("cus_winner");
    expect(getBillingUser).toHaveBeenCalledWith("user-1");
  });
});
