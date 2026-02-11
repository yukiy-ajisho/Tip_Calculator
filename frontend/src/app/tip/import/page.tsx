"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CsvFileUpload } from "@/components/CsvFileUpload";
import { CsvTextPasteInput } from "@/components/CsvTextPasteInput";
import { PreviewModal } from "@/components/PreviewModal";
import { StoreSelectDropdown } from "@/components/StoreSelectDropdown";
import { useTipNavigation } from "@/contexts/TipNavigationContext";
import { api } from "@/lib/api";
import { Store } from "@/types";

interface FileState {
  file: File | null;
  data: any[] | null;
  isUploadedToSupabase: boolean;
}

export default function ImportPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [calculationStatus, setCalculationStatus] = useState<{
    status: "processing" | "completed" | null;
    calculationId: string | null;
  }>({ status: null, calculationId: null });
  const [isCheckingData, setIsCheckingData] = useState<boolean>(false);
  const { isNavigating, setIsNavigating } = useTipNavigation();
  // 各店舗の既存データ状態を管理
  const [storeDataStatus, setStoreDataStatus] = useState<
    Record<string, boolean>
  >({});

  const [workingHoursFile, setWorkingHoursFile] = useState<FileState>({
    file: null,
    data: null,
    isUploadedToSupabase: false,
  });

  const [tipFile, setTipFile] = useState<FileState>({
    file: null,
    data: null,
    isUploadedToSupabase: false,
  });

  const [cashTipData, setCashTipData] = useState<FileState>({
    file: null,
    data: null,
    isUploadedToSupabase: false,
  });

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileName: string;
    data: any[];
  }>({
    isOpen: false,
    fileName: "",
    data: [],
  });

  const STORAGE_KEY = "lastTipSession";
  const SESSION_FLAG_KEY = "directNavigationFromEdit";

  interface LastTipSession {
    storeId: string;
    lastPage: "edit" | "calculate";
    calculationId?: string;
  }

  // ページマウント時にisNavigatingをリセット
  useEffect(() => {
    setIsNavigating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ページ読み込み時にsessionStorageとlocalStorageをチェック
  useEffect(() => {
    const checkStorageAndRedirect = async () => {
      try {
        // 1. sessionStorageフラグをチェック
        const directNavigationFlag = sessionStorage.getItem(SESSION_FLAG_KEY);
        if (directNavigationFlag === "true") {
          // 直接ナビゲーションの場合、localStorageをクリアしてフラグを削除
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(SESSION_FLAG_KEY);
          return;
        }

        // 2. localStorageから前回のセッション情報を取得
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          return;
        }

        const lastSession: LastTipSession = JSON.parse(stored);

        // 3. lastPage === "calculate"の場合、/tip/calculateにリダイレクト
        if (lastSession.lastPage === "calculate" && lastSession.calculationId) {
          router.push(
            `/tip/calculate?calculationId=${lastSession.calculationId}`
          );
          return;
        }

        // 4. lastPage === "edit"の場合、statusをチェック
        if (lastSession.lastPage === "edit" && lastSession.storeId) {
          try {
            const response = await api.tips.getCalculationStatus(
              lastSession.storeId
            );

            if (response.success) {
              if (response.status === "processing" && response.calculationId) {
                // status === "processing"の場合、/tip/editにリダイレクト
                router.push(`/tip/edit?storeId=${lastSession.storeId}`);
                return;
              } else if (
                response.status === "completed" &&
                response.calculationId
              ) {
                // status === "completed"の場合、/tip/calculateにリダイレクト
                router.push(
                  `/tip/calculate?calculationId=${response.calculationId}`
                );
                return;
              }
            }
          } catch (error) {
            console.error("Failed to check calculation status:", error);
            // エラーが発生した場合、リダイレクトしない
          }
        }
      } catch (error) {
        console.error("Error checking storage:", error);
      }
    };

    checkStorageAndRedirect();
  }, [router]);

  // ストア一覧を取得
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoadingStores(true);
        setStoreError(null);
        const storesData = await api.stores.getStores();
        setStores(storesData);

        // 全店舗の計算ステータスを一括取得
        try {
          const statusesResponse = await api.stores.getCalculationStatuses();
          const statusMap: Record<string, boolean> = {};
          storesData.forEach((store) => {
            const status = statusesResponse[store.id];
            statusMap[store.id] = status?.success && !!status?.status;
          });
          setStoreDataStatus(statusMap);
        } catch (error) {
          console.error("Failed to fetch calculation statuses:", error);
          // エラーが発生した場合は全てfalseに設定
          const statusMap: Record<string, boolean> = {};
          storesData.forEach((store) => {
            statusMap[store.id] = false;
          });
          setStoreDataStatus(statusMap);
        }
      } catch (error) {
        console.error("Failed to fetch stores:", error);
        setStoreError(
          error instanceof Error ? error.message : "Failed to load stores"
        );
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  // 店舗選択時にデータが存在するかチェック
  useEffect(() => {
    const checkExistingData = async () => {
      if (!selectedStore) {
        setCalculationStatus({ status: null, calculationId: null });
        return;
      }

      try {
        setIsCheckingData(true);
        const response = await api.tips.getCalculationStatus(selectedStore);

        if (response.success) {
          setCalculationStatus({
            status: response.status,
            calculationId: response.calculationId,
          });
        } else {
          setCalculationStatus({ status: null, calculationId: null });
        }
      } catch (error) {
        console.error("Failed to check existing data:", error);
        setCalculationStatus({ status: null, calculationId: null });
      } finally {
        setIsCheckingData(false);
      }
    };

    checkExistingData();
  }, [selectedStore]);

  const handleWorkingHoursFileSelect = (file: File, data: any[]) => {
    setWorkingHoursFile({
      file,
      data,
      isUploadedToSupabase: false,
    });
  };

  const handleTipFileSelect = (file: File, data: any[]) => {
    setTipFile({
      file,
      data,
      isUploadedToSupabase: false,
    });
  };

  const handleWorkingHoursFileRemove = () => {
    if (workingHoursFile.isUploadedToSupabase) {
      // 将来的にはSupabaseからも削除
      // await deleteFromSupabase('workingHours');
    }
    setWorkingHoursFile({
      file: null,
      data: null,
      isUploadedToSupabase: false,
    });
  };

  const handleTipFileRemove = () => {
    if (tipFile.isUploadedToSupabase) {
      // 将来的にはSupabaseからも削除
      // await deleteFromSupabase('tip');
    }
    setTipFile({
      file: null,
      data: null,
      isUploadedToSupabase: false,
    });
  };

  const handleCashTipDataChange = (data: any[]) => {
    setCashTipData({
      file: null,
      data,
      isUploadedToSupabase: false,
    });
  };

  const handleCashTipDataRemove = () => {
    if (cashTipData.isUploadedToSupabase) {
      // 将来的にはSupabaseからも削除
      // await deleteFromSupabase('cashTip');
    }
    setCashTipData({
      file: null,
      data: null,
      isUploadedToSupabase: false,
    });
  };

  const handlePreview = (fileType: "workingHours" | "tip") => {
    const fileState = fileType === "workingHours" ? workingHoursFile : tipFile;
    if (fileState.file && fileState.data) {
      setPreviewModal({
        isOpen: true,
        fileName: fileState.file.name,
        data: fileState.data,
      });
    }
  };

  const handleEditExisting = () => {
    // 直接ナビゲーションのフラグを設定
    sessionStorage.setItem(SESSION_FLAG_KEY, "true");

    // statusに応じてリダイレクト先を変更
    if (
      calculationStatus.status === "completed" &&
      calculationStatus.calculationId
    ) {
      // completedの場合、calculateページにリダイレクト
      router.push(
        `/tip/calculate?calculationId=${calculationStatus.calculationId}`
      );
    } else if (calculationStatus.status === "processing") {
      // processingの場合、editページにリダイレクト
      router.push(`/tip/edit?storeId=${selectedStore}`);
    }
  };

  const handleImportNew = async () => {
    // 確認ダイアログを表示
    const confirmed = window.confirm(
      "Existing data found. Someone may be editing this data. Do you want to overwrite with new data?"
    );

    if (!confirmed) {
      return;
    }

    try {
      if (calculationStatus.status === "completed") {
        // 計算済み（Save Tips 未実行）のデータを削除
        await api.tips.deleteCompletedCalculation(selectedStore);
      } else {
        // processing 中の下書きデータを削除
        await api.tips.deleteCalculation(selectedStore);
      }
      setCalculationStatus({ status: null, calculationId: null });
      // localStorageをクリア
      localStorage.removeItem(STORAGE_KEY);
      // storeDataStatusを更新してUIを即座に反映
      setStoreDataStatus((prev) => ({
        ...prev,
        [selectedStore]: false,
      }));
    } catch (error) {
      console.error("Failed to delete existing data:", error);
      alert("Failed to delete existing data. Please try again.");
      return;
    }
  };

  const handleNext = async () => {
    if (!workingHoursFile.file || !tipFile.file) {
      console.error("Required files/data are not selected");
      return;
    }

    try {
      setIsNavigating(true);

      // Working Hours CSVを整形してSupabaseに保存
      const workingHoursCsvText = await workingHoursFile.file.text();
      const workingHoursCsvLines = workingHoursCsvText
        .split("\n")
        .filter((line) => line.trim() !== "");
      await api.tips.formatWorkingHours(selectedStore, workingHoursCsvLines);

      // Tip CSVを整形してSupabaseに保存
      const tipCsvText = await tipFile.file.text();
      const tipCsvLines = tipCsvText
        .split("\n")
        .filter((line) => line.trim() !== "");
      await api.tips.formatTipData(selectedStore, tipCsvLines);

      // Cash Tipデータを整形してSupabaseに保存（存在する場合のみ）
      if (
        cashTipData.data &&
        cashTipData.data.length > 0 &&
        cashTipData.data.some(
          (row) =>
            row.Date &&
            row.Date.trim() !== "" &&
            row["Cash Tips"] &&
            row["Cash Tips"].trim() !== ""
        )
      ) {
        await api.tips.formatCashTip(selectedStore, cashTipData.data);
      }

      // モック: 「Supabaseに保存した」という状態にする
      setWorkingHoursFile((prev) => ({
        ...prev,
        isUploadedToSupabase: true,
      }));
      setTipFile((prev) => ({
        ...prev,
        isUploadedToSupabase: true,
      }));
      setCashTipData((prev) => ({
        ...prev,
        isUploadedToSupabase: true,
      }));

      // 成功したら /tip/edit に遷移（店舗IDをURLパラメータで渡す）
      router.push(`/tip/edit?storeId=${selectedStore}`);
    } catch (error) {
      console.error("Error formatting CSV data:", error);
      setIsNavigating(false);
      // TODO: エラーハンドリング（エラーメッセージを表示するなど）
    }
  };

  // Nextボタンのアクティベート条件
  // working hours と tip が存在する場合に有効化（cash tipはオプショナル）
  const isNextEnabled =
    selectedStore !== "" &&
    workingHoursFile.file !== null &&
    tipFile.file !== null;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Import CSV Files
          </h2>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-700">
              Select Store:
            </label>
            <StoreSelectDropdown
              stores={stores}
              selectedStore={selectedStore}
              onStoreSelect={setSelectedStore}
              storeDataStatus={storeDataStatus}
              isLoading={isLoadingStores}
              error={storeError}
            />
          </div>
        </div>

        {/* Existing data message and buttons (shown right after store selection) */}
        {calculationStatus.status && selectedStore && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-4">
            <p className="text-sm text-yellow-800 flex-1">
              {calculationStatus.status === "completed"
                ? "Calculation results from a prior session are available but not saved. View the results now or clear the old data to import a new data set."
                : "Existing data found. Someone may be editing this data."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleEditExisting}
                className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                {calculationStatus.status === "completed"
                  ? "Proceed to Results"
                  : "Edit Existing Data"}
              </button>
              <button
                onClick={handleImportNew}
                className="px-4 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Clear Old Data
              </button>
            </div>
          </div>
        )}

        {/* Working Hours CSV */}
        <div
          className={
            calculationStatus.status
              ? "opacity-50 pointer-events-none relative"
              : ""
          }
        >
          <CsvFileUpload
            title="Working Hours CSV"
            onFileSelect={handleWorkingHoursFileSelect}
            onFileRemove={handleWorkingHoursFileRemove}
            onPreview={() => handlePreview("workingHours")}
            selectedFile={workingHoursFile.file}
            parsedData={workingHoursFile.data}
          />
        </div>

        {/* Tip CSV */}
        <div
          className={
            calculationStatus.status
              ? "opacity-50 pointer-events-none relative"
              : ""
          }
        >
          <CsvFileUpload
            title="Tip CSV"
            onFileSelect={handleTipFileSelect}
            onFileRemove={handleTipFileRemove}
            onPreview={() => handlePreview("tip")}
            selectedFile={tipFile.file}
            parsedData={tipFile.data}
          />
        </div>

        {/* Cash Tip */}
        <div
          className={
            calculationStatus.status
              ? "opacity-50 pointer-events-none relative"
              : ""
          }
        >
          <CsvTextPasteInput
            title="Cash Tip"
            onDataChange={handleCashTipDataChange}
            onRemove={handleCashTipDataRemove}
            parsedData={cashTipData.data}
          />
        </div>

        {/* Nextボタン */}
        <div className="flex justify-end mt-8">
          <div className="relative group">
            <button
              onClick={handleNext}
              disabled={!isNextEnabled || !!calculationStatus.status || isNavigating}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                isNextEnabled && !calculationStatus.status && !isNavigating
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isNavigating ? "Loading..." : "Next"}
            </button>
            {selectedStore === "" && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-10">
                Please select a store
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Previewモーダル */}
      <PreviewModal
        isOpen={previewModal.isOpen}
        onClose={() =>
          setPreviewModal({ isOpen: false, fileName: "", data: [] })
        }
        fileName={previewModal.fileName}
        data={previewModal.data}
      />
    </div>
  );
}
