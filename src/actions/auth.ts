"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";
import { signInSchema } from "@/lib/auth-validation";
import type { ActionResult } from "@/types/actions";

const DEFAULT_SIGN_IN_REDIRECT = "/dashboard";

// Auth.js's redirect callback keeps the callback URL on this origin.
function getRedirectTo(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl");
  return typeof callbackUrl === "string" && callbackUrl ? callbackUrl : DEFAULT_SIGN_IN_REDIRECT;
}

// The email is echoed back so the form can refill it after React resets it.
export async function signInWithCredentials(
  _previous: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
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

export async function signInWithGitHub(formData: FormData) {
  await signIn("github", { redirectTo: getRedirectTo(formData) });
}

export async function signOutUser() {
  await signOut({ redirectTo: SIGN_IN_PATH });
}
