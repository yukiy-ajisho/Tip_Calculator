"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkingHoursEditTable } from "@/components/WorkingHoursEditTable";
import { TipEditTable } from "@/components/TipEditTable";
import { CashTipEditTable } from "@/components/CashTipEditTable";
import { api } from "@/lib/api";
import {
  FormattedWorkingHours,
  FormattedTipData,
  FormattedCashTip,
} from "@/types";

export default function EditPage() {
  const router = useRouter();

  // タブ切り替えの状態
  const [activeTab, setActiveTab] = useState<
    "workingHours" | "tip" | "cashTip"
  >("workingHours");

  // 編集データの状態
  const [workingHoursData, setWorkingHoursData] = useState<
    FormattedWorkingHours[]
  >([]);
  const [tipData, setTipData] = useState<FormattedTipData[]>([]);
  const [cashTipData, setCashTipData] = useState<FormattedCashTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Working Hours CSV の編集モード状態
  const [isEditingWorkingHours, setIsEditingWorkingHours] = useState(false);

  // ページ読み込み時にSupabaseからデータ取得（3つすべてをチェック）
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 3つすべてを取得
        const [workingHoursResult, tipResult, cashTipResult] =
          await Promise.all([
            api.tips.getFormattedWorkingHours(),
            api.tips.getFormattedTipData(),
            api.tips.getFormattedCashTip(),
          ]);

        // 一つでも欠けていたら /tip/import にリダイレクト
        if (
          !workingHoursResult.success ||
          workingHoursResult.data.length === 0 ||
          !tipResult.success ||
          tipResult.data.length === 0 ||
          !cashTipResult.success ||
          cashTipResult.data.length === 0
        ) {
          router.push("/tip/import");
          return;
        }

        // データを設定
        setWorkingHoursData(workingHoursResult.data);
        setTipData(tipResult.data);
        setCashTipData(cashTipResult.data);
      } catch (err) {
        console.error("Error fetching formatted data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        // エラーが発生した場合も /tip/import にリダイレクト
        router.push("/tip/import");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleBack = () => {
    router.push("/tip/import");
  };

  const handleNext = () => {
    // 将来的には編集データをSupabaseに保存
    // await saveToSupabase(workingHoursData, tipData);
    router.push("/tip/calculate");
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* タブボタン */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab("workingHours")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "workingHours"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Working Hours CSV
          </button>
          <button
            onClick={() => setActiveTab("tip")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "tip"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tip CSV
          </button>
          <button
            onClick={() => setActiveTab("cashTip")}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "cashTip"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Cash Tip
          </button>
        </div>

        {/* Working Hours CSV タブのコンテンツ */}
        {activeTab === "workingHours" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {/* Edit/Saveボタン */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  if (isEditingWorkingHours) {
                    // Save処理（将来的にはSupabaseに保存）
                    // TODO: 保存処理を実装
                    setIsEditingWorkingHours(false);
                  } else {
                    setIsEditingWorkingHours(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditingWorkingHours
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isEditingWorkingHours ? "Save" : "Edit"}
              </button>
            </div>

            {isLoading ? (
              <p className="text-gray-600">Loading working hours data...</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : workingHoursData.length === 0 ? (
              <p className="text-gray-500">
                No working hours data available. Please import a file first.
              </p>
            ) : (
              <WorkingHoursEditTable
                data={workingHoursData}
                isEditing={isEditingWorkingHours}
                onDataChange={setWorkingHoursData}
              />
            )}
          </div>
        )}

        {/* Tip CSV タブのコンテンツ */}
        {activeTab === "tip" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {isLoading ? (
              <p className="text-gray-600">Loading tip data...</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : tipData.length === 0 ? (
              <p className="text-gray-500">
                No tip data available. Please import a file first.
              </p>
            ) : (
              <TipEditTable data={tipData} />
            )}
          </div>
        )}

        {/* Cash Tip タブのコンテンツ */}
        {activeTab === "cashTip" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {isLoading ? (
              <p className="text-gray-600">Loading cash tip data...</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : cashTipData.length === 0 ? (
              <p className="text-gray-500">
                No cash tip data available. Please import a file first.
              </p>
            ) : (
              <CashTipEditTable data={cashTipData} />
            )}
          </div>
        )}

        {/* Back/Nextボタン */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
