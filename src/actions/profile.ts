"use server";

import { z } from "zod";

import { signOut } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";
import { changePasswordSchema } from "@/lib/auth-validation";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { DELETE_CONFIRMATION } from "@/lib/profile";
import { requireUserId } from "@/lib/session";
import type { ActionResult } from "@/types/actions";

type ChangePasswordField = "currentPassword" | "password" | "confirmPassword";

interface ChangePasswordData {
  fieldErrors?: Partial<Record<ChangePasswordField, string>>;
}

export async function changePassword(
  _previous: ActionResult<ChangePasswordData> | null,
  formData: FormData,
): Promise<ActionResult<ChangePasswordData>> {
  const userId = await requireUserId();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return {
      success: false,
      data: {
        fieldErrors: {
          currentPassword: fieldErrors.currentPassword?.[0],
          password: fieldErrors.password?.[0],
          confirmPassword: fieldErrors.confirmPassword?.[0],
        },
      },
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    // No password means an OAuth-only account, which has nothing to change.
    if (!user?.password) {
      return { success: false, error: "This account signs in with GitHub, so it has no password." };
    }

    const isValid = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!isValid) {
      return {
        success: false,
        data: { fieldErrors: { currentPassword: "That's not your current password" } },
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: await hashPassword(parsed.data.password) },
    });
  } catch (error) {
    console.error("Failed to change password", error);
    return { success: false, error: "Couldn't change your password. Please try again." };
  }

  // Sessions issued before the change stay valid, same as after a reset: the JWT
  // strategy has no way to revoke them without a token-version column.
  return { success: true };
}

// Every row the user owns cascades from User, so one delete clears their items,
// collections, custom types, OAuth accounts and sessions with it.
export async function deleteAccount(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await requireUserId();

  if (formData.get("confirmation") !== DELETE_CONFIRMATION) {
    return { success: false, error: `Type ${DELETE_CONFIRMATION} to confirm.` };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error("Failed to delete account", error);
    return { success: false, error: "Couldn't delete your account. Please try again." };
  }

  // Outside the try: signOut signals its redirect by throwing.
  await signOut({ redirectTo: `${SIGN_IN_PATH}?deleted=1` });
  return { success: true };
}
