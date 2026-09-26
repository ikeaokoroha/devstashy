import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  canUseItemType,
  FREE_COLLECTION_LIMIT,
  FREE_ITEM_LIMIT,
  hasProAccess,
  isOverLimit,
  isProStatus,
  PLAN_ERRORS,
} from "@/lib/usage-limits";

// A mutable stand-in for the flag, so each case can switch gating on or off.
const flags = vi.hoisted(() => ({ PRO_GATING_ENABLED: true }));

vi.mock("@/lib/feature-flags", () => ({
  get PRO_GATING_ENABLED() {
    return flags.PRO_GATING_ENABLED;
  },
}));

function setGating(enabled: boolean) {
  flags.PRO_GATING_ENABLED = enabled;
}

beforeEach(() => {
  setGating(true);
});

describe("isProStatus", () => {
  it.each(["active", "trialing", "past_due"])("is true for %s", (status) => {
    expect(isProStatus(status)).toBe(true);
  });

  it.each(["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"])(
    "is false for %s",
    (status) => {
      expect(isProStatus(status)).toBe(false);
    }
  );
});

describe("hasProAccess", () => {
  it("mirrors isPro with gating on", () => {
    expect(hasProAccess(true)).toBe(true);
    expect(hasProAccess(false)).toBe(false);
  });

  it("is always true with gating off", () => {
    setGating(false);

    expect(hasProAccess(true)).toBe(true);
    expect(hasProAccess(false)).toBe(true);
  });
});

describe("canUseItemType", () => {
  it.each(["file", "image"])("blocks %s on Free with gating on", (type) => {
    expect(canUseItemType(false, type)).toBe(false);
  });

  it("always allows a non-Pro type", () => {
    expect(canUseItemType(false, "snippet")).toBe(true);
    setGating(false);
    expect(canUseItemType(false, "snippet")).toBe(true);
  });

  it.each(["file", "image", "snippet"])("allows %s on Pro", (type) => {
    expect(canUseItemType(true, type)).toBe(true);
  });

  it.each(["file", "image"])("allows %s on Free with gating off", (type) => {
    setGating(false);

    expect(canUseItemType(false, type)).toBe(true);
  });
});

describe("isOverLimit", () => {
  it.each([
    [49, false],
    [50, true],
    [51, true],
  ])("on Free, %i against a limit of 50 is %s", (count, expected) => {
    expect(isOverLimit(false, count, 50)).toBe(expected);
  });

  it("is never over on Pro", () => {
    expect(isOverLimit(true, 51, 50)).toBe(false);
  });

  it("is never over with gating off", () => {
    setGating(false);

    expect(isOverLimit(false, 51, 50)).toBe(false);
  });
});

describe("PLAN_ERRORS", () => {
  it("names the actual limits", () => {
    expect(PLAN_ERRORS.itemLimit).toContain(`${FREE_ITEM_LIMIT}-item`);
    expect(PLAN_ERRORS.collectionLimit).toContain(`${FREE_COLLECTION_LIMIT}-collection`);
  });
});
