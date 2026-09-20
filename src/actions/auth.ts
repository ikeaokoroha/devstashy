"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";
import { EmailNotVerifiedError } from "@/lib/auth-errors";
import {
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/auth-validation";
import { resendVerificationLink } from "@/lib/email-verification";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/feature-flags";
import {
  resetPasswordWithToken,
  sendPasswordResetLink,
  type PasswordResetResult,
} from "@/lib/password-reset";
import type { ActionResult } from "@/types/actions";

const DEFAULT_SIGN_IN_REDIRECT = "/dashboard";
const RESET_LINK_INVALID_ERROR =
  "This reset link is invalid or has already been used. Request a new one.";

interface SignInData {
  email: string;
  emailNotVerified?: boolean;
}

// Auth.js's redirect callback keeps the callback URL on this origin.
function getRedirectTo(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  return typeof callbackUrl === "string" && callbackUrl ? callbackUrl : DEFAULT_SIGN_IN_REDIRECT;
}

// The email is echoed back so the form can refill it after React resets it.
export async function signInWithCredentials(
  _previous: ActionResult<SignInData> | null,
  formData: FormData,
): Promise<ActionResult<SignInData>> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { success: false, data: { email }, error: "Enter a valid email and password" };
  }

  try {
    // Redirects on success by throwing, so this only returns on failure.
    await signIn("credentials", { ...parsed.data, redirectTo: getRedirectTo(formData) });
    return { success: true };
  } catch (error) {
    if (error instanceof EmailNotVerifiedError) {
      return {
        success: false,
        data: { email, emailNotVerified: true },
        error: "Verify your email before signing in. Check your inbox for the link.",
      };
    }
    if (error instanceof AuthError) {
      const message =
        error.type === "CredentialsSignin"
          ? "Invalid email or password"
          : "Sign in failed. Please try again.";
      return { success: false, data: { email }, error: message };
    }
    throw error;
  }
}

// Replies the same way whether or not a link was sent, so it can't be used to
// find out which emails are registered.
export async function resendVerificationEmail(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // With verification off nothing links here, but a stale page could still submit.
  if (!REQUIRE_EMAIL_VERIFICATION) {
    return { success: true };
  }

  const parsed = resendVerificationSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email" };
  }

  try {
    await resendVerificationLink(parsed.data.email);
    return { success: true };
  } catch (error) {
    console.error("Failed to resend verification email", error);
    return { success: false, error: "Couldn't send the email. Please try again." };
  }
}

// Replies the same way whether or not the email has an account, so it can't be
// used to find out which emails are registered.
export async function requestPasswordReset(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { success: false, error: "Enter a valid email" };
  }

  try {
    await sendPasswordResetLink(parsed.data.email);
    return { success: true };
  } catch (error) {
    console.error("Failed to send password reset email", error);
    return { success: false, error: "Couldn't send the email. Please try again." };
  }
}

interface ResetPasswordData {
  fieldErrors?: Partial<Record<"password" | "confirmPassword", string>>;
  // The link is no good, so a new one is the only way forward.
  linkExpired?: boolean;
}

export async function resetPassword(
  _previous: ActionResult<ResetPasswordData> | null,
  formData: FormData,
): Promise<ActionResult<ResetPasswordData>> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    // A bad email or token means a mangled link, not something the user can fix here.
    if (fieldErrors.email || fieldErrors.token) {
      return { success: false, data: { linkExpired: true }, error: RESET_LINK_INVALID_ERROR };
    }
    return {
      success: false,
      data: {
        fieldErrors: {
          password: fieldErrors.password?.[0],
          confirmPassword: fieldErrors.confirmPassword?.[0],
        },
      },
    };
  }

  const { email, token, password } = parsed.data;
  let result: PasswordResetResult;
  try {
    result = await resetPasswordWithToken(email, token, password);
  } catch (error) {
    console.error("Password reset failed", error);
    return { success: false, error: "Couldn't reset your password. Please try again." };
  }

  if (result !== "reset") {
    return {
      success: false,
      data: { linkExpired: true },
      error:
        result === "expired"
          ? "This reset link has expired. Request a new one."
          : RESET_LINK_INVALID_ERROR,
    };
  }

  // Outside the try: redirect signals by throwing.
  redirect(`${SIGN_IN_PATH}?reset=1`);
}

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getRedirectTo(formData) });
}

export async function signOutUser() {
  await signOut({ redirectTo: SIGN_IN_PATH });
}
