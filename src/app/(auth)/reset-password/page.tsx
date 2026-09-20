import type { Metadata } from "next";
import Link from "next/link";

import { FormMessage } from "@/components/auth/FormMessage";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkPasswordResetToken } from "@/lib/password-reset";

export const metadata: Metadata = { title: "Reset password · Devstashy" };

type ResetLink =
  | { status: "valid"; email: string; token: string }
  | { status: "expired" | "invalid" };

const TOKEN_ERROR_MESSAGES = {
  expired: "This reset link has expired. Reset links are only good for 1 hour.",
  invalid: "This reset link is invalid or has already been used.",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Checked, not consumed: the form spends the token when the new password is submitted.
async function checkResetLink(
  email: string | undefined,
  token: string | undefined,
): Promise<ResetLink> {
  if (!email || !token) {
    return { status: "invalid" };
  }
  try {
    const status = await checkPasswordResetToken(email, token);
    return status === "valid" ? { status, email, token } : { status };
  } catch (error) {
    console.error("Failed to check password reset token", error);
    return { status: "invalid" };
  }
}

// Opened from the link in the reset email.
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const params = await searchParams;
  const link = await checkResetLink(firstParam(params.email), firstParam(params.token));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>
          {link.status === "valid"
            ? `Setting a new password for ${link.email}.`
            : "This link can no longer be used."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {link.status === "valid" ? (
          <ResetPasswordForm email={link.email} token={link.token} />
        ) : (
          <>
            <FormMessage variant="error">{TOKEN_ERROR_MESSAGES[link.status]}</FormMessage>
            <Button size="lg" render={<Link href="/forgot-password" />}>
              Request a new link
            </Button>
          </>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
