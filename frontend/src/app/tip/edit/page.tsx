"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

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
  const [incompleteRecordsCount, setIncompleteRecordsCount] = useState(0);
  const [originalWorkingHoursData, setOriginalWorkingHoursData] = useState<
    FormattedWorkingHours[]
  >([]);
  const [deletedRecordIds, setDeletedRecordIds] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Tip Data の編集モード状態
  const [isEditingTips, setIsEditingTips] = useState(false);
  const [originalTipData, setOriginalTipData] = useState<FormattedTipData[]>(
    []
  );

  // ページ読み込み時にSupabaseからデータ取得
  useEffect(() => {
    // sessionStorageフラグをクリア（handleEditExistingなどで設定されたフラグをクリア）
    const SESSION_FLAG_KEY = "directNavigationFromEdit";
    sessionStorage.removeItem(SESSION_FLAG_KEY);

    const fetchData = async () => {
      // URLパラメータにstoreIdがない場合、importページにリダイレクト
      if (!storeId) {
        router.push("/tip/import");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 指定された店舗IDでデータを取得
        const [workingHoursResult, tipResult, cashTipResult] =
          await Promise.all([
            api.tips.getFormattedWorkingHours(storeId),
            api.tips.getFormattedTipData(storeId),
            api.tips.getFormattedCashTip(storeId),
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
        setOriginalWorkingHoursData(
          JSON.parse(JSON.stringify(workingHoursResult.data))
        );
        setTipData(tipResult.data);
        setOriginalTipData(JSON.parse(JSON.stringify(tipResult.data)));
        setCashTipData(cashTipResult.data);

        // 初期のincomplete records数を計算（is_completeで判定）
        const initialIncompleteCount = workingHoursResult.data.filter(
          (record) => !record.is_complete
        ).length;
        setIncompleteRecordsCount(initialIncompleteCount);

        // データ取得成功後、localStorageに保存
        const STORAGE_KEY = "lastTipSession";
        const lastSession = {
          storeId: storeId,
          lastPage: "edit" as const,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lastSession));
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
  }, [router, storeId]);

  const handleBack = async () => {
    // URLパラメータから店舗IDを取得
    if (!storeId) {
      router.push("/tip/import");
      return;
    }

    try {
      // 直接ナビゲーションのフラグを設定
      const SESSION_FLAG_KEY = "directNavigationFromEdit";
      sessionStorage.setItem(SESSION_FLAG_KEY, "true");

      // 既存データを削除（確認ダイアログなし）
      await api.tips.deleteCalculation(storeId);
      // 削除後、importページに戻る
      router.push("/tip/import");
    } catch (error) {
      console.error("Failed to delete calculation data:", error);
      alert("データの削除に失敗しました。もう一度お試しください。");
    }
  };

  const handleSaveWorkingHours = async () => {
    try {
      // 1. 全レコードの完全性をチェックしてis_completeを更新
      const updatedData = workingHoursData.map((record) => {
        const isComplete = !!(
          record.name &&
          record.date &&
          record.start &&
          record.end &&
          record.role
        );
        return {
          ...record,
          is_complete: isComplete,
        };
      });

      // 2. workingHoursDataを更新（完全性に基づいて再分類される）
      setWorkingHoursData(updatedData);

      // 3. 変更されたレコードのみを抽出
      const changedRecords = updatedData.filter((record) => {
        const original = originalWorkingHoursData.find(
          (r) => r.id === record.id
        );
        if (!original) return true; // 新規レコード

        // いずれかのフィールドが変更されているかチェック
        return (
          record.name !== original.name ||
          record.date !== original.date ||
          record.start !== original.start ||
          record.end !== original.end ||
          record.role !== original.role ||
          record.is_complete !== original.is_complete ||
          record.is_complete_on_import !== original.is_complete_on_import
        );
      });

      // 4. 変更されたレコードのみを送信
      if (changedRecords.length > 0) {
        await api.tips.updateFormattedWorkingHours(changedRecords);
      }

      // 5. 削除されたレコードをバックエンドから削除
      if (deletedRecordIds.length > 0) {
        await Promise.all(
          deletedRecordIds.map((id) => api.tips.deleteFormattedWorkingHours(id))
        );
      }

      // 6. 保存後、元のデータを更新
      setOriginalWorkingHoursData(JSON.parse(JSON.stringify(updatedData)));
      setDeletedRecordIds([]);
      setIsEditingWorkingHours(false);
    } catch (error) {
      console.error("Failed to save working hours:", error);
      alert("Failed to save working hours. Please try again.");
    }
  };

  const handleCancelWorkingHours = () => {
    // 元のデータに復元
    setWorkingHoursData(JSON.parse(JSON.stringify(originalWorkingHoursData)));
    setDeletedRecordIds([]);
    setIsEditingWorkingHours(false);
    // incomplete records数を再計算（is_completeで判定）
    const incompleteCount = originalWorkingHoursData.filter(
      (record) => !record.is_complete
    ).length;
    setIncompleteRecordsCount(incompleteCount);
  };

  const handleDeleteWorkingHoursRecord = (id: string) => {
    // 削除後のデータを計算
    const updatedData = workingHoursData.filter((record) => record.id !== id);

    // ローカル状態から削除
    setWorkingHoursData(updatedData);

    // 削除されたレコードIDを追跡（元々存在していたレコードのみ）
    const originalRecord = originalWorkingHoursData.find((r) => r.id === id);
    if (originalRecord) {
      setDeletedRecordIds((prev) => [...prev, id]);
    }

    // incomplete records数を再計算
    const incompleteCount = updatedData.filter(
      (record) => !record.is_complete
    ).length;
    setIncompleteRecordsCount(incompleteCount);
  };

  // Tip Data handlers
  const handleTipDataChange = (updatedData: FormattedTipData[]) => {
    setTipData(updatedData);
  };

  const handleSaveTips = async () => {
    try {
      // 変更されたレコードのみを抽出
      const changedRecords = tipData.filter((record) => {
        if (!record.id) return false; // IDがないレコードはスキップ
        const original = originalTipData.find((r) => r.id === record.id);
        if (!original) return false; // 新規レコードはスキップ（通常は発生しない）

        // payment_timeが変更されているかチェック
        return record.payment_time !== original.payment_time;
      });

      // 変更されたレコードのみを送信
      if (changedRecords.length > 0) {
        await Promise.all(
          changedRecords.map((record) => {
            if (!record.id) return Promise.resolve();
            return api.tips.updateFormattedTipData(
              record.id,
              record.payment_time
            );
          })
        );
      }

      // 元データを更新
      setOriginalTipData(JSON.parse(JSON.stringify(tipData)));
      setIsEditingTips(false);
    } catch (error) {
      console.error("Failed to save tips:", error);
      alert("Failed to save tips. Please try again.");
    }
  };

  const handleCancelTips = () => {
    setTipData(JSON.parse(JSON.stringify(originalTipData)));
    setIsEditingTips(false);
  };

  const handleNext = async () => {
    // storeIdが存在しない場合のエラーハンドリング
    if (!storeId) {
      alert("Store ID is missing. Please go back to import page.");
      router.push("/tip/import");
      return;
    }

    try {
      // ローディング状態を設定
      setIsCalculating(true);

      // APIを呼び出して計算を実行
      const response = await api.tips.calculate(storeId);

      // 成功時の処理
      if (response.success) {
        // 計算結果ページにリダイレクト
        router.push(`/tip/calculate?calculationId=${response.calculationId}`);
      }
    } catch (error) {
      console.error("Failed to calculate tips:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to calculate tips. Please try again."
      );
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* タブボタン */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab("workingHours")}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeTab === "workingHours"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Incomplete Records
          </button>
          <button
            onClick={() => setActiveTab("tip")}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
              activeTab === "tip"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Outside Range Tip
          </button>
          <button
            onClick={() => setActiveTab("cashTip")}
            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
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
            {/* Edit/Save/Cancelボタン */}
            <div className="flex justify-end gap-2 mb-4">
              {isEditingWorkingHours ? (
                <>
                  <button
                    onClick={handleCancelWorkingHours}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveWorkingHours}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-green-500 text-white hover:bg-green-600"
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingWorkingHours(true)}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-600">
                Loading working hours data...
              </p>
            ) : error ? (
              <p className="text-sm text-red-600">Error: {error}</p>
            ) : workingHoursData.length === 0 ? (
              <p className="text-sm text-gray-500">
                No working hours data available. Please import a file first.
              </p>
            ) : (
              <WorkingHoursEditTable
                data={workingHoursData}
                isEditing={isEditingWorkingHours}
                onDataChange={setWorkingHoursData}
                onCancel={handleCancelWorkingHours}
                onIncompleteCountChange={setIncompleteRecordsCount}
                onDeleteRecord={handleDeleteWorkingHoursRecord}
              />
            )}
          </div>
        )}

        {/* Tip CSV タブのコンテンツ */}
        {activeTab === "tip" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {/* Edit/Save/Cancelボタン */}
            <div className="flex justify-end gap-2 mb-4">
              {isEditingTips ? (
                <>
                  <button
                    onClick={handleCancelTips}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTips}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-green-500 text-white hover:bg-green-600"
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingTips(true)}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-600">Loading tip data...</p>
            ) : error ? (
              <p className="text-sm text-red-600">Error: {error}</p>
            ) : tipData.length === 0 ? (
              <p className="text-sm text-gray-500">
                No tip data available. Please import a file first.
              </p>
            ) : (
              <TipEditTable
                data={tipData}
                isEditing={isEditingTips}
                onDataChange={handleTipDataChange}
              />
            )}
          </div>
        )}

        {/* Cash Tip タブのコンテンツ */}
        {activeTab === "cashTip" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {isLoading ? (
              <p className="text-sm text-gray-600">Loading cash tip data...</p>
            ) : error ? (
              <p className="text-sm text-red-600">Error: {error}</p>
            ) : cashTipData.length === 0 ? (
              <p className="text-sm text-gray-500">
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
            className="px-4 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={isCalculating}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isCalculating
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isCalculating ? "Calculating..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
