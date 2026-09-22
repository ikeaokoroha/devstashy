import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/items/[id]/download/route";
import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getObject, getObjectKeyFromUrl } from "@/lib/r2";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ getItemFile: vi.fn() }));
vi.mock("@/lib/r2", () => ({ getObject: vi.fn(), getObjectKeyFromUrl: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper); tests only use the getter form.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

function callGet(id: string) {
  return GET(new Request(`http://localhost/api/items/${id}/download`), {
    params: Promise.resolve({ id }),
  });
}

function streamOf(text: string): ReadableStream {
  return new Response(text).body as ReadableStream;
}

describe("GET /api/items/[id]/download", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "session-user" } });
    vi.mocked(getItemFile).mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/session-user/abc.pdf",
      fileName: "notes.pdf",
    });
    vi.mocked(getObjectKeyFromUrl).mockReturnValue("session-user/abc.pdf");
    vi.mocked(getObject).mockResolvedValue({
      body: streamOf("file bytes"),
      contentType: "application/pdf",
      contentLength: 10,
    });
  });

  it("returns 401 without a session and reads nothing", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await callGet("item-1");

    expect(response.status).toBe(401);
    expect(getItemFile).not.toHaveBeenCalled();
  });

  it("returns 404 when the user has no such file item", async () => {
    vi.mocked(getItemFile).mockResolvedValue(null);

    const response = await callGet("someone-elses-item");

    expect(response.status).toBe(404);
    expect(getItemFile).toHaveBeenCalledWith("session-user", "someone-elses-item");
    expect(getObject).not.toHaveBeenCalled();
  });

  // A stored URL pointing anywhere else must not be fetched on the user's behalf.
  it("returns 404 when the stored URL isn't in our bucket", async () => {
    vi.mocked(getObjectKeyFromUrl).mockReturnValue(null);

    const response = await callGet("item-1");

    expect(response.status).toBe(404);
    expect(getObject).not.toHaveBeenCalled();
  });

  it("returns 404 when the object is gone from R2", async () => {
    vi.mocked(getObject).mockResolvedValue(null);

    expect((await callGet("item-1")).status).toBe(404);
  });

  it("streams the file as an attachment under its original name", async () => {
    const response = await callGet("item-1");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      `attachment; filename="notes.pdf"; filename*=UTF-8''notes.pdf`
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.text()).toBe("file bytes");
  });

  // A quote or newline in the name would otherwise break the header.
  it("sanitises a file name that can't go in a header", async () => {
    vi.mocked(getItemFile).mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/session-user/abc.pdf",
      fileName: 'we"ird\nname.pdf',
    });

    const disposition = (await callGet("item-1")).headers.get("Content-Disposition");

    expect(disposition).toContain('filename="we_ird_name.pdf"');
    expect(disposition).not.toContain("\n");
  });

  it("keeps a non-ASCII name in the encoded form", async () => {
    vi.mocked(getItemFile).mockResolvedValue({
      fileUrl: "https://pub-test.r2.dev/session-user/abc.pdf",
      fileName: "notes-café.pdf",
    });

    const disposition = (await callGet("item-1")).headers.get("Content-Disposition");

    expect(disposition).toContain("filename*=UTF-8''notes-caf%C3%A9.pdf");
  });

  it("returns 500 when R2 fails", async () => {
    vi.mocked(getObject).mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect((await callGet("item-1")).status).toBe(500);
  });
});
