"use client";

import { useActionState } from "react";

import { signInWithCredentials } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "./FormField";
import { FormMessage } from "./FormMessage";
import { ResendVerificationForm } from "./ResendVerificationForm";

interface SignInFormProps {
  callbackUrl?: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInWithCredentials, null);

  return (
    <>
      <form action={formAction} className="grid gap-4">
        {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state?.data?.email}
          required
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      {state?.data?.emailNotVerified && (
        <ResendVerificationForm key={state.data.email} email={state.data.email} />
      )}
    </>
  );
}
