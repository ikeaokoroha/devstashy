import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/search/route";
import { auth } from "@/auth";
import { getSearchCollections } from "@/lib/db/collections";
import { getSearchItems } from "@/lib/db/items";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({ getSearchCollections: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ getSearchItems: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper); tests only use the getter form.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

const searchItem = {
  id: "item-1",
  title: "useAuth Hook",
  isFavorite: false,
  isPinned: false,
  itemType: { id: "type-1", name: "snippet" },
  preview: "export function useAuth() {}",
};

describe("GET /api/search", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "session-user" } });
    vi.mocked(getSearchItems).mockResolvedValue([searchItem]);
    vi.mocked(getSearchCollections).mockResolvedValue([
      { id: "col-1", name: "React Patterns", itemCount: 4 },
    ]);
  });

  it("returns 401 without a session and skips both lookups", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "Unauthorized" });
    expect(getSearchItems).not.toHaveBeenCalled();
    expect(getSearchCollections).not.toHaveBeenCalled();
  });

  it("returns the signed-in user's items and collections", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: {
        items: [searchItem],
        collections: [{ id: "col-1", name: "React Patterns", itemCount: 4 }],
      },
    });
    expect(getSearchItems).toHaveBeenCalledWith("session-user", expect.any(Number));
    expect(getSearchCollections).toHaveBeenCalledWith("session-user", expect.any(Number));
  });

  it("returns empty groups for a user with nothing stashed", async () => {
    vi.mocked(getSearchItems).mockResolvedValue([]);
    vi.mocked(getSearchCollections).mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { items: [], collections: [] },
    });
  });

  it("returns 500 when a lookup throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getSearchItems).mockRejectedValue(new Error("connection lost"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect((await response.json()).success).toBe(false);
  });
});
