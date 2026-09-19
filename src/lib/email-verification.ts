import { createHash, randomBytes } from "node:crypto";

import { sendVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// Minimum gap between verification emails to the same address.
const RESEND_COOLDOWN_MS = 60 * 1000;

export const VERIFY_EMAIL_PATH = "/api/auth/verify-email";

export type VerifyEmailResult = "verified" | "expired" | "invalid";

// Only the hash is stored, so a leaked database can't be used to verify accounts.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// The link's origin comes from config, never the request's Host header, so a
// spoofed host can't send the token to another domain.
function getAppUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }
  throw new Error("APP_URL is not set");
}

// Replaces any earlier token for the email, so only the newest link works.
export async function sendVerificationLink(email: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: { identifier: email, token: hashToken(token), expires: new Date(Date.now() + TOKEN_TTL_MS) },
    }),
  ]);

  const url = new URL(VERIFY_EMAIL_PATH, getAppUrl());
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  await sendVerificationEmail(email, url.toString());
}

// Tokens have no createdAt, but one issued within the cooldown still has
// nearly its full lifetime left.
async function wasLinkSentRecently(email: string) {
  const recent = await prisma.verificationToken.findFirst({
    where: { identifier: email, expires: { gt: new Date(Date.now() + TOKEN_TTL_MS - RESEND_COOLDOWN_MS) } },
    select: { identifier: true },
  });
  return recent !== null;
}

// Silently does nothing for unknown, OAuth-only, or already verified emails so
// callers can't use it to find out which emails are registered.
export async function resendVerificationLink(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, emailVerified: true },
  });
  if (!user?.password || user.emailVerified || (await wasLinkSentRecently(email))) {
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
