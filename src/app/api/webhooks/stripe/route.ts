import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { handleStripeEvent } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Not behind the proxy or a session: Stripe authenticates with the signature.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return errorResponse("Billing isn't configured.", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return errorResponse("Missing signature.", 400);
  }

  // The signature covers the exact bytes, so read the raw text, not JSON.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return errorResponse("Invalid signature.", 400);
  }

  try {
    await handleStripeEvent(stripe, event);
  } catch (error) {
    // A 5xx makes Stripe retry with backoff for up to three days.
    console.error(`Failed to handle Stripe event ${event.type} (${event.id})`, error);
    return errorResponse("Webhook handler failed.", 500);
  }

  return NextResponse.json({ received: true });
}
