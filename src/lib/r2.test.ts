import { beforeEach, describe, expect, it, vi } from "vitest";

// The config is read once and cached per module instance, so each test imports
// a fresh copy against its own environment.
async function importR2(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  return import("@/lib/r2");
}

const CONFIGURED = {
  R2_ACCOUNT_ID: "acct-1",
  R2_ACCESS_KEY_ID: "key-1",
  R2_SECRET_ACCESS_KEY: "secret-1",
  R2_BUCKET_NAME: "devstashy-files",
  R2_PUBLIC_URL: "https://pub-test.r2.dev",
};

describe("isR2Configured", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("is true with every variable set", async () => {
    const { isR2Configured } = await importR2(CONFIGURED);

    expect(isR2Configured()).toBe(true);
  });

  it("is false when one is missing", async () => {
    const { isR2Configured } = await importR2({ ...CONFIGURED, R2_BUCKET_NAME: undefined });

    expect(isR2Configured()).toBe(false);
  });
});

describe("buildObjectKey", () => {
  it("prefixes the key with the owner and keeps the extension", async () => {
    const { buildObjectKey } = await importR2(CONFIGURED);

    expect(buildObjectKey("user-1", "png")).toMatch(/^user-1\/[0-9a-f-]{36}\.png$/);
  });

  it("never repeats a key for the same user", async () => {
    const { buildObjectKey } = await importR2(CONFIGURED);

    expect(buildObjectKey("user-1", "pdf")).not.toBe(buildObjectKey("user-1", "pdf"));
  });

  it("omits the dot when the file has no extension", async () => {
    const { buildObjectKey } = await importR2(CONFIGURED);

    expect(buildObjectKey("user-1", "")).toMatch(/^user-1\/[0-9a-f-]{36}$/);
  });
});

describe("getPublicFileUrl", () => {
  it("builds the URL from the public host", async () => {
    const { getPublicFileUrl } = await importR2(CONFIGURED);

    expect(getPublicFileUrl("user-1/abc.png")).toBe("https://pub-test.r2.dev/user-1/abc.png");
  });

  it("doesn't double the slash when the host has a trailing one", async () => {
    const { getPublicFileUrl } = await importR2({
      ...CONFIGURED,
      R2_PUBLIC_URL: "https://pub-test.r2.dev/",
    });

    expect(getPublicFileUrl("user-1/abc.png")).toBe("https://pub-test.r2.dev/user-1/abc.png");
  });
});

describe("getObjectKeyFromUrl", () => {
  it("returns the key of one of our own URLs", async () => {
    const { getObjectKeyFromUrl } = await importR2(CONFIGURED);

    expect(getObjectKeyFromUrl("https://pub-test.r2.dev/user-1/abc.png")).toBe("user-1/abc.png");
  });

  // Delete and download both route through this, so anything outside the
  // bucket's public host has to come back as "not ours".
  it("rejects a URL on another host", async () => {
    const { getObjectKeyFromUrl } = await importR2(CONFIGURED);

    expect(getObjectKeyFromUrl("https://evil.example.com/user-1/abc.png")).toBeNull();
  });

  it("rejects a host that only starts the same way", async () => {
    const { getObjectKeyFromUrl } = await importR2(CONFIGURED);

    expect(getObjectKeyFromUrl("https://pub-test.r2.dev.evil.com/user-1/abc.png")).toBeNull();
  });

  it("rejects the bare host with no key", async () => {
    const { getObjectKeyFromUrl } = await importR2(CONFIGURED);

    expect(getObjectKeyFromUrl("https://pub-test.r2.dev/")).toBeNull();
  });

  it("decodes an escaped key", async () => {
    const { getObjectKeyFromUrl } = await importR2(CONFIGURED);

    expect(getObjectKeyFromUrl("https://pub-test.r2.dev/user-1/a%20b.png")).toBe("user-1/a b.png");
  });
});
