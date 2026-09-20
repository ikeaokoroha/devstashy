import {
  getAppUrl,
  hashToken,
  issueToken,
  revokeTokens,
  wasTokenIssuedRecently,
} from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// Minimum gap between verification emails to the same address.
const RESEND_COOLDOWN_MS = 60 * 1000;

export const VERIFY_EMAIL_PATH = "/api/auth/verify-email";

export type VerifyEmailResult = "verified" | "expired" | "invalid";

// Verification tokens are stored under the bare email; password reset namespaces
// its own identifier so the two never collide.
function tokenOptions(email: string) {
  return { identifier: email, ttlMs: TOKEN_TTL_MS };
}

export async function sendVerificationLink(email: string) {
  const token = await issueToken(tokenOptions(email));

  const url = new URL(VERIFY_EMAIL_PATH, getAppUrl());
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);

  try {
    await sendVerificationEmail(email, url.toString());
  } catch (error) {
    // The token is already stored, so leaving it would make the resend cooldown
    // skip the next attempt even though no link ever arrived.
    await revokeTokens(tokenOptions(email).identifier);
    throw error;
  }
}

// Silently does nothing for unknown, OAuth-only, or already verified emails so
// callers can't use it to find out which emails are registered.
export async function resendVerificationLink(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, emailVerified: true },
  });
  if (
    !user?.password ||
    user.emailVerified ||
    (await wasTokenIssuedRecently(tokenOptions(email), RESEND_COOLDOWN_MS))
  ) {
    return;
  }
  await sendVerificationLink(email);
}

export async function verifyEmailToken(email: string, token: string): Promise<VerifyEmailResult> {
  const where = { identifier: email, token: hashToken(token) };
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: where },
    select: { expires: true },
  });
  if (!record) {
    return "invalid";
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where });
    return "expired";
  }

  // Deleting first makes the token single-use even if the link is opened twice at once.
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.verificationToken.deleteMany({ where });
    if (count === 0) {
      return "invalid";
    }
    await tx.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: new Date() },
    });
    return "verified";
  });
}
