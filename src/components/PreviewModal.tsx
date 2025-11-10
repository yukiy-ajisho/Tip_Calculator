"use client";

import { X } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  data: any[];
}

export function PreviewModal({
  isOpen,
  onClose,
  fileName,
  data,
}: PreviewModalProps) {
  if (!isOpen) return null;

  // データが空の場合
  if (!data || data.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Preview: {fileName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-gray-500">No data to display</p>
          </div>
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // テーブルのヘッダーを取得（最初の行のキー）
  const headers = Object.keys(data[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Preview: {fileName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* テーブルコンテンツ */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="border border-gray-300 px-4 py-2 text-gray-700"
                    >
                      {row[header] || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
