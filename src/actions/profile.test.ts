import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword } from "@/actions/profile";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

// Server actions are tested with their boundaries mocked: the session, the
// database and bcrypt. Nothing here touches Neon or NextAuth.
vi.mock("@/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/password", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

function passwordForm(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

const validForm = {
  currentPassword: "old-password",
  password: "new-password",
  confirmPassword: "new-password",
};

describe("changePassword", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: "stored-hash" } as never);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue("new-hash");
  });

  it("returns field errors without touching the database when validation fails", async () => {
    const result = await changePassword(
      null,
      passwordForm({ ...validForm, confirmPassword: "mismatch" }),
    );

    expect(result.success).toBe(false);
    expect(result.data?.fieldErrors?.confirmPassword).toBe("Passwords do not match");
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects OAuth-only accounts", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: null } as never);

    const result = await changePassword(null, passwordForm(validForm));

    expect(result).toEqual({
      success: false,
      error: "This account signs in with GitHub, so it has no password.",
    });
  });

  it("rejects a wrong current password", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const result = await changePassword(null, passwordForm(validForm));

    expect(result.data?.fieldErrors?.currentPassword).toBe("That's not your current password");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("stores the new hash for the signed-in user", async () => {
    const result = await changePassword(null, passwordForm(validForm));

    expect(result).toEqual({ success: true });
    expect(verifyPassword).toHaveBeenCalledWith("old-password", "stored-hash");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hash" },
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.mocked(prisma.user.update).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await changePassword(null, passwordForm(validForm));

    expect(result).toEqual({
      success: false,
      error: "Couldn't change your password. Please try again.",
    });
  });
});
