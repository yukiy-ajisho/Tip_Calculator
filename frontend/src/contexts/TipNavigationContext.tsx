"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";

interface TipNavigationContextType {
  isNavigating: boolean;
  setIsNavigating: (value: boolean) => void;
}

const TipNavigationContext = createContext<
  TipNavigationContextType | undefined
>(undefined);

export function TipNavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);

  const value = useMemo(
    () => ({ isNavigating, setIsNavigating }),
    [isNavigating]
  );

  return (
    <TipNavigationContext.Provider value={value}>
      {children}
    </TipNavigationContext.Provider>
  );
}

export function useTipNavigation() {
  const context = useContext(TipNavigationContext);
  if (context === undefined) {
    throw new Error(
      "useTipNavigation must be used within a TipNavigationProvider"
    );
  }
  return context;
}

