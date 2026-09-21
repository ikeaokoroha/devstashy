import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { registerSchema } from "@/lib/auth-validation";
import { sendVerificationLink } from "@/lib/email-verification";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/feature-flags";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  rateLimitMessage,
  retryAfterSeconds,
} from "@/lib/rate-limit";

const EMAIL_TAKEN_ERROR = "An account with this email already exists";

function errorResponse(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ success: false, error }, { status, headers });
}

export async function POST(request: Request) {
  // Before parsing the body: an abusive caller shouldn't get any work done.
  const rateLimit = await checkRateLimit("register", getClientIp(request.headers));
  if (!rateLimit.success) {
    return errorResponse(rateLimitMessage(rateLimit.reset), 429, {
      "Retry-After": String(retryAfterSeconds(rateLimit.reset)),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0].message, 400);
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return errorResponse(EMAIL_TAKEN_ERROR, 409);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        // With verification off the address is never confirmed, but marking it
        // verified keeps these accounts usable if the flag is turned back on.
        emailVerified: REQUIRE_EMAIL_VERIFICATION ? null : new Date(),
      },
      select: { id: true, name: true, email: true },
    });

    if (REQUIRE_EMAIL_VERIFICATION) {
      // The account exists either way; if the email fails the user can request a new link.
      try {
        await sendVerificationLink(email);
      } catch (error) {
        console.error("Failed to send verification email", error);
      }
    }

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    // A concurrent registration can claim the email between the check and the insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return errorResponse(EMAIL_TAKEN_ERROR, 409);
    }
    console.error("Registration failed", error);
    return errorResponse("Registration failed. Please try again.", 500);
  }
}
