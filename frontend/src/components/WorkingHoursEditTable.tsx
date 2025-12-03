"use client";

import { useState, useMemo, useEffect } from "react";
import { FormattedWorkingHours } from "@/types";

interface WorkingHoursRecord {
  name: string;
  date: string | null;
  start: string | null;
  end: string | null;
  role: string | null;
  is_complete_on_import: boolean;
  originalIndex: number; // 元のデータのインデックスを保持
}

interface WorkingHoursEditTableProps {
  data?: FormattedWorkingHours[];
  isEditing?: boolean;
  onDataChange?: (data: FormattedWorkingHours[]) => void;
}

/**
 * Convert date string (YYYY-MM-DD) to MM/DD/YY format
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Convert date string (MM/DD/YY) to YYYY-MM-DD format
 */
function parseDate(dateString: string): string | null {
  if (!dateString || dateString.trim() === "") return null;
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;
  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10) + 2000; // Assume 20XX
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Convert time string (HH:MM:SS) to HH:MM format
 */
function formatTime(timeString: string | null): string {
  if (!timeString) return "";
  // Remove seconds if present
  return timeString.slice(0, 5);
}

/**
 * Convert time string (HH:MM) to HH:MM:SS format
 */
function parseTime(timeString: string): string | null {
  if (!timeString || timeString.trim() === "" || timeString === "--:--")
    return null;
  // If already in HH:MM format, add :00
  if (timeString.length === 5 && timeString.includes(":")) {
    return `${timeString}:00`;
  }
  return timeString;
}

