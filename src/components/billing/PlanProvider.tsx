"use client";

import { createContext, useContext } from "react";

export interface PlanContextValue {
  isPro: boolean;
  // Computed on the server, where the PRO_GATING flag reads correctly; the
  // flag reads as on in a client bundle, so client code never calls
  // hasProAccess() itself.
  hasProAccess: boolean;
}

interface PlanProviderProps {
  value: PlanContextValue;
  children: React.ReactNode;
}

const PlanContext = createContext<PlanContextValue>({ isPro: false, hasProAccess: false });

// The signed-in user's plan for the UI mirrors of the Pro gates. Display only:
// the actions and routes enforce the same rules on the server.
export function PlanProvider({ value, children }: PlanProviderProps) {
  return <PlanContext value={value}>{children}</PlanContext>;
}

export function usePlan(): PlanContextValue {
  return useContext(PlanContext);
}
