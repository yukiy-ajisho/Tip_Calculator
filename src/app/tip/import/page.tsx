"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CsvFileUpload } from "@/components/CsvFileUpload";
import { PreviewModal } from "@/components/PreviewModal";

interface FileState {
  file: File | null;
  data: any[] | null;
  isUploadedToSupabase: boolean;
}

export default function ImportPage() {
  const router = useRouter();

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

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileName: string;
    data: any[];
  }>({
    isOpen: false,
    fileName: "",
    data: [],
  });

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

  const handleNext = () => {
    // 将来的にはSupabaseに保存
    // await saveToSupabase(workingHoursFile, tipFile);

    // モック: 「Supabaseに保存した」という状態にする
    setWorkingHoursFile((prev) => ({
      ...prev,
      isUploadedToSupabase: true,
    }));
    setTipFile((prev) => ({
      ...prev,
      isUploadedToSupabase: true,
    }));

    router.push("/tip/edit");
  };

  // Nextボタンのアクティベート条件
  const isNextEnabled = workingHoursFile.file !== null && tipFile.file !== null;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Import CSV Files
        </h2>

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

        {/* Nextボタン */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleNext}
            disabled={!isNextEnabled}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isNextEnabled
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
