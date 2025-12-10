"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FormattedTipData } from "@/types";
import { TimeInput as SharedTimeInput } from "./TimeInput";
import { useUserSettings } from "@/hooks/useUserSettings";
import { convert24To12 } from "@/lib/time-format";

interface TipRecord {
  id?: string;
  order_date: string; // MM/DD/YY形式で表示
  original_payment_time: string; // HH:MM形式で表示（nullの場合は空文字）
  payment_time: string; // HH:MM形式で表示（nullの場合は空文字、編集可能）
  tips: string; // 数値として表示
}

interface TipEditTableProps {
  data?: FormattedTipData[];
  isEditing?: boolean;
  onDataChange?: (data: FormattedTipData[]) => void;
}

/**
 * Convert date string (YYYY-MM-DD) to MM/DD/YY format
 */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${month}/${day}/${year.slice(-2)}`;
}

/**
 * Convert time string (HH:MM:SS) to HH:MM format
 */
function formatTime(timeString: string | null): string {
  if (!timeString) return "";
  // Remove seconds if present
  return timeString.slice(0, 5);
}

function formatDisplayTime(
  timeString: string | null,
  timeFormat: "24h" | "12h"
): string {
  if (!timeString) return "-";
  const hhmm = formatTime(timeString);
  if (timeFormat === "12h") {
    return convert24To12(hhmm);
  }
  return hhmm;
}

/**
 * Convert HH:MM to HH:MM:SS format
 */
function normalizeTime(timeString: string): string {
  if (!timeString || timeString.trim() === "") return "";
  const parts = timeString.split(":");
  if (parts.length === 2) {
    return `${timeString}:00`;
  }
  return timeString;
}

export function TipEditTable({
  data,
  isEditing = false,
  onDataChange,
}: TipEditTableProps) {
  const { timeFormat } = useUserSettings();
  const [editingInputValues, setEditingInputValues] = useState<
    Map<string, string>
  >(new Map());
  const prevIsEditingRef = useRef(false);
  const originalDataRef = useRef<FormattedTipData[]>([]);

  // Filter to show only adjusted tips (is_adjusted = true)
  const adjustedData = data
    ? data.filter((record) => record.is_adjusted === true)
    : [];

  // Convert to display format
  const displayData: TipRecord[] = adjustedData.map((record) => ({
    id: record.id,
    order_date: formatDate(record.order_date),
    original_payment_time: formatTime(record.original_payment_time || null),
    payment_time: formatTime(record.payment_time),
    tips: record.tips,
  }));

  // Initialize editing state when entering edit mode
  useEffect(() => {
    if (isEditing && !prevIsEditingRef.current) {
      // Entering edit mode: initialize state
      originalDataRef.current = data ? [...data] : [];
      setEditingInputValues(new Map());
    } else if (!isEditing && prevIsEditingRef.current) {
      // Exiting edit mode: clear editing state
      // Note: We don't call onDataChange here because:
      // - On Save: parent component (handleSaveTips) will read tipData directly
      // - On Cancel: parent component (handleCancelTips) will restore originalTipData
      // Calling onDataChange here would interfere with Cancel operation
      setEditingInputValues(new Map());
    }
    prevIsEditingRef.current = isEditing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleTimeChange = useCallback(
    (recordId: string, value: string) => {
      // Update editingInputValues for local state
      setEditingInputValues((prev) => {
        const newMap = new Map(prev);
        newMap.set(recordId, value);
        return newMap;
      });

      // Update tipData immediately so Save can read the latest value
      if (onDataChange && data) {
        const updatedData = [...data];
        const recordIndex = updatedData.findIndex((r) => r.id === recordId);
        if (recordIndex !== -1) {
          const normalizedTime =
            value.trim() === "" ? null : normalizeTime(value.trim());
          updatedData[recordIndex] = {
            ...updatedData[recordIndex],
            payment_time: normalizedTime,
          };
          onDataChange(updatedData);
        }
      }
    },
    [data, onDataChange]
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Order Date
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Original Payment Time
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
              Payment Time
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tips
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-3 py-2 text-center text-xs text-gray-500"
              >
                No adjusted tips to display.
              </td>
            </tr>
          ) : (
            displayData.map((record) => {
              const recordId = record.id || "";
              const inputValue =
                editingInputValues.get(recordId) !== undefined
                  ? editingInputValues.get(recordId) || ""
                  : record.payment_time;

              return (
                <tr key={recordId}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                    {record.order_date}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                    {formatDisplayTime(
                      record.original_payment_time || null,
                      timeFormat
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                    {isEditing ? (
                      <SharedTimeInput
                        key={`${recordId}-${isEditing}`}
                        value={inputValue}
                        onChange={(value) => handleTimeChange(recordId, value)}
                        timeFormat={timeFormat}
                      />
                    ) : (
                      formatDisplayTime(record.payment_time || null, timeFormat)
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {record.tips}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
