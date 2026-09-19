import { NextResponse, type NextRequest } from "next/server";

import { SIGN_IN_PATH } from "@/auth.config";
import { verifyEmailToken, type VerifyEmailResult } from "@/lib/email-verification";

function redirectToSignIn(request: NextRequest, result: VerifyEmailResult) {
  const url = new URL(SIGN_IN_PATH, request.url);
  if (result === "verified") {
    url.searchParams.set("verified", "1");
  } else {
    url.searchParams.set("verifyError", result);
  }
  return NextResponse.redirect(url);
}

// Opened from the link in the verification email.
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const token = request.nextUrl.searchParams.get("token");
  if (!email || !token) {
    return redirectToSignIn(request, "invalid");
  }

  try {
    return redirectToSignIn(request, await verifyEmailToken(email, token));
  } catch (error) {
    console.error("Email verification failed", error);
    return redirectToSignIn(request, "invalid");
  }
}
