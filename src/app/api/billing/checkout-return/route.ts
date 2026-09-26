import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";
import { getAppUrl } from "@/lib/auth-tokens";
import { syncCheckoutSession } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

// Checkout's success_url. Syncs the subscription before the user sees
// /settings, so they land as Pro even if the webhook hasn't arrived yet.
// The webhook stays authoritative; a failure here only logs.
export async function GET(request: Request) {
  const appUrl = getAppUrl();

  // The proxy doesn't cover /api, so the route checks the session itself.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL(SIGN_IN_PATH, appUrl));
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  const stripe = getStripe();
  if (stripe && sessionId) {
    try {
      await syncCheckoutSession(stripe, session.user.id, sessionId);
    } catch (error) {
      console.error("Failed to sync checkout session", error);
    }
  }

  return NextResponse.redirect(new URL("/settings?checkout=success", appUrl));
}
