"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { X } from "lucide-react";

interface CsvFileUploadProps {
  title: string;
  onFileSelect: (file: File, data: any[]) => void;
  onFileRemove: () => void;
  onPreview: () => void;
  selectedFile: File | null;
  parsedData: any[] | null;
}

export function CsvFileUpload({
  title,
  onFileSelect,
  onFileRemove,
  onPreview,
  selectedFile,
  parsedData,
}: CsvFileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          Papa.parse<any>(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              onFileSelect(file, results.data);
              setIsProcessing(false);
            },
            error: (error: any) => {
              console.error("CSV parse error:", error);
              setIsProcessing(false);
            },
          });
        };
        reader.readAsText(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
    maxFiles: 1,
  });

  const handleBrowseClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-100"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Drag and drop CSV file here or
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse
            </button>
          </div>
          {isProcessing && (
            <p className="mt-3 text-xs text-gray-500">Processing...</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm">✓</span>
            <span className="text-xs font-medium text-gray-700">
              {selectedFile.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPreview}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Preview
            </button>
            <button
              onClick={onFileRemove}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
