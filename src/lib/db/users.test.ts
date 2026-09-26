import { describe, expect, it, vi } from "vitest";

import {
  activateSubscription,
  deactivateSubscription,
  getBillingUser,
  getEditorPreferences,
  setStripeCustomerId,
  updateEditorPreferences,
} from "@/lib/db/users";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const preferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

describe("getEditorPreferences", () => {
  it("reads only the preferences column, for the given user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      editorPreferences: preferences,
    } as never);

    expect(await getEditorPreferences("user-1")).toEqual(preferences);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { editorPreferences: true },
    });
  });

  it("returns the defaults when the column has never been set", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ editorPreferences: null } as never);

    expect(await getEditorPreferences("user-1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns the defaults when the row is gone, rather than throwing", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    expect(await getEditorPreferences("user-1")).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("repairs a stored value that no longer fits the options", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      editorPreferences: { ...preferences, theme: "dracula" },
    } as never);

    expect(await getEditorPreferences("user-1")).toEqual({
      ...preferences,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });
});

describe("updateEditorPreferences", () => {
  it("writes the five preference keys, scoped to the user", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

    expect(await updateEditorPreferences("user-1", preferences)).toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: { ...preferences } },
    });
  });

  it("stores nothing beyond the known keys", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

    await updateEditorPreferences("user-1", { ...preferences, isPro: true } as never);

    const [call] = vi.mocked(prisma.user.updateMany).mock.calls;
    expect(call[0].data.editorPreferences).toEqual(preferences);
  });

  it("is false when no row matched", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as never);

    expect(await updateEditorPreferences("user-1", preferences)).toBe(false);
  });
});

describe("getBillingUser", () => {
  it("selects the billing fields, for the given user", async () => {
    const billingUser = {
      id: "user-1",
      email: "demo@devstash.io",
      name: "Demo",
      isPro: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(billingUser as never);

    expect(await getBillingUser("user-1")).toEqual(billingUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        id: true,
        email: true,
        name: true,
        isPro: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });
  });

  it("returns null when the row is gone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    expect(await getBillingUser("user-1")).toBeNull();
  });
});

describe("setStripeCustomerId", () => {
  it("only fills an empty column", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

    expect(await setStripeCustomerId("user-1", "cus_123")).toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", stripeCustomerId: null },
      data: { stripeCustomerId: "cus_123" },
    });
  });

  it("is false when a customer is already stored", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as never);

    expect(await setStripeCustomerId("user-1", "cus_123")).toBe(false);
  });
});

describe("activateSubscription", () => {
  it("grants Pro and stores the subscription, matched by customer", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

    expect(await activateSubscription("cus_123", "sub_123")).toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
      data: { isPro: true, stripeSubscriptionId: "sub_123" },
    });
  });

  it("is a quiet false for an unknown customer", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as never);

    expect(await activateSubscription("cus_unknown", "sub_123")).toBe(false);
  });
});

describe("deactivateSubscription", () => {
  it("drops Pro, scoped to the customer's current subscription", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 1 } as never);

    expect(await deactivateSubscription("cus_123", "sub_123")).toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123", stripeSubscriptionId: "sub_123" },
      data: { isPro: false, stripeSubscriptionId: null },
    });
  });

  it("is false for an old, replaced subscription", async () => {
    vi.mocked(prisma.user.updateMany).mockResolvedValue({ count: 0 } as never);

    expect(await deactivateSubscription("cus_123", "sub_old")).toBe(false);
  });
});
