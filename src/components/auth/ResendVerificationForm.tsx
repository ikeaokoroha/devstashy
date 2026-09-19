"use client";

import { useActionState } from "react";

import { resendVerificationEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";

interface ResendVerificationFormProps {
  // When the email is already known, only the button is shown.
  email?: string;
}

export function ResendVerificationForm({ email }: ResendVerificationFormProps) {
  const [state, formAction, isPending] = useActionState(resendVerificationEmail, null);

  if (state?.success) {
    return (
      <FormMessage variant="success">
        If that account still needs verifying, a new link is on its way. Check your inbox.
      </FormMessage>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      )}
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
