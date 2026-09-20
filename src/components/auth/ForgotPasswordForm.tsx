"use client";

import { useActionState } from "react";

import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

  if (state?.success) {
    return (
      <FormMessage variant="success">
        If an account exists for that email, a password reset link is on its way. The link expires
        in 1 hour.
      </FormMessage>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
