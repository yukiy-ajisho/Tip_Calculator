"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CsvFileUpload } from "@/components/CsvFileUpload";
import { CsvTextPasteInput } from "@/components/CsvTextPasteInput";
import { PreviewModal } from "@/components/PreviewModal";
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

  // ストア一覧を取得
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoadingStores(true);
        setStoreError(null);
        const storesData = await api.stores.getStores();
        setStores(storesData);
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
    } catch (error) {
      console.error("Failed to delete existing data:", error);
      alert("Failed to delete existing data. Please try again.");
      return;
    }
  };

  const handleNext = async () => {
    if (
      !workingHoursFile.file ||
      !tipFile.file ||
      !cashTipData.data ||
      cashTipData.data.length === 0
    ) {
      console.error("Required files/data are not selected");
      return;
    }

    try {
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

      // Cash Tipデータを整形してSupabaseに保存
      await api.tips.formatCashTip(selectedStore, cashTipData.data);

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
      // TODO: エラーハンドリング（エラーメッセージを表示するなど）
    }
  };

  // Nextボタンのアクティベート条件
  // 3つすべて（working hours, tip, cash tip）が存在する場合にのみ有効化
  const isNextEnabled =
    selectedStore !== "" &&
    workingHoursFile.file !== null &&
    tipFile.file !== null &&
    cashTipData.data !== null &&
    cashTipData.data.length > 0 &&
    cashTipData.data.some(
      (row) =>
        row.Date &&
        row.Date.trim() !== "" &&
        row["Cash Tips"] &&
        row["Cash Tips"].trim() !== ""
    );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Import CSV Files
          </h2>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-700">
              Select Store:
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={isLoadingStores}
              className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {isLoadingStores
                  ? "Loading stores..."
                  : storeError
                  ? "Error loading stores"
                  : "-- Choose a store --"}
              </option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.abbreviation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing data message and buttons (shown right after store selection) */}
        {calculationStatus.status && selectedStore && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-4">
            <p className="text-sm text-yellow-800 flex-1">
              {calculationStatus.status === "completed"
                ? "Calculation results are available. You can preview the results or import new data."
                : "Existing data found. Someone may be editing this data."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleEditExisting}
                className="px-4 py-1.5 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                {calculationStatus.status === "completed"
                  ? "Preview Results"
                  : "Edit Existing Data"}
              </button>
              <button
                onClick={handleImportNew}
                className="px-4 py-1.5 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Import New Data
              </button>
            </div>
          </div>
        )}

        {/* Working Hours CSV */}
        <CsvFileUpload
          title="Working Hours CSV"
          onFileSelect={handleWorkingHoursFileSelect}
          onFileRemove={handleWorkingHoursFileRemove}
          onPreview={() => handlePreview("workingHours")}
          selectedFile={workingHoursFile.file}
          parsedData={workingHoursFile.data}
        />

        {/* Tip CSV */}
        <CsvFileUpload
          title="Tip CSV"
          onFileSelect={handleTipFileSelect}
          onFileRemove={handleTipFileRemove}
          onPreview={() => handlePreview("tip")}
          selectedFile={tipFile.file}
          parsedData={tipFile.data}
        />

        {/* Cash Tip */}
        <CsvTextPasteInput
          title="Cash Tip"
          onDataChange={handleCashTipDataChange}
          onRemove={handleCashTipDataRemove}
          parsedData={cashTipData.data}
        />

        {/* Nextボタン */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleNext}
            disabled={!isNextEnabled || !!calculationStatus.status}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isNextEnabled && !calculationStatus.status
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Next
          </button>
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
