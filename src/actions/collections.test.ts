import { describe, expect, it, vi } from "vitest";

import { createCollection } from "@/actions/collections";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/db/collections", () => ({ createCollection: vi.fn() }));

const input = { name: "  React Patterns ", description: "" };

describe("createCollection", () => {
  it("returns field errors without touching the database when validation fails", async () => {
    const result = await createCollection({ ...input, name: " " });

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.name).toBe("Name is required");
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("saves the parsed data for the signed-in user and returns the new id", async () => {
    vi.mocked(createCollectionQuery).mockResolvedValue("col-1");

    const result = await createCollection(input);

    expect(result).toEqual({ success: true, data: { id: "col-1" } });
    expect(createCollectionQuery).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(createCollectionQuery).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCollection(input);

    expect(result).toEqual({
      success: false,
      error: "Couldn't create this collection. Please try again.",
    });
  });
});
