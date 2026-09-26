import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/webhooks/stripe/route";
import { handleStripeEvent } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/billing", () => ({ handleStripeEvent: vi.fn() }));

const stripe = { webhooks: { constructEvent: vi.fn() } };
const event = { id: "evt_1", type: "customer.subscription.updated" };
const payload = '{"id":"evt_1"}';

function callPost(headers: Record<string, string> = { "stripe-signature": "t=1,v1=abc" }) {
  return POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers,
      body: payload,
    })
  );
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.mocked(getStripe).mockReturnValue(stripe as never);
    stripe.webhooks.constructEvent.mockReturnValue(event);
    vi.mocked(handleStripeEvent).mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 503 when Stripe isn't configured", async () => {
    vi.mocked(getStripe).mockReturnValue(null);

    const response = await callPost();

    expect(response.status).toBe(503);
    expect(handleStripeEvent).not.toHaveBeenCalled();
  });

  it("returns 503 when the webhook secret isn't set", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const response = await callPost();

    expect(response.status).toBe(503);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it("returns 400 without a signature header", async () => {
    const response = await callPost({});

    expect(response.status).toBe(400);
    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when the signature doesn't verify", async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    const response = await callPost();

    expect(response.status).toBe(400);
    expect(handleStripeEvent).not.toHaveBeenCalled();
  });

  // The signature covers the exact bytes, so the raw body must reach it untouched.
  it("verifies the raw body and handles the event", async () => {
    const response = await callPost();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      payload,
      "t=1,v1=abc",
      "whsec_test"
    );
    expect(handleStripeEvent).toHaveBeenCalledWith(stripe, event);
  });

  it("returns 500 when the handler fails, so Stripe retries", async () => {
    vi.mocked(handleStripeEvent).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await callPost();

    expect(response.status).toBe(500);
  });
});
