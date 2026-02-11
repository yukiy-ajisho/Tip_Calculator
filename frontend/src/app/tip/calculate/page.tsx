"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CalculationSuccessModal from "@/components/CalculationSuccessModal";
import { useTipNavigation } from "@/contexts/TipNavigationContext";
import { api } from "@/lib/api";
import { TipCalculationResult, CalculationInfo } from "@/types";

export default function CalculatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calculationId = searchParams.get("calculationId");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<CalculationInfo | null>(null);
  const [results, setResults] = useState<TipCalculationResult[]>([]);
  const { isNavigating, setIsNavigating } = useTipNavigation();

  // ページマウント時にisNavigatingをリセット
  useEffect(() => {
    setIsNavigating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // calculationIdがない場合、importページにリダイレクト
  useEffect(() => {
    // sessionStorageフラグをクリア（handleEditExistingなどで設定されたフラグをクリア）
    const SESSION_FLAG_KEY = "directNavigationFromEdit";
    sessionStorage.removeItem(SESSION_FLAG_KEY);

    if (!calculationId) {
      router.push("/tip/import");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.tips.getCalculationResults(calculationId);

        if (response.success && response.data) {
          setCalculation(response.data.calculation);
          setResults(response.data.results);

          // データ取得成功後、localStorageに保存
          const STORAGE_KEY = "lastTipSession";
          const lastSession = {
            storeId: response.data.calculation.stores_id,
            lastPage: "calculate" as const,
            calculationId: calculationId,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lastSession));
        } else {
          setError("Failed to load calculation results");
        }
      } catch (err) {
        console.error("Error fetching calculation results:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load calculation results"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [calculationId, router]);

  const handleBack = async () => {
    if (!calculationId) {
      setIsNavigating(true);
      router.push("/tip/import");
      return;
    }

    try {
      setIsNavigating(true);

      const response = await api.tips.revertCalculation(calculationId);

      if (response.success && response.storeId) {
        router.push(`/tip/edit?storeId=${response.storeId}`);
      } else {
        throw new Error("Failed to revert calculation");
      }
    } catch (error) {
      console.error("Failed to revert calculation:", error);
      setIsNavigating(false);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to revert calculation. Please try again."
      );
    }
  };

  const handleSave = async () => {
    if (!calculationId) {
      alert("Calculation ID is missing. Please refresh the page.");
      return;
    }

    try {
      setIsNavigating(true);

      await api.tips.deleteFormattedData(calculationId);

      // localStorageをクリア（フロー完了）
      const STORAGE_KEY = "lastTipSession";
      localStorage.removeItem(STORAGE_KEY);

      setIsNavigating(false);
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Failed to save tips:", error);
      setIsNavigating(false);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save tips. Please try again."
      );
    }
  };

  // 日付をフォーマット（YYYY-MM-DD → MM/DD/YYYY）
  // タイムゾーン変換を避けるため、文字列を直接パース
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "";
    // YYYY-MM-DD形式の文字列を直接分割
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString; // フォーマットが想定外の場合はそのまま返す
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
  };

  // 計算結果を従業員ごとにグループ化
  const groupedResults = results.reduce((acc, result) => {
    const name = result.name || "Unknown";
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(result);
    return acc;
  }, {} as Record<string, TipCalculationResult[]>);

  // 全体の合計を計算
  const grandTotalTips = results.reduce((sum, result) => {
    return sum + (result.tips || 0);
  }, 0);

  const grandTotalCashTips = results.reduce((sum, result) => {
    return sum + (result.cash_tips || 0);
  }, 0);

  const grandTotal = grandTotalTips + grandTotalCashTips;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-gray-600">No calculation data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Store と Period の表示 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">
                Store:
              </label>
              <p className="text-base text-gray-900">
                {calculation.store_name || "Unknown Store"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">
                Period:
              </label>
              <p className="text-base text-gray-900">
                {formatDate(calculation.period_start)} -{" "}
                {formatDate(calculation.period_end)}
              </p>
            </div>
          </div>
        </div>

        {/* 計算結果テーブル */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Tips Results
          </h3>
          {results.length === 0 ? (
            <p className="text-sm text-gray-600">
              No calculation results found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Tips
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Cash Tips
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedResults).map(
                    ([name, employeeResults]) => {
                      return (
                        <React.Fragment key={name}>
                          {employeeResults.map((result, index) => (
                            <tr
                              key={result.id}
                              className={index === 0 ? "bg-gray-50" : ""}
                            >
                              {index === 0 && (
                                <td
                                  className="px-4 py-3 text-sm font-medium text-gray-900"
                                  rowSpan={employeeResults.length}
                                >
                                  {name}
                                </td>
                              )}
                              <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                ${(result.tips || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                ${(result.cash_tips || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                $
                                {(
                                  (result.tips || 0) + (result.cash_tips || 0)
                                ).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    }
                  )}
                  <tr className="bg-green-50 border-t-2 border-gray-300">
                    <td
                      colSpan={1}
                      className="px-4 py-3 text-sm font-bold text-gray-900"
                    >
                      Grand Total:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      ${grandTotalTips.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      ${grandTotalCashTips.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      ${grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* BackボタンとSaveボタン */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={isNavigating}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isNavigating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-500 text-white hover:bg-gray-600"
            }`}
          >
            {isNavigating ? "Loading..." : "Back"}
          </button>
          <button
            onClick={handleSave}
            disabled={isNavigating}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isNavigating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isNavigating ? "Loading..." : "Save Tips"}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <CalculationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push("/tip/import");
        }}
      />
    </div>
  );
}
