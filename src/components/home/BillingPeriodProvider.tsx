"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { BillingPeriod } from "@/lib/home-content";

interface BillingPeriodContextValue {
  period: BillingPeriod;
  setPeriod: (period: BillingPeriod) => void;
}

const BillingPeriodContext = createContext<BillingPeriodContextValue | null>(
  null,
);

/**
 * Holds the pricing section's monthly/yearly choice, so the toggle and the Pro
 * card's price are the only client pieces inside a server-rendered section.
 */
export function BillingPeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const value = useMemo(() => ({ period, setPeriod }), [period]);

  return (
    <BillingPeriodContext.Provider value={value}>
      {children}
    </BillingPeriodContext.Provider>
  );
}

export function useBillingPeriod(): BillingPeriodContextValue {
  const context = useContext(BillingPeriodContext);
  if (!context) {
    throw new Error(
      "useBillingPeriod must be used within a BillingPeriodProvider",
    );
  }
  return context;
}
