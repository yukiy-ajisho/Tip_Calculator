"use client";

import { usePathname } from "next/navigation";

const steps = [
  { number: 1, label: "Import", path: "/tip/import" },
  { number: 2, label: "Review", path: "/tip/edit" },
  { number: 3, label: "Results", path: "/tip/calculate" },
];

export function StepIndicator() {
  const pathname = usePathname();

  // 現在のステップインデックスを取得
  const currentStepIndex = steps.findIndex((step) => step.path === pathname);

  // ステップの状態を判定
  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return "completed"; // 完了
    if (index === currentStepIndex) return "active"; // アクティブ
    return "inactive"; // 未完了
  };

  return (
    <div className="w-full bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isCompleted = status === "completed";
            const isActive = status === "active";

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* ステップ丸とラベル */}
                <div className="flex flex-col items-center flex-1 relative">
                  {/* 丸と数字 */}
                  <div className="relative z-10">
                    {/* 外側のリング（アニメーション用） */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full ring-8 ring-blue-300 shadow-lg shadow-blue-500/50 animate-pulse" />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                        isActive
                          ? "bg-blue-500"
                          : isCompleted
                          ? "bg-blue-500"
                          : "bg-white border-2 border-blue-300"
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold ${
                          isActive || isCompleted
                            ? "text-white"
                            : "text-blue-500"
                        }`}
                      >
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* 接続線（各ステップの右側、最後のステップ以外） */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 h-0.5 ${
                        isCompleted ? "bg-blue-500" : "bg-blue-300"
                      }`}
                      style={{
                        width: "calc(100% - 16px)",
                        marginLeft: "16px",
                      }}
                    />
                  )}

                  {/* ラベル */}
                  <div className="mt-2">
                    <span
                      className={`text-xs font-medium ${
                        isActive
                          ? "text-blue-700"
                          : isCompleted
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
