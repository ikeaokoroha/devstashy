import {
  getAppUrl,
  hashToken,
  issueToken,
  revokeTokens,
  wasTokenIssuedRecently,
} from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

// Short-lived: a reset link hands over the account, so it shouldn't sit in an
// inbox for a day the way a verification link can.
const TOKEN_TTL_MS = 60 * 60 * 1000;
// Minimum gap between reset emails to the same address.
const RESEND_COOLDOWN_MS = 60 * 1000;

export const RESET_PASSWORD_PATH = "/reset-password";

export type PasswordResetTokenResult = "valid" | "expired" | "invalid";
export type PasswordResetResult = "reset" | "expired" | "invalid";

// Namespaced so issuing or consuming a reset token never touches the
// verification token stored under the bare email.
function tokenOptions(email: string) {
  return { identifier: `password-reset:${email}`, ttlMs: TOKEN_TTL_MS };
}

function tokenWhere(email: string, token: string) {
  return { identifier: tokenOptions(email).identifier, token: hashToken(token) };
}

// Silently does nothing for unknown or OAuth-only emails, and for addresses
// already sent a link, so callers can't use it to find out which emails are
// registered or flood an inbox.
export async function sendPasswordResetLink(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { password: true } });
  if (!user?.password || (await wasTokenIssuedRecently(tokenOptions(email), RESEND_COOLDOWN_MS))) {
    return;
  }

  const token = await issueToken(tokenOptions(email));
  const url = new URL(RESET_PASSWORD_PATH, getAppUrl());
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);

  try {
    await sendPasswordResetEmail(email, url.toString());
  } catch (error) {
    // The token is already stored, so leaving it would make the cooldown skip
    // the retry the caller is about to be told to make.
    await revokeTokens(tokenOptions(email).identifier);
    throw error;
  }
}

// Checks without consuming, so the reset page can show the form (or an expired
// message) before the new password is typed.
export async function checkPasswordResetToken(
  email: string,
  token: string,
): Promise<PasswordResetTokenResult> {
  const where = tokenWhere(email, token);
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
  return "valid";
}

export async function resetPasswordWithToken(
  email: string,
  token: string,
  newPassword: string,
): Promise<PasswordResetResult> {
  const check = await checkPasswordResetToken(email, token);
  if (check !== "valid") {
    return check;
  }

  const where = tokenWhere(email, token);
  const password = await hashPassword(newPassword);

  // Deleting first makes the token single-use even if the form is submitted twice at once.
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.verificationToken.deleteMany({ where });
    if (count === 0) {
      return "invalid";
    }

    // Guarded on password so a link can't set one on an OAuth-only account that
    // dropped its password between the request and the reset.
    const { count: updated } = await tx.user.updateMany({
      where: { email, password: { not: null } },
      data: { password },
    });
    if (updated === 0) {
      return "invalid";
    }

    // Receiving the email proves the address is theirs, so an unverified account
    // that resets is verified too rather than being left unable to sign in.
    await tx.user.updateMany({ where: { email, emailVerified: null }, data: { emailVerified: new Date() } });
    return "reset";
  });
}
