"use client";

import { StepIndicator } from "@/components/StepIndicator";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { TipNavigationProvider, useTipNavigation } from "@/contexts/TipNavigationContext";

function TipLayoutContent({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useTipNavigation();

  return (
    <div className="flex flex-col h-full relative">
      {/* プログレスバー */}
      <StepIndicator />

      {/* 各ステップのコンテンツ */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Loading Overlay */}
      {isNavigating && <LoadingOverlay />}
    </div>
  );
}

export default function TipLayout({ children }: { children: React.ReactNode }) {
  return (
    <TipNavigationProvider>
      <TipLayoutContent>{children}</TipLayoutContent>
    </TipNavigationProvider>
  );
}
