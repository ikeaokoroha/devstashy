import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCollection,
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
} from "@/actions/collections";
import {
  countCollections,
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  setCollectionFavorite,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";
import { FREE_COLLECTION_LIMIT, PLAN_ERRORS } from "@/lib/usage-limits";

// Mutable so each case can pick the plan and whether gating is on. Every case
// starts as a Pro user with gating on, so only the plan cases see a limit.
const plan = vi.hoisted(() => ({ isPro: true, gating: true }));

vi.mock("@/lib/session", () => ({
  requireUserId: vi.fn().mockResolvedValue("user-1"),
  requireSessionUser: vi.fn(async () => ({ id: "user-1", isPro: plan.isPro })),
}));
vi.mock("@/lib/feature-flags", () => ({
  get PRO_GATING_ENABLED() {
    return plan.gating;
  },
}));
vi.mock("@/lib/db/collections", () => ({
  countCollections: vi.fn(),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  setCollectionFavorite: vi.fn(),
}));

beforeEach(() => {
  plan.isPro = true;
  plan.gating = true;
  vi.mocked(countCollections).mockResolvedValue(0);
});

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

describe("createCollection plan limits", () => {
  beforeEach(() => {
    plan.isPro = false;
    vi.mocked(createCollectionQuery).mockResolvedValue("col-1");
  });

  it("rejects a new collection at the Free plan's limit", async () => {
    vi.mocked(countCollections).mockResolvedValue(FREE_COLLECTION_LIMIT);

    const result = await createCollection(input);

    expect(result).toEqual({ success: false, error: PLAN_ERRORS.collectionLimit });
    expect(countCollections).toHaveBeenCalledWith("user-1");
    expect(createCollectionQuery).not.toHaveBeenCalled();
  });

  it("creates a collection below the Free plan's limit", async () => {
    vi.mocked(countCollections).mockResolvedValue(FREE_COLLECTION_LIMIT - 1);

    const result = await createCollection(input);

    expect(result).toEqual({ success: true, data: { id: "col-1" } });
  });

  it("lets a Pro user past the limit", async () => {
    plan.isPro = true;
    vi.mocked(countCollections).mockResolvedValue(FREE_COLLECTION_LIMIT + 5);

    const result = await createCollection(input);

    expect(result).toEqual({ success: true, data: { id: "col-1" } });
  });

  it("allows it on the Free plan with gating off", async () => {
    plan.gating = false;
    vi.mocked(countCollections).mockResolvedValue(FREE_COLLECTION_LIMIT + 5);

    const result = await createCollection(input);

    expect(result).toEqual({ success: true, data: { id: "col-1" } });
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
