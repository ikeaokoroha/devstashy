import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { registerSchema } from "@/lib/auth-validation";
import { sendVerificationLink } from "@/lib/email-verification";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;
const EMAIL_TAKEN_ERROR = "An account with this email already exists";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
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
        password: await bcrypt.hash(password, BCRYPT_ROUNDS),
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
