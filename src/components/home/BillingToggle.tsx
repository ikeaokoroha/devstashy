"use client";

import { cn } from "cn";

import { useBillingPeriod } from "@/components/home/BillingPeriodProvider";
import {
  BILLING_PERIODS,
  BILLING_PERIOD_LABELS,
  PRICING_COPY,
} from "@/lib/home-content";

export function BillingToggle() {
  const { period, setPeriod } = useBillingPeriod();

  return (
    <div className="mt-7 flex justify-center">
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="inline-flex gap-1 rounded-full border bg-card p-1"
      >
        {BILLING_PERIODS.map((option) => {
          const selected = option === period;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPeriod(option)}
              className={cn(
                "inline-flex h-8.5 items-center gap-2 rounded-full px-4.5 text-[13.5px] font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "bg-white/8 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {BILLING_PERIOD_LABELS[option]}
              {option === "yearly" ? (
                <span className="rounded-full border border-type-link/30 bg-type-link/15 px-1.5 py-0.5 text-[10.5px] text-type-link">
                  {PRICING_COPY.save}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
