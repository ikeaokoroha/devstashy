"use client";

import Link from "next/link";
import { useActionState } from "react";

import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";

interface ResetPasswordFormProps {
  email: string;
  token: string;
}

// The token was checked when the page rendered, but it can still expire or be
// used elsewhere before this is submitted.
export function ResetPasswordForm({ email, token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(resetPassword, null);
  const fieldErrors = state?.data?.fieldErrors;

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        error={fieldErrors?.password}
        required
      />
      <FormField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={fieldErrors?.confirmPassword}
        required
      />
      {state?.data?.linkExpired ? (
        <Button size="lg" variant="outline" render={<Link href="/forgot-password" />}>
          Request a new link
        </Button>
      ) : (
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Saving..." : "Reset password"}
        </Button>
      )}
    </form>
  );
}
