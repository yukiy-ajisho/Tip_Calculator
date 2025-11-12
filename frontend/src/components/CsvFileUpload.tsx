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
            error: (error: Papa.ParseError) => {
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
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-100"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <p className="text-gray-600">Drag and drop CSV file here or</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse
            </button>
          </div>
          {isProcessing && (
            <p className="mt-4 text-sm text-gray-500">Processing...</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm font-medium text-gray-700">
              {selectedFile.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPreview}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Preview
            </button>
            <button
              onClick={onFileRemove}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
