"use client";

import { useActionState } from "react";

import { startCheckout } from "@/actions/billing";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import { PRO_PRICING } from "@/lib/home-content";
import { BILLING_INTERVALS, type BillingInterval } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";

interface UpgradeFormProps {
  // Overrides the default "Upgrade — $8/month" style button text.
  labels?: Record<BillingInterval, string>;
  centered?: boolean;
}

// One submit button per interval: the clicked button's name/value is the only
// thing the action reads, and it resolves the price id on the server.
export function UpgradeForm({ labels, centered = false }: UpgradeFormProps) {
  const [state, formAction, isPending] = useActionState(startCheckout, null);

  return (
    <form action={formAction} className={cn("grid gap-3", centered && "justify-items-center")}>
      {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <div className={cn("flex flex-wrap gap-3", centered && "justify-center")}>
        {BILLING_INTERVALS.map((interval) => {
          const { amount, period } = PRO_PRICING[interval];
          return (
            <Button
              key={interval}
              type="submit"
              name="interval"
              value={interval}
              size="lg"
              variant={interval === "yearly" ? "default" : "outline"}
              disabled={isPending}
            >
              {labels?.[interval] ?? `Upgrade — ${amount}${period}`}
            </Button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">{PRO_PRICING.yearly.blurb}</p>
    </form>
  );
}
