"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import { X } from "lucide-react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";

registerAllModules();

interface CsvRow {
  [key: string]: string | number | undefined;
}

interface CsvTextPasteInputProps {
  title: string;
  onDataChange: (data: CsvRow[]) => void;
  onRemove: () => void;
  parsedData: CsvRow[] | null;
}

export function CsvTextPasteInput({
  title,
  onDataChange,
  onRemove,
  parsedData,
}: CsvTextPasteInputProps) {
  const [data, setData] = useState<CsvRow[]>(parsedData || []);
  const [headers, setHeaders] = useState<string[]>([]);

  const handleParseCSV = useCallback(
    (text: string) => {
      Papa.parse<CsvRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<CsvRow>) => {
          if (results.data && results.data.length > 0) {
            const parsedHeaders = Object.keys(results.data[0]);
            setHeaders(parsedHeaders);
            setData(results.data);
            onDataChange(results.data);
          }
        },
        error: (error: Error) => {
          console.error("CSV parse error:", error);
        },
      });
    },
    [onDataChange]
  );

  const handleClipboardPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData?.getData("text/plain");
    if (text) {
      e.preventDefault();
      handleParseCSV(text);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTableChange = (changes: any[] | null): void => {
    if (!changes) return;

    // Handsontable の changes から data を更新
    const newData = [...data];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    changes.forEach((change: any) => {
      const [row, col, , newValue] = change;
      if (newData[row]) {
        const columnName = typeof col === "number" ? headers[col] : col;
        newData[row][columnName] = newValue;
      }
    });

    setData(newData);
    onDataChange(newData);
  };

  const handleRemove = () => {
    setData([]);
    setHeaders([]);
    onRemove();
  };

  // Handsontable用の columns 定義
  const columns = headers.map((header) => ({
    data: header,
    title: header,
    width: 150,
  }));

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

      {data.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onPaste={handleClipboardPaste}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("bg-blue-50");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("bg-blue-50");
          }}
        >
          <p className="text-gray-600 font-medium">Paste CSV data here</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {data.length} rows of data
            </span>
            <button
              onClick={handleRemove}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Remove data"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Handsontable でテーブル表示・編集 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <HotTable
              data={data}
              columns={columns}
              rowHeaders={true}
              colHeaders={true}
              width="100%"
              height="auto"
              stretchH="all"
              licenseKey="non-commercial-and-evaluation"
              afterChange={handleTableChange}
              contextMenu={true}
              dropdownMenu={true}
              style={{ minHeight: "300px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
