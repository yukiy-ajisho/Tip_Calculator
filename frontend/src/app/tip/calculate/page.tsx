"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CalculationSuccessModal from "@/components/CalculationSuccessModal";
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
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // calculationIdがない場合、importページにリダイレクト
  useEffect(() => {
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
      router.push("/tip/import");
      return;
    }

    try {
      setIsReverting(true);

      const response = await api.tips.revertCalculation(calculationId);

      if (response.success && response.storeId) {
        router.push(`/tip/edit?storeId=${response.storeId}`);
      } else {
        throw new Error("Failed to revert calculation");
      }
    } catch (error) {
      console.error("Failed to revert calculation:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to revert calculation. Please try again."
      );
    } finally {
      setIsReverting(false);
    }
  };

  const handleSave = async () => {
    if (!calculation || !calculation.stores_id) {
      alert("Calculation data is missing. Please refresh the page.");
      return;
    }

    try {
      setIsSaving(true);

      await api.tips.deleteFormattedData(calculation.stores_id);

      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Failed to save tips:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save tips. Please try again."
      );
    } finally {
      setIsSaving(false);
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
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Calculate</h2>

        {/* Store と Period の表示 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Store
              </label>
              <p className="text-sm text-gray-900">
                {calculation.store_name || "Unknown Store"}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Period
              </label>
              <p className="text-sm text-gray-900">
                {formatDate(calculation.period_start)} -{" "}
                {formatDate(calculation.period_end)}
              </p>
            </div>
          </div>
        </div>

        {/* 計算結果テーブル */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Calculation Results
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
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
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {formatDate(result.date)}
                              </td>
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
                      colSpan={2}
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
            disabled={isReverting}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isReverting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-500 text-white hover:bg-gray-600"
            }`}
          >
            {isReverting ? "Reverting..." : "Back"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isSaving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isSaving ? "Saving..." : "Save Tips"}
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
