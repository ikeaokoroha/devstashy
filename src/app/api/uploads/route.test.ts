import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/uploads/route";
import { auth } from "@/auth";
import { buildObjectKey, getPublicFileUrl, isR2Configured, presignUpload } from "@/lib/r2";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/r2", () => ({
  isR2Configured: vi.fn(),
  buildObjectKey: vi.fn(),
  getPublicFileUrl: vi.fn(),
  presignUpload: vi.fn(),
}));

// auth() is overloaded (session getter and middleware wrapper); tests only use the getter form.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

function callPost(body: unknown) {
  return POST(
    new Request("http://localhost/api/uploads", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );
}

const validBody = {
  typeName: "image",
  fileName: "logo.png",
  size: 2048,
  mimeType: "image/png",
};

describe("POST /api/uploads", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "session-user" } });
    vi.mocked(isR2Configured).mockReturnValue(true);
    vi.mocked(buildObjectKey).mockReturnValue("session-user/abc.png");
    vi.mocked(getPublicFileUrl).mockReturnValue("https://pub-test.r2.dev/session-user/abc.png");
    vi.mocked(presignUpload).mockResolvedValue("https://r2.example.com/signed");
  });

  it("returns 401 without a session and signs nothing", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await callPost(validBody);

    expect(response.status).toBe(401);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("returns 503 when R2 isn't configured", async () => {
    vi.mocked(isR2Configured).mockReturnValue(false);

    const response = await callPost(validBody);

    expect(response.status).toBe(503);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed body", async () => {
    const response = await callPost({ typeName: "image" });

    expect(response.status).toBe(400);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  // The browser checks this too, but a crafted request only meets this one.
  it("returns 400 for a file the type doesn't allow", async () => {
    const response = await callPost({ ...validBody, fileName: "payload.exe", mimeType: "" });

    expect(response.status).toBe(400);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("returns 400 for a file over the type's size limit", async () => {
    const response = await callPost({ ...validBody, size: 6 * 1024 * 1024 });

    expect(response.status).toBe(400);
    expect(presignUpload).not.toHaveBeenCalled();
  });

  it("signs an upload keyed to the session user", async () => {
    const response = await callPost(validBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: {
        uploadUrl: "https://r2.example.com/signed",
        contentType: "image/png",
        fileUrl: "https://pub-test.r2.dev/session-user/abc.png",
        fileName: "logo.png",
        fileSize: 2048,
      },
    });
    expect(buildObjectKey).toHaveBeenCalledWith("session-user", "png");
    // Signed against the extension's canonical type, not the reported one.
    expect(presignUpload).toHaveBeenCalledWith("session-user/abc.png", "image/png");
  });

  it("returns 500 when signing fails", async () => {
    vi.mocked(presignUpload).mockRejectedValue(new Error("no credentials"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await callPost(validBody);

    expect(response.status).toBe(500);
  });
});
