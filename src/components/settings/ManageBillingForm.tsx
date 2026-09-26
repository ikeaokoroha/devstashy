"use client";

import { useActionState } from "react";

import { openBillingPortal } from "@/actions/billing";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types/actions";

export function ManageBillingForm() {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    openBillingPortal,
    null
  );

  return (
    <form action={formAction} className="grid gap-3">
      {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <div>
        <Button type="submit" size="lg" variant="outline" disabled={isPending}>
          {isPending ? "Opening..." : "Manage subscription"}
        </Button>
      </div>
    </form>
  );
}
