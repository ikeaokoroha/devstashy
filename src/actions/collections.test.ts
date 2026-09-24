import { describe, expect, it, vi } from "vitest";

import {
  createCollection,
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
} from "@/actions/collections";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  setCollectionFavorite,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";

vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  setCollectionFavorite: vi.fn(),
}));

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

describe("updateCollection", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await updateCollection("", input);

    expect(result).toEqual({ success: false, error: "Collection not found." });
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("returns field errors without touching the database when validation fails", async () => {
    const result = await updateCollection("col-1", { ...input, name: " " });

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.name).toBe("Name is required");
    expect(updateCollectionQuery).not.toHaveBeenCalled();
  });

  it("saves the parsed data for the signed-in user", async () => {
    vi.mocked(updateCollectionQuery).mockResolvedValue(true);

    const result = await updateCollection("col-1", input);

    expect(result).toEqual({ success: true });
    expect(updateCollectionQuery).toHaveBeenCalledWith("user-1", "col-1", {
      name: "React Patterns",
      description: null,
    });
  });

  it("reports not found when the collection isn't the user's", async () => {
    vi.mocked(updateCollectionQuery).mockResolvedValue(false);

    expect(await updateCollection("someone-elses", input)).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(updateCollectionQuery).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await updateCollection("col-1", input)).toEqual({
      success: false,
      error: "Couldn't save this collection. Please try again.",
    });
  });
});

describe("deleteCollection", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await deleteCollection("");

    expect(result).toEqual({ success: false, error: "Collection not found." });
    expect(deleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("deletes the collection for the signed-in user", async () => {
    vi.mocked(deleteCollectionQuery).mockResolvedValue(true);

    expect(await deleteCollection("col-1")).toEqual({ success: true });
    expect(deleteCollectionQuery).toHaveBeenCalledWith("user-1", "col-1");
  });

  it("reports not found when the collection isn't the user's", async () => {
    vi.mocked(deleteCollectionQuery).mockResolvedValue(false);

    expect(await deleteCollection("someone-elses")).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(deleteCollectionQuery).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await deleteCollection("col-1")).toEqual({
      success: false,
      error: "Couldn't delete this collection. Please try again.",
    });
  });
});

describe("toggleCollectionFavorite", () => {
  it("rejects an empty id without touching the database", async () => {
    const result = await toggleCollectionFavorite("", true);

    expect(result).toEqual({ success: false, error: "Collection not found." });
    expect(setCollectionFavorite).not.toHaveBeenCalled();
  });

  // The action passes the state the UI is already showing straight through, so
  // the database never has to read the row to flip it.
  it("saves the requested state for the signed-in user", async () => {
    vi.mocked(setCollectionFavorite).mockResolvedValue(true);

    expect(await toggleCollectionFavorite("col-1", true)).toEqual({ success: true });
    expect(setCollectionFavorite).toHaveBeenCalledWith("user-1", "col-1", true);
  });

  it("passes false through when unfavoriting", async () => {
    vi.mocked(setCollectionFavorite).mockResolvedValue(true);

    await toggleCollectionFavorite("col-1", false);

    expect(setCollectionFavorite).toHaveBeenCalledWith("user-1", "col-1", false);
  });

  it("reports not found when the collection isn't the user's", async () => {
    vi.mocked(setCollectionFavorite).mockResolvedValue(false);

    expect(await toggleCollectionFavorite("someone-elses", true)).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(setCollectionFavorite).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await toggleCollectionFavorite("col-1", true)).toEqual({
      success: false,
      error: "Couldn't update this collection. Please try again.",
    });
  });
});
