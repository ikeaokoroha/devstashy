import { beforeEach, describe, expect, it, vi } from "vitest";

import { changePassword, deleteAccount } from "@/actions/profile";
import { signOut } from "@/auth";
import { getBillingUser, type BillingUser } from "@/lib/db/users";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { DELETE_CONFIRMATION } from "@/lib/profile";
import { getStripe } from "@/lib/stripe";

// Server actions are tested with their boundaries mocked: the session, the
// database and bcrypt. Nothing here touches Neon or NextAuth.
vi.mock("@/auth", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/session", () => ({ requireUserId: vi.fn().mockResolvedValue("user-1") }));
vi.mock("@/lib/password", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}));
vi.mock("@/lib/db/users", () => ({ getBillingUser: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripe: vi.fn() }));

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

describe("deleteAccount", () => {
  const stripe = {
    subscriptions: { retrieve: vi.fn(), cancel: vi.fn() },
  };
  const confirmedForm = () => passwordForm({ confirmation: DELETE_CONFIRMATION });
  const billingUser = (stripeSubscriptionId: string | null): BillingUser => ({
    id: "user-1",
    email: "ada@example.com",
    name: "Ada",
    isPro: stripeSubscriptionId !== null,
    stripeCustomerId: stripeSubscriptionId ? "cus_1" : null,
    stripeSubscriptionId,
  });
  const CANCEL_FAILED =
    "Couldn't cancel your subscription, so your account wasn't deleted. Please try again.";

  beforeEach(() => {
    vi.mocked(getStripe).mockReturnValue(stripe as never);
    vi.mocked(getBillingUser).mockResolvedValue(billingUser(null));
    stripe.subscriptions.retrieve.mockResolvedValue({ id: "sub_1", status: "active" });
    stripe.subscriptions.cancel.mockResolvedValue({ id: "sub_1", status: "canceled" });
    vi.mocked(prisma.user.delete).mockResolvedValue({} as never);
  });

  it("refuses without the typed confirmation and touches nothing", async () => {
    const result = await deleteAccount(null, passwordForm({ confirmation: "delete" }));

    expect(result).toEqual({ success: false, error: `Type ${DELETE_CONFIRMATION} to confirm.` });
    expect(getBillingUser).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("deletes a user with no subscription without calling Stripe", async () => {
    const result = await deleteAccount(null, confirmedForm());

    expect(result).toEqual({ success: true });
    expect(stripe.subscriptions.cancel).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/sign-in?deleted=1" });
  });

  it("cancels a live subscription before deleting the user", async () => {
    vi.mocked(getBillingUser).mockResolvedValue(billingUser("sub_1"));

    const result = await deleteAccount(null, confirmedForm());

    expect(result).toEqual({ success: true });
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith("sub_1");
    expect(stripe.subscriptions.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.user.delete).mock.invocationCallOrder[0]
    );
  });

  // A missed webhook can leave an ended subscription stored; canceling it
  // again would throw and block the delete for good.
  it("skips the cancel for a subscription that has already ended", async () => {
    vi.mocked(getBillingUser).mockResolvedValue(billingUser("sub_1"));
    stripe.subscriptions.retrieve.mockResolvedValue({ id: "sub_1", status: "canceled" });

    const result = await deleteAccount(null, confirmedForm());

    expect(result).toEqual({ success: true });
    expect(stripe.subscriptions.cancel).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalled();
  });

  it("keeps the account when Stripe fails to cancel", async () => {
    vi.mocked(getBillingUser).mockResolvedValue(billingUser("sub_1"));
    stripe.subscriptions.cancel.mockRejectedValue(new Error("stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAccount(null, confirmedForm());

    expect(result).toEqual({ success: false, error: CANCEL_FAILED });
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("keeps the account when Stripe isn't configured but a subscription is stored", async () => {
    vi.mocked(getBillingUser).mockResolvedValue(billingUser("sub_1"));
    vi.mocked(getStripe).mockReturnValue(null);

    const result = await deleteAccount(null, confirmedForm());

    expect(result).toEqual({ success: false, error: CANCEL_FAILED });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the delete itself fails", async () => {
    vi.mocked(prisma.user.delete).mockRejectedValue(new Error("connection lost"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAccount(null, confirmedForm());

    expect(result).toEqual({
      success: false,
      error: "Couldn't delete your account. Please try again.",
    });
    expect(signOut).not.toHaveBeenCalled();
  });
});
