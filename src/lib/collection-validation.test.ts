import { describe, expect, it } from "vitest";

import { createCollectionSchema, updateCollectionSchema } from "@/lib/collection-validation";

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

// Currently the same object as createCollectionSchema, so these assert the rules
// the edit dialog depends on rather than the two being identical.
describe("updateCollectionSchema", () => {
  it("trims the name and description", () => {
    expect(
      updateCollectionSchema.parse({ name: "  Renamed  ", description: "  Now with a note  " })
    ).toEqual({ name: "Renamed", description: "Now with a note" });
  });

  it("rejects a blank name", () => {
    const result = updateCollectionSchema.safeParse({ name: "   ", description: null });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });

  // Clearing the field in the dialog has to clear the stored description.
  it("clears a description emptied in the form", () => {
    expect(updateCollectionSchema.parse({ name: "Inbox", description: "" }).description).toBe(null);
  });
});
