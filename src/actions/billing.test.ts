import { beforeEach, describe, expect, it, vi } from "vitest";

import { openBillingPortal, startCheckout } from "@/actions/billing";
import { ensureStripeCustomer } from "@/lib/billing";
import { getBillingUser, type BillingUser } from "@/lib/db/users";
import { getPriceId, getStripe } from "@/lib/stripe";

// redirect() signals by throwing; the sentinel carries the URL so it can be asserted.
class RedirectSentinel extends Error {
  constructor(public url: string) {
    super(`redirect:${url}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectSentinel(url);
  }),
}));
vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/auth-tokens", () => ({ getAppUrl: () => "http://localhost:3000" }));
vi.mock("@/lib/billing", () => ({ ensureStripeCustomer: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getBillingUser: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn(), getPriceId: vi.fn() }));

const stripe = {
  checkout: { sessions: { create: vi.fn() } },
  billingPortal: { sessions: { create: vi.fn() } },
};

const freeUser: BillingUser = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada",
  isPro: false,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

function intervalForm(interval: string) {
  const formData = new FormData();
  formData.set("interval", interval);
  return formData;
}

async function redirectUrl(promise: Promise<unknown>) {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(RedirectSentinel);
  return (error as RedirectSentinel).url;
}

beforeEach(() => {
  vi.mocked(getStripe).mockReturnValue(stripe as never);
  vi.mocked(getPriceId).mockImplementation((interval) =>
    interval === "monthly" ? "price_monthly" : "price_yearly"
  );
  vi.mocked(getBillingUser).mockResolvedValue(freeUser);
  vi.mocked(ensureStripeCustomer).mockResolvedValue("cus_1");
  stripe.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/c/cs_1" });
  stripe.billingPortal.sessions.create.mockResolvedValue({
    url: "https://billing.stripe.com/p/session_1",
  });
});

describe("startCheckout", () => {
  it("rejects an interval that isn't monthly or yearly", async () => {
    const result = await startCheckout(null, intervalForm("weekly"));

    expect(result).toEqual({ success: false, error: "Choose monthly or yearly." });
    expect(getBillingUser).not.toHaveBeenCalled();
  });

  it("reports billing unavailable when Stripe isn't configured", async () => {
    vi.mocked(getStripe).mockReturnValue(null);

    const result = await startCheckout(null, intervalForm("monthly"));

    expect(result).toEqual({ success: false, error: "Billing isn't available right now." });
  });

  it("reports billing unavailable when the interval has no price", async () => {
    vi.mocked(getPriceId).mockReturnValue(null);

    const result = await startCheckout(null, intervalForm("yearly"));

    expect(result).toEqual({ success: false, error: "Billing isn't available right now." });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("creates Checkout for the interval's price and redirects to it", async () => {
    const url = await redirectUrl(startCheckout(null, intervalForm("yearly")));

    expect(url).toBe("https://checkout.stripe.com/c/cs_1");
    expect(ensureStripeCustomer).toHaveBeenCalledWith(stripe, freeUser);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_1",
      client_reference_id: "user-1",
      line_items: [{ price: "price_yearly", quantity: 1 }],
      subscription_data: { metadata: { userId: "user-1" } },
      success_url:
        "http://localhost:3000/api/billing/checkout-return?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000/settings?checkout=canceled",
    });
  });

  // A second click while subscribed must not buy Pro twice.
  it("opens the portal instead when the user already has a subscription", async () => {
    vi.mocked(getBillingUser).mockResolvedValue({
      ...freeUser,
      isPro: true,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
    });

    const url = await redirectUrl(startCheckout(null, intervalForm("monthly")));

    expect(url).toBe("https://billing.stripe.com/p/session_1");
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "http://localhost:3000/settings",
    });
  });

  it("reports billing unavailable when the user row is gone", async () => {
    vi.mocked(getBillingUser).mockResolvedValue(null);

    const result = await startCheckout(null, intervalForm("monthly"));

    expect(result).toEqual({ success: false, error: "Billing isn't available right now." });
  });

  it("reports billing unavailable when Checkout returns no URL", async () => {
    stripe.checkout.sessions.create.mockResolvedValue({ url: null });

    const result = await startCheckout(null, intervalForm("monthly"));

    expect(result).toEqual({ success: false, error: "Billing isn't available right now." });
  });

  it("returns a friendly error when Stripe fails", async () => {
    stripe.checkout.sessions.create.mockRejectedValue(new Error("stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await startCheckout(null, intervalForm("monthly"));

    expect(result).toEqual({
      success: false,
      error: "Couldn't start checkout. Please try again.",
    });
  });
});

describe("openBillingPortal", () => {
  it("reports billing unavailable when Stripe isn't configured", async () => {
    vi.mocked(getStripe).mockReturnValue(null);

    const result = await openBillingPortal();

    expect(result).toEqual({ success: false, error: "Billing isn't available right now." });
  });

  it("refuses a user with no Stripe customer", async () => {
    const result = await openBillingPortal();

    expect(result).toEqual({
      success: false,
      error: "You don't have a subscription to manage.",
    });
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("opens the portal for the user's customer and redirects to it", async () => {
    vi.mocked(getBillingUser).mockResolvedValue({ ...freeUser, stripeCustomerId: "cus_1" });

    const url = await redirectUrl(openBillingPortal());

    expect(url).toBe("https://billing.stripe.com/p/session_1");
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "http://localhost:3000/settings",
    });
  });

  it("returns a friendly error when Stripe fails", async () => {
    vi.mocked(getBillingUser).mockResolvedValue({ ...freeUser, stripeCustomerId: "cus_1" });
    stripe.billingPortal.sessions.create.mockRejectedValue(new Error("stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await openBillingPortal();

    expect(result).toEqual({
      success: false,
      error: "Couldn't open billing. Please try again.",
    });
  });
});
