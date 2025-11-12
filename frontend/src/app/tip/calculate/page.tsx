"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CalculationSuccessModal from "@/components/CalculationSuccessModal";

export default function CalculatePage() {
  const router = useRouter();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // 仮データ（将来的にはSupabaseから取得）
  const store = "Burlingame";
  const periodStart = "10/13/2025";
  const periodEnd = "10/26/2025";

  const handleBack = () => {
    router.push("/tip/edit");
  };

  const handleCalculate = () => {
    // 将来的には実際の計算処理を実行
    // 現在はモックなので、モーダルを表示するだけ
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Calculate</h2>

        {/* Store と Period の表示 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store
              </label>
              <p className="text-lg text-gray-900">{store}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <p className="text-lg text-gray-900">
                {periodStart} - {periodEnd}
              </p>
            </div>
          </div>
        </div>

        {/* 計算結果エリア（将来の実装） */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <p className="text-gray-600">
            Calculation results will be displayed here.
          </p>
        </div>

        {/* BackボタンとCalculateボタン */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleCalculate}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Tips
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <CalculationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
}
