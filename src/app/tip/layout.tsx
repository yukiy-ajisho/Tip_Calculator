import { StepIndicator } from "@/components/StepIndicator";

export default function TipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      {/* プログレスバー */}
      <StepIndicator />

      {/* 各ステップのコンテンツ */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
