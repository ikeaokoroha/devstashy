import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

// Shared by email verification and password reset, both of which store their
// tokens in VerificationToken. The identifier namespaces them apart, so issuing
// one kind of token never deletes the other's.
interface TokenOptions {
  identifier: string;
  ttlMs: number;
}

// Only the hash is stored, so a leaked database can't be used to verify
// accounts or take over one through a reset link.
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Link origins come from config, never the request's Host header, so a spoofed
// host can't send a token to another domain.
export function getAppUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }
  throw new Error("APP_URL is not set");
}

// Replaces any earlier token for the identifier, so only the newest link works.
// Returns the raw token; only its hash reaches the database.
export async function issueToken({ identifier, ttlMs }: TokenOptions) {
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(token), expires: new Date(Date.now() + ttlMs) },
    }),
  ]);
  return token;
}

// Used to undo an issued token when its email fails to send, so the cooldown
// keeps meaning "a link really went out" and doesn't swallow the retry.
export async function revokeTokens(identifier: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier } });
}

// Tokens have no createdAt, but one issued within the cooldown still has nearly
// its full lifetime left.
export async function wasTokenIssuedRecently(
  { identifier, ttlMs }: TokenOptions,
  cooldownMs: number,
) {
  const recent = await prisma.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date(Date.now() + ttlMs - cooldownMs) } },
    select: { identifier: true },
  });
  return recent !== null;
}
