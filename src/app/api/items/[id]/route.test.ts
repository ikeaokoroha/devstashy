import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/items/[id]/route";
import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/users", () => ({ getCurrentUserId: vi.fn().mockResolvedValue("demo-user") }));
vi.mock("@/lib/db/items", () => ({ getItemDetail: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper); tests only use the getter form.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

function callGet(id: string) {
  return GET(new Request(`http://localhost/api/items/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/items/[id]", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "session-user" } });
  });

  it("returns 401 without a session and skips the lookup", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await callGet("item-1");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ success: false, error: "Unauthorized" });
    expect(getItemDetail).not.toHaveBeenCalled();
  });

  it("returns 404 when the item isn't found", async () => {
    vi.mocked(getItemDetail).mockResolvedValue(null);

    const response = await callGet("missing");

    expect(response.status).toBe(404);
    expect(getItemDetail).toHaveBeenCalledWith("demo-user", "missing");
  });

  it("returns the item", async () => {
    vi.mocked(getItemDetail).mockResolvedValue({ id: "item-1", title: "useAuth Hook" } as never);

    const response = await callGet("item-1");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { id: "item-1", title: "useAuth Hook" },
    });
  });

  it("returns 500 when the lookup throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getItemDetail).mockRejectedValue(new Error("connection lost"));

    const response = await callGet("item-1");

    expect(response.status).toBe(500);
    expect((await response.json()).success).toBe(false);
  });
});
