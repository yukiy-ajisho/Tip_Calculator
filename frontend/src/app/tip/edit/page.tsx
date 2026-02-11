"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkingHoursEditTable } from "@/components/WorkingHoursEditTable";
import { TipEditTable } from "@/components/TipEditTable";
import { CashTipEditTable } from "@/components/CashTipEditTable";
import {
  EmployeeTipStatusTable,
  EmployeeTipStatusTableRef,
} from "@/components/EmployeeTipStatusTable";
import { useTipNavigation } from "@/contexts/TipNavigationContext";
import { api } from "@/lib/api";
import {
  FormattedWorkingHours,
  FormattedTipData,
  FormattedCashTip,
  RoleMapping,
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
  const [calculationId, setCalculationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Working Hours CSV の編集モード状態
  const [isEditingWorkingHours, setIsEditingWorkingHours] = useState(false);
  const [incompleteRecordsCount, setIncompleteRecordsCount] = useState(0);
  const [originalWorkingHoursData, setOriginalWorkingHoursData] = useState<
    FormattedWorkingHours[]
  >([]);
  const [deletedRecordIds, setDeletedRecordIds] = useState<string[]>([]);
  const { isNavigating, setIsNavigating } = useTipNavigation();

  // Tip Data の編集モード状態
  const [isEditingTips, setIsEditingTips] = useState(false);
  const [originalTipData, setOriginalTipData] = useState<FormattedTipData[]>(
    []
  );

  // Employee Tip Status の編集モード状態
  const [isEditingEmployeeTipStatus, setIsEditingEmployeeTipStatus] =
    useState(false);
  const employeeTipStatusTableRef = useRef<EmployeeTipStatusTableRef>(null);

  // Role mappings
  const [roleMappings, setRoleMappings] = useState<RoleMapping[]>([]);

  // ページマウント時にisNavigatingをリセット
  useEffect(() => {
    setIsNavigating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        // calculationIdを取得
        const statusResult = await api.tips.getCalculationStatus(storeId);
        if (statusResult.success && statusResult.calculationId) {
          setCalculationId(statusResult.calculationId);
        }

        // 指定された店舗IDでデータを取得
        const [workingHoursResult, tipResult, cashTipResult, roleMappingsData] =
          await Promise.all([
            api.tips.getFormattedWorkingHours(storeId),
            api.tips.getFormattedTipData(storeId),
            api.tips.getFormattedCashTip(storeId),
            api.roleMappings.getRoleMappings(storeId),
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
        setRoleMappings(roleMappingsData);

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
    // タブに応じて前のタブに戻る、またはimportページに戻る
    if (activeTab === "cashTip") {
      // Cash Tipsタブ → Outside Range Tipsタブに戻る
      setIsNavigating(true);
      setActiveTab("tip");
      // タブ切り替えのラグを考慮して少し遅延
      setTimeout(() => setIsNavigating(false), 100);
    } else if (activeTab === "tip") {
      // Outside Range Tipsタブ → Incomplete Recordsタブに戻る
      setIsNavigating(true);
      setActiveTab("workingHours");
      // タブ切り替えのラグを考慮して少し遅延
      setTimeout(() => setIsNavigating(false), 100);
    } else if (activeTab === "workingHours") {
      // Incomplete Recordsタブ → importページに戻る（データは削除しない）
      setIsNavigating(true);
      // 直接ナビゲーションのフラグを設定（自動リダイレクトを防ぐため）
      const SESSION_FLAG_KEY = "directNavigationFromEdit";
      sessionStorage.setItem(SESSION_FLAG_KEY, "true");

      // importページに戻る
      router.push("/tip/import");
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

  // Employee Tip Status handlers
  const handleSaveEmployeeTipStatus = async () => {
    try {
      await employeeTipStatusTableRef.current?.save();
      setIsEditingEmployeeTipStatus(false);
    } catch (error) {
      console.error("Failed to save employee tip status:", error);
      // エラーは既にhandleSave内で表示されている
    }
  };

  const handleCancelEmployeeTipStatus = () => {
    employeeTipStatusTableRef.current?.cancel();
    setIsEditingEmployeeTipStatus(false);
  };

  const handleNext = async () => {
    // タブに応じて次のタブに移動、または計算を実行
    if (activeTab === "workingHours") {
      // Incomplete Recordsタブ → Outside Range Tipsタブに移動
      setIsNavigating(true);
      setActiveTab("tip");
      // タブ切り替えのラグを考慮して少し遅延
      setTimeout(() => setIsNavigating(false), 100);
    } else if (activeTab === "tip") {
      // Outside Range Tipsタブ → Cash Tipsタブに移動
      setIsNavigating(true);
      setActiveTab("cashTip");
      // タブ切り替えのラグを考慮して少し遅延
      setTimeout(() => setIsNavigating(false), 100);
    } else if (activeTab === "cashTip") {
      // Cash Tipsタブ → 計算を実行してcalculateページに遷移
      // 確認ダイアログを表示
      const confirmed = window.confirm("Have you completed all your edits?");

      if (!confirmed) {
        // ユーザーが「いいえ」を選択した場合、計算を実行しない
        return;
      }

      // storeIdが存在しない場合のエラーハンドリング
      if (!storeId) {
        alert("Store ID is missing. Please go back to import page.");
        setIsNavigating(true);
        router.push("/tip/import");
        return;
      }

      try {
        // ローディング状態を設定
        setIsNavigating(true);

        // APIを呼び出して計算を実行
        const response = await api.tips.calculate(storeId);

        // 成功時の処理
        if (response.success) {
          // 計算結果ページにリダイレクト
          router.push(`/tip/calculate?calculationId=${response.calculationId}`);
        } else {
          setIsNavigating(false);
          alert("Failed to calculate tips. Please try again.");
        }
      } catch (error) {
        console.error("Failed to calculate tips:", error);
        setIsNavigating(false);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to calculate tips. Please try again."
        );
      }
    }
  };

  return (
    <div className="p-8">
      <div className="w-full relative">
        {/* 固定ヘッダーエリア */}
        <div className="sticky top-0 z-10 bg-gray-50 -mx-8 px-8 py-4 mb-6">
          {/* タブボタン */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4 w-fit">
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
              Outside Range Tips
            </button>
            <button
              onClick={() => setActiveTab("cashTip")}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                activeTab === "cashTip"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cash Tips
            </button>
          </div>

          {/* Back/Nextボタン */}
          <div className="flex justify-between">
            <div className="relative group">
              <button
                onClick={handleBack}
                disabled={
                  isNavigating ||
                  isEditingWorkingHours ||
                  isEditingTips ||
                  isEditingEmployeeTipStatus
                }
                className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                  isNavigating ||
                  isEditingWorkingHours ||
                  isEditingTips ||
                  isEditingEmployeeTipStatus
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                {isNavigating ? "Loading..." : "Back"}
              </button>
              {(isEditingWorkingHours ||
                isEditingTips ||
                isEditingEmployeeTipStatus) && (
                <div className="absolute bottom-full left-full ml-2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-10">
                  Please save or cancel your edits before proceeding.
                  <div className="absolute top-full left-0 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
            <div className="relative group">
              <button
                onClick={handleNext}
                disabled={
                  isNavigating ||
                  isEditingWorkingHours ||
                  isEditingTips ||
                  isEditingEmployeeTipStatus
                }
                className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                  isNavigating ||
                  isEditingWorkingHours ||
                  isEditingTips ||
                  isEditingEmployeeTipStatus
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isNavigating
                  ? "Loading..."
                  : activeTab === "cashTip"
                  ? "Calculate"
                  : "Next"}
              </button>
              {(isEditingWorkingHours ||
                isEditingTips ||
                isEditingEmployeeTipStatus) && (
                <div className="absolute bottom-full right-full mr-2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-10">
                  Please save or cancel your edits before proceeding.
                  <div className="absolute top-full right-0 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div>
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
                roleMappings={roleMappings}
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
            {/* Edit/Save/Cancelボタン */}
            <div className="flex justify-end gap-2 mb-4">
              {isEditingEmployeeTipStatus ? (
                <>
                  <button
                    onClick={handleCancelEmployeeTipStatus}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEmployeeTipStatus}
                    className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-green-500 text-white hover:bg-green-600"
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingEmployeeTipStatus(true)}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="text-sm text-gray-600">Loading cash tip data...</p>
            ) : error ? (
              <p className="text-sm text-red-600">Error: {error}</p>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Cash Tip Table */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Cash Tips
                  </h3>
                  {cashTipData.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No cash tip data available. Please import a file first.
                    </p>
                  ) : (
                    <CashTipEditTable data={cashTipData} />
                  )}
                </div>

                {/* Right: Employee Tip Status Table */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Employee Tip Status
                  </h3>
                  <EmployeeTipStatusTable
                    ref={employeeTipStatusTableRef}
                    calculationId={calculationId}
                    isEditing={isEditingEmployeeTipStatus}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
