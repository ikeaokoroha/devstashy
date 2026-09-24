import { describe, expect, it } from "vitest";

import { createCollectionSchema } from "@/lib/collection-validation";

describe("createCollectionSchema", () => {
  it("trims the name and description", () => {
    const parsed = createCollectionSchema.parse({
      name: "  React Patterns  ",
      description: "  Hooks and components  ",
    });

    expect(parsed).toEqual({ name: "React Patterns", description: "Hooks and components" });
  });

  it("rejects a blank name", () => {
    const result = createCollectionSchema.safeParse({ name: "   ", description: null });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });

  it("stores a blank description as null", () => {
    expect(createCollectionSchema.parse({ name: "Inbox", description: "   " }).description).toBe(
      null
    );
    expect(createCollectionSchema.parse({ name: "Inbox" }).description).toBe(null);
  });
});
