import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/collections/route";
import { auth } from "@/auth";
import { getPickerCollections } from "@/lib/db/collections";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({ getPickerCollections: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper); tests only use the getter form.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

describe("GET /api/collections", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "session-user" } });
  });

  it("returns 401 without a session and skips the lookup", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "Unauthorized" });
    expect(getPickerCollections).not.toHaveBeenCalled();
  });

  it("returns the signed-in user's collections", async () => {
    const collections = [{ id: "col-1", name: "React Patterns" }];
    vi.mocked(getPickerCollections).mockResolvedValue(collections);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: collections });
    expect(getPickerCollections).toHaveBeenCalledWith("session-user");
  });

  it("returns an empty list for a user with no collections", async () => {
    vi.mocked(getPickerCollections).mockResolvedValue([]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [] });
  });

  it("returns 500 when the lookup throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getPickerCollections).mockRejectedValue(new Error("connection lost"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect((await response.json()).success).toBe(false);
  });
});
