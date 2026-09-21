import { describe, expect, it } from "vitest";

import {
  getItemTypeNameFromSlug,
  getItemTypeSlug,
  getItemTypeStyle,
  SYSTEM_ITEM_TYPE_ORDER,
} from "@/lib/item-types";

describe("item type slugs", () => {
  it("pluralizes the type name", () => {
    expect(getItemTypeSlug("snippet")).toBe("snippets");
  });

  it("round-trips every system type", () => {
    for (const name of SYSTEM_ITEM_TYPE_ORDER) {
      expect(getItemTypeNameFromSlug(getItemTypeSlug(name))).toBe(name);
    }
  });

  it("returns null for unknown or singular slugs", () => {
    expect(getItemTypeNameFromSlug("widgets")).toBeNull();
    expect(getItemTypeNameFromSlug("snippet")).toBeNull();
  });
});

describe("getItemTypeStyle", () => {
  it("returns the type's color classes", () => {
    expect(getItemTypeStyle("prompt").borderClass).toBe("border-l-type-prompt");
  });

  it("falls back to muted styles for custom types", () => {
    expect(getItemTypeStyle("custom").textClass).toBe("text-muted-foreground");
  });
});
