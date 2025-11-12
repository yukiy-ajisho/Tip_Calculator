"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkingHoursEditTable } from "@/components/WorkingHoursEditTable";

export default function EditPage() {
  const router = useRouter();

  // タブ切り替えの状態
  const [activeTab, setActiveTab] = useState<"workingHours" | "tip">(
    "workingHours"
  );

  // 編集データの状態（モック）
  const [workingHoursData, setWorkingHoursData] = useState<any[]>([]);
  const [tipData, setTipData] = useState<any[]>([]);

  // 将来的にSupabaseからデータ取得
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const data = await fetchFromSupabase();
  //     setWorkingHoursData(data.workingHours);
  //     setTipData(data.tip);
  //   };
  //   fetchData();
  // }, []);

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
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Data</h2>

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
        </div>

        {/* Working Hours CSV タブのコンテンツ */}
        {activeTab === "workingHours" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <WorkingHoursEditTable />
          </div>
        )}

        {/* Tip CSV タブのコンテンツ */}
        {activeTab === "tip" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <p className="text-gray-600">
              Tip CSV data will be displayed here for editing.
            </p>
            {tipData.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">
                No data available. Please import a file first.
              </p>
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