export function WorkingHoursEditTable({
  data,
  isEditing = false,
  onDataChange,
}: WorkingHoursEditTableProps) {
  // データを変換して、完全/不完全に分ける
  const { completeRecords, incompleteRecords } = useMemo(() => {
    if (!data || data.length === 0) {
      return { completeRecords: [], incompleteRecords: [] };
    }

    const complete: WorkingHoursRecord[] = [];
    const incomplete: WorkingHoursRecord[] = [];

    data.forEach((record, index) => {
      const displayRecord: WorkingHoursRecord = {
        name: record.name,
        date: record.date || null,
        start: record.start || null,
        end: record.end || null,
        role: record.role || null,
        is_complete_on_import: record.is_complete_on_import,
        originalIndex: index,
      };

      if (record.is_complete_on_import) {
        complete.push(displayRecord);
      } else {
        incomplete.push(displayRecord);
      }
    });

    return { completeRecords: complete, incompleteRecords: incomplete };
  }, [data]);

  // 編集用のローカル状態
  const [localCompleteRecords, setLocalCompleteRecords] =
    useState(completeRecords);
  const [localIncompleteRecords, setLocalIncompleteRecords] =
    useState(incompleteRecords);

  // 編集中の生の入力値を保持（パース前の値）
  const [editingInputValues, setEditingInputValues] = useState<
    Record<
      string,
      { date?: string; start?: string; end?: string; role?: string }
    >
  >({});

  // データが変更されたらローカル状態を更新
  useEffect(() => {
    setLocalCompleteRecords(completeRecords);
    setLocalIncompleteRecords(incompleteRecords);
    // 編集モードがオフになったら、編集中の入力値もクリア
    if (!isEditing) {
      setEditingInputValues({});
    }
  }, [completeRecords, incompleteRecords, isEditing]);

  // セルの値を更新する関数
  const handleCellChange = (
    recordIndex: number,
    field: "date" | "start" | "end" | "role",
    value: string,
    isComplete: boolean
  ) => {
    if (!isEditing) return;

    // 編集中の生の入力値を保存
    const recordKey = `${
      isComplete ? "complete" : "incomplete"
    }-${recordIndex}`;
    setEditingInputValues((prev) => ({
      ...prev,
      [recordKey]: {
        ...prev[recordKey],
        [field]: value,
      },
    }));

    const updateRecord = (records: WorkingHoursRecord[], index: number) => {
      const newRecords = [...records];
      const record = { ...newRecords[index] };

      if (field === "date") {
        record.date = parseDate(value);
      } else if (field === "start") {
        record.start = parseTime(value);
      } else if (field === "end") {
        record.end = parseTime(value);
      } else if (field === "role") {
        record.role = value || null;
      }

      newRecords[index] = record;
      return newRecords;
    };

    if (isComplete) {
      setLocalCompleteRecords((prev) => {
        const updated = updateRecord(prev, recordIndex);
        const targetRecord = updated[recordIndex];
        const originalIndex = targetRecord.originalIndex;

        // 親コンポーネントに変更を通知（次のイベントループで実行して、レンダリング中にsetStateを呼ばないようにする）
        if (onDataChange && data) {
          setTimeout(() => {
            const updatedData = [...data];
            updatedData[originalIndex] = {
              ...updatedData[originalIndex],
              date: targetRecord.date || "",
              start: targetRecord.start || "",
              end: targetRecord.end || "",
              role: targetRecord.role || "",
            };

            onDataChange(updatedData);
          }, 0);
        }
        return updated;
      });
    } else {
      setLocalIncompleteRecords((prev) => {
        const updated = updateRecord(prev, recordIndex);
        const targetRecord = updated[recordIndex];
        const originalIndex = targetRecord.originalIndex;

        // 親コンポーネントに変更を通知（次のイベントループで実行して、レンダリング中にsetStateを呼ばないようにする）
        if (onDataChange && data) {
          setTimeout(() => {
            const updatedData = [...data];
            updatedData[originalIndex] = {
              ...updatedData[originalIndex],
              date: targetRecord.date || "",
              start: targetRecord.start || "",
              end: targetRecord.end || "",
              role: targetRecord.role || "",
            };

            onDataChange(updatedData);
          }, 0);
        }
        return updated;
      });
    }
  };

  // テーブル行をレンダリングする関数
  const renderTableRow = (
    record: WorkingHoursRecord,
    index: number,
    isComplete: boolean
  ) => {
    const recordKey = `${isComplete ? "complete" : "incomplete"}-${index}`;
    const editingValues = editingInputValues[recordKey];

    const hasData = (field: "date" | "start" | "end" | "role") => {
      if (field === "date") return !!record.date;
      if (field === "start") return !!record.start;
      if (field === "end") return !!record.end;
      if (field === "role") return !!record.role;
      return false;
    };

    const isDisabled = (field: "date" | "start" | "end" | "role") => {
      return isEditing && hasData(field);
    };

    // 編集中の生の入力値があればそれを使い、なければフォーマット済みの値を使う
    const getInputValue = (field: "date" | "start" | "end" | "role") => {
      if (editingValues && editingValues[field] !== undefined) {
        return editingValues[field] || "";
      }
      if (field === "date") return formatDate(record.date);
      if (field === "start") return formatTime(record.start) || "";
      if (field === "end") return formatTime(record.end) || "";
      if (field === "role") return record.role || "";
      return "";
    };

    return (
      <tr
        key={`${isComplete ? "complete" : "incomplete"}-${index}`}
        className={`${!isComplete ? "bg-orange-50" : "bg-white"}`}
      >
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
          {record.name}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
          {isEditing && !hasData("date") ? (
            <input
              type="text"
              placeholder="MM/DD/YY"
              value={getInputValue("date")}
              onChange={(e) =>
                handleCellChange(index, "date", e.target.value, isComplete)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("date")
                  ? "text-gray-400 bg-gray-100 px-2 py-1 rounded block"
                  : ""
              }
            >
              {formatDate(record.date) || ""}
            </span>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
          {isEditing && !hasData("start") ? (
            <input
              type="text"
              placeholder="--:--"
              value={getInputValue("start")}
              onChange={(e) =>
                handleCellChange(index, "start", e.target.value, isComplete)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("start")
                  ? "text-gray-400 bg-gray-100 px-2 py-1 rounded block"
                  : ""
              }
            >
              {formatTime(record.start) || ""}
            </span>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-gray-200">
          {isEditing && !hasData("end") ? (
            <input
              type="text"
              placeholder="--:--"
              value={getInputValue("end")}
              onChange={(e) =>
                handleCellChange(index, "end", e.target.value, isComplete)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("end")
                  ? "text-gray-400 bg-gray-100 px-2 py-1 rounded block"
                  : ""
              }
            >
              {formatTime(record.end) || ""}
            </span>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm">
          {isEditing && !hasData("role") ? (
            <input
              type="text"
              placeholder=""
              value={getInputValue("role")}
              onChange={(e) =>
                handleCellChange(index, "role", e.target.value, isComplete)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("role")
                  ? "text-gray-400 bg-gray-100 px-2 py-1 rounded block"
                  : ""
              }
            >
              {record.role || ""}
            </span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 左側: 完全なレコード */}
      <div className="min-w-0">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Complete Records
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Start
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  End
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localCompleteRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-center text-sm text-gray-500"
                  >
                    No complete records
                  </td>
                </tr>
              ) : (
                localCompleteRecords.map((record, index) =>
                  renderTableRow(record, index, true)
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 右側: 不完全なレコード */}
      <div className="min-w-0">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          Incomplete Records
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Start
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  End
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localIncompleteRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-center text-sm text-gray-500"
                  >
                    No incomplete records
                  </td>
                </tr>
              ) : (
                localIncompleteRecords.map((record, index) =>
                  renderTableRow(record, index, false)
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
