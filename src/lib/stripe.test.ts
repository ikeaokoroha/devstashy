import { beforeEach, describe, expect, it, vi } from "vitest";

// The client is cached per module instance, so each test imports a fresh copy
// against its own environment.
async function importStripe(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  return import("@/lib/stripe");
}

const PRICES = {
  STRIPE_PRICE_ID_MONTHLY: "price_monthly",
  STRIPE_PRICE_ID_YEARLY: "price_yearly",
};

describe("getStripe", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns null without a secret key, and warns once", async () => {
    const { getStripe } = await importStripe({ STRIPE_SECRET_KEY: undefined });

    expect(getStripe()).toBeNull();
    expect(getStripe()).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("builds the client once and caches it", async () => {
    const { getStripe } = await importStripe({ STRIPE_SECRET_KEY: "sk_test_123" });

    const client = getStripe();
    expect(client).not.toBeNull();
    expect(getStripe()).toBe(client);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe("getPriceId", () => {
  it("maps each interval to its price", async () => {
    const { getPriceId } = await importStripe(PRICES);

    expect(getPriceId("monthly")).toBe("price_monthly");
    expect(getPriceId("yearly")).toBe("price_yearly");
  });

  it("returns null when the price is unset", async () => {
    const { getPriceId } = await importStripe({
      STRIPE_PRICE_ID_MONTHLY: undefined,
      STRIPE_PRICE_ID_YEARLY: "",
    });

    expect(getPriceId("monthly")).toBeNull();
    expect(getPriceId("yearly")).toBeNull();
  });
});
