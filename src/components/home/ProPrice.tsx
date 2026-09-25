"use client";

import { useBillingPeriod } from "@/components/home/BillingPeriodProvider";
import { PRO_PRICING } from "@/lib/home-content";

/** The Pro card's price and blurb, the only part of the card that changes. */
export function ProPrice() {
  const { period } = useBillingPeriod();
  const { amount, period: label, blurb } = PRO_PRICING[period];

  return (
    <>
      <p className="mt-2.5 flex items-baseline gap-2">
        <span className="text-5xl font-extrabold tracking-tight">{amount}</span>
        <span className="text-sm text-muted-foreground/70">{label}</span>
      </p>
      <p className="mt-2 min-h-11 text-sm text-muted-foreground">{blurb}</p>
    </>
  );
}
