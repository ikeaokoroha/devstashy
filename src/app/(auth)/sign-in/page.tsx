import type { Metadata } from "next";
import Link from "next/link";

import { FormMessage } from "@/components/auth/FormMessage";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/feature-flags";

export const metadata: Metadata = { title: "Sign in · Devstashy" };

// Auth.js redirects failed OAuth sign-ins here with ?error=<type>.
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "This email is already registered with a password. Sign in with your email and password instead.",
  AccessDenied: "Access was denied. Please try again.",
};
const DEFAULT_OAUTH_ERROR = "Sign in failed. Please try again.";

// The verify-email route redirects here with ?verifyError=<result>.
const VERIFY_ERROR_MESSAGES: Record<string, string> = {
  expired: "This verification link has expired. Enter your email to get a new one.",
  invalid:
    "This verification link is invalid or has already been used. If you still need to verify, enter your email to get a new one.",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const callbackUrl = firstParam(params.callbackUrl);
  const error = firstParam(params.error);
  const registered = firstParam(params.registered) === "1";
  // Verification banners only make sense while the flag is on.
  const verified = REQUIRE_EMAIL_VERIFICATION && firstParam(params.verified) === "1";
  const verifyErrorParam = REQUIRE_EMAIL_VERIFICATION ? firstParam(params.verifyError) : undefined;
  const verifyError = verifyErrorParam && VERIFY_ERROR_MESSAGES[verifyErrorParam];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Welcome back. Sign in to your account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {registered && (
          <FormMessage variant="success">
            {REQUIRE_EMAIL_VERIFICATION
              ? "Account created. Check your email for a link to verify your address, then sign in."
              : "Account created. Sign in to continue."}
          </FormMessage>
        )}
        {verified && (
          <FormMessage variant="success">Email verified. Sign in to continue.</FormMessage>
        )}
        {verifyError && (
          <>
            <FormMessage variant="error">{verifyError}</FormMessage>
            <ResendVerificationForm />
          </>
        )}
        {error && (
          <FormMessage variant="error">
            {OAUTH_ERROR_MESSAGES[error] ?? DEFAULT_OAUTH_ERROR}
          </FormMessage>
        )}
        <GitHubSignInButton callbackUrl={callbackUrl} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <SignInForm callbackUrl={callbackUrl} />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
