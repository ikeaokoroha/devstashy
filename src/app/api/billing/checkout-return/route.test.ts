import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/billing/checkout-return/route";
import { auth } from "@/auth";
import { syncCheckoutSession } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/auth.config", () => ({ SIGN_IN_PATH: "/sign-in" }));
vi.mock("@/lib/auth-tokens", () => ({ getAppUrl: () => "http://localhost:3000" }));
vi.mock("@/lib/billing", () => ({ syncCheckoutSession: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper); tests only use the getter form.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);
const stripe = {};

function callGet(query = "?session_id=cs_1") {
  return GET(new Request(`http://localhost:3000/api/billing/checkout-return${query}`));
}

describe("GET /api/billing/checkout-return", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    vi.mocked(getStripe).mockReturnValue(stripe as never);
    vi.mocked(syncCheckoutSession).mockResolvedValue(true);
  });

  it("redirects to sign-in without a session and syncs nothing", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await callGet();

    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in");
    expect(syncCheckoutSession).not.toHaveBeenCalled();
  });

  it("syncs the user's session and lands them on settings", async () => {
    const response = await callGet();

    expect(syncCheckoutSession).toHaveBeenCalledWith(stripe, "user-1", "cs_1");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/settings?checkout=success"
    );
  });

  // The webhook stays authoritative, so a failed eager sync only logs.
  it("still redirects to settings when the sync throws", async () => {
    vi.mocked(syncCheckoutSession).mockRejectedValue(new Error("stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await callGet();

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/settings?checkout=success"
    );
  });

  it("skips the sync without a session id", async () => {
    const response = await callGet("");

    expect(syncCheckoutSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/settings?checkout=success"
    );
  });

  it("skips the sync when Stripe isn't configured", async () => {
    vi.mocked(getStripe).mockReturnValue(null);

    await callGet();

    expect(syncCheckoutSession).not.toHaveBeenCalled();
  });
});
