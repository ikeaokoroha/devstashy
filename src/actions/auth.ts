"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";
import { EmailNotVerifiedError } from "@/lib/auth-errors";
import { resendVerificationSchema, signInSchema } from "@/lib/auth-validation";
import { resendVerificationLink } from "@/lib/email-verification";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/feature-flags";
import type { ActionResult } from "@/types/actions";

const DEFAULT_SIGN_IN_REDIRECT = "/dashboard";

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

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getRedirectTo(formData) });
}

export async function signOutUser() {
  await signOut({ redirectTo: SIGN_IN_PATH });
}
