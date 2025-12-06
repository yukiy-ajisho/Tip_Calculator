"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { FormattedWorkingHours } from "@/types";

interface WorkingHoursRecord {
  id: string;
  name: string;
  date: string | null;
  start: string | null;
  end: string | null;
  role: string | null;
  is_complete_on_import: boolean; // インポート時の状態（変更しない）
  is_complete: boolean; // 現在の完全性（編集時に更新）
  wasIncomplete?: boolean; // 元incompleteだったかどうか（オレンジ色表示用）
  originalIndex: number; // 元のデータのインデックスを保持
}

interface WorkingHoursEditTableProps {
  data?: FormattedWorkingHours[];
  isEditing?: boolean;
  onDataChange?: (data: FormattedWorkingHours[]) => void;
  onCancel?: () => void;
  onIncompleteCountChange?: (count: number) => void;
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
  onCancel,
  onIncompleteCountChange,
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
        id: record.id,
        name: record.name,
        date: record.date || null,
        start: record.start || null,
        end: record.end || null,
        role: record.role || null,
        is_complete_on_import: record.is_complete_on_import,
        is_complete:
          record.is_complete ??
          isRecordComplete({
            name: record.name,
            date: record.date,
            start: record.start,
            end: record.end,
            role: record.role,
          } as WorkingHoursRecord),
        wasIncomplete: false,
        originalIndex: index,
      };

      // is_completeでcomplete/incompleteを判定（is_complete_on_importではない）
      if (displayRecord.is_complete) {
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

  // 編集モードの切り替えを追跡
  const prevIsEditingRef = useRef(isEditing);

  // 元のデータを保持（Cancel用）
  const originalDataRef = useRef<FormattedWorkingHours[]>(data || []);

  // レコードが完全かどうかを判定する関数
  const isRecordComplete = (record: WorkingHoursRecord): boolean => {
    return !!(
      record.name &&
      record.date &&
      record.start &&
      record.end &&
      record.role
    );
  };

  // 編集モードの切り替え時のみローカル状態を更新
  useEffect(() => {
    if (isEditing && !prevIsEditingRef.current) {
      // 編集モードに入った時のみ、最新のdataでローカル状態を初期化
      setLocalCompleteRecords(completeRecords);
      setLocalIncompleteRecords(incompleteRecords);
      // 元のデータを保存（Cancel用）
      originalDataRef.current = data ? [...data] : [];
    } else if (!isEditing && prevIsEditingRef.current) {
      // 編集モードを抜けた時、最新のローカル状態を親コンポーネントに通知
      // 編集中の入力値をクリア
      setEditingInputValues({});

      // ローカル状態から最新のデータを構築して親に通知
      if (onDataChange) {
        const allRecords = [...localCompleteRecords, ...localIncompleteRecords];
        const formattedData: FormattedWorkingHours[] = allRecords.map(
          (record) => {
            // 元のデータからis_complete_on_importを取得（originalDataRefから）
            const originalRecord = originalDataRef.current.find(
              (d) => d.id === record.id
            );
            const isComplete = isRecordComplete(record);

            return {
              id: record.id,
              name: record.name,
              date: record.date,
              start: record.start,
              end: record.end,
              role: record.role,
              // is_complete_on_importは元の値をそのまま保持（インポート時の状態を変更しない）
              is_complete_on_import:
                originalRecord?.is_complete_on_import ?? false,
              // is_completeは現在の完全性に基づいて更新
              is_complete: isComplete,
              stores_id: originalRecord?.stores_id || "",
            };
          }
        );
        onDataChange(formattedData);
      }
    }
    prevIsEditingRef.current = isEditing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // セルの値を更新する関数
  const handleCellChange = (
    recordIndex: number,
    field: "date" | "start" | "end" | "role",
    value: string,
    isComplete: boolean
  ) => {
    if (!isEditing) return;

    // レコードIDを取得
    const records = isComplete ? localCompleteRecords : localIncompleteRecords;
    const record = records[recordIndex];
    if (!record) return;

    // 編集中の生の入力値を保存（record.idのみをキーとして使用）
    // これにより、レコードがcomplete/incomplete間で移動しても同じキーを使用できる
    const recordKey = record.id;
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
        return updated;
      });
    } else {
      setLocalIncompleteRecords((prev) => {
        const updated = updateRecord(prev, recordIndex);
        return updated;
      });
    }
  };

  // レコードを移動先に追加する関数（重複チェック付き）
  // 注意: 削除処理は呼び出し元で行う
  const addRecordToDestination = (
    record: WorkingHoursRecord,
    toComplete: boolean
  ) => {
    if (toComplete) {
      // incomplete → complete に追加
      setLocalCompleteRecords((prev) => {
        // 重複チェック: 既に存在する場合は追加しない
        if (prev.some((r) => r.id === record.id)) return prev;
        return [...prev, { ...record, wasIncomplete: true }];
      });
    } else {
      // complete → incomplete に追加
      setLocalIncompleteRecords((prev) => {
        // 重複チェック: 既に存在する場合は追加しない
        if (prev.some((r) => r.id === record.id)) return prev;
        return [...prev, { ...record, wasIncomplete: false }];
      });
    }
  };

  // フォーカスアウト時に完全性をチェックして移動
  const handleCellBlur = (
    recordIndex: number,
    isComplete: boolean,
    recordId: string
  ) => {
    if (!isEditing) return;

    // 次のイベントループで最新の状態を取得してチェック
    setTimeout(() => {
      // 最新のeditingInputValuesとレコード状態を取得
      setEditingInputValues((currentEditingValues) => {
        // record.idのみをキーとして使用（complete/incompleteに関係なく）
        const recordKey = recordId;
        const editingValues = currentEditingValues[recordKey];

        if (isComplete) {
          setLocalCompleteRecords((prev) => {
            const record = prev.find((r) => r.id === recordId);
            if (!record) return prev;

            // editingInputValuesから最新の値を取得して完全性をチェック
            const latestRecord: WorkingHoursRecord = {
              ...record,
              date:
                editingValues?.date !== undefined
                  ? parseDate(editingValues.date)
                  : record.date,
              start:
                editingValues?.start !== undefined
                  ? parseTime(editingValues.start)
                  : record.start,
              end:
                editingValues?.end !== undefined
                  ? parseTime(editingValues.end)
                  : record.end,
              role:
                editingValues?.role !== undefined
                  ? editingValues.role || null
                  : record.role,
            };

            // 完全性をチェック
            const nowComplete = isRecordComplete(latestRecord);
            // latestRecordにis_completeを追加
            latestRecord.is_complete = nowComplete;

            if (!nowComplete) {
              // complete → incomplete に移動
              addRecordToDestination(latestRecord, false);
              // レコードを削除
              const filtered = prev.filter((r) => r.id !== recordId);

              // 親コンポーネントに変更を通知
              if (onDataChange && data) {
                setTimeout(() => {
                  const updatedData = [...data];
                  const targetIndex = updatedData.findIndex(
                    (r) => r.id === recordId
                  );
                  if (targetIndex !== -1) {
                    // 元のデータからis_complete_on_importを取得（originalDataRefから）
                    // complete → incomplete に移動する場合、is_complete_on_importは元の値を保持
                    const originalRecordForIncomplete =
                      originalDataRef.current.find((r) => r.id === recordId);
                    updatedData[targetIndex] = {
                      ...updatedData[targetIndex],
                      date: latestRecord.date,
                      start: latestRecord.start,
                      end: latestRecord.end,
                      role: latestRecord.role,
                      // is_complete_on_importは元の値を保持（オレンジ色のハイライトを維持するため）
                      is_complete_on_import:
                        originalRecordForIncomplete?.is_complete_on_import ??
                        false,
                      // is_completeは現在の完全性に基づく
                      is_complete: false,
                    };
                    onDataChange(updatedData);
                  }
                }, 0);
              }

              return filtered;
            }
            return prev;
          });
        } else {
          setLocalIncompleteRecords((prev) => {
            const record = prev.find((r) => r.id === recordId);
            if (!record) return prev;

            // editingInputValuesから最新の値を取得して完全性をチェック
            const latestRecord: WorkingHoursRecord = {
              ...record,
              date:
                editingValues?.date !== undefined
                  ? parseDate(editingValues.date)
                  : record.date,
              start:
                editingValues?.start !== undefined
                  ? parseTime(editingValues.start)
                  : record.start,
              end:
                editingValues?.end !== undefined
                  ? parseTime(editingValues.end)
                  : record.end,
              role:
                editingValues?.role !== undefined
                  ? editingValues.role || null
                  : record.role,
            };

            // 完全性をチェック
            const nowComplete = isRecordComplete(latestRecord);
            // latestRecordにis_completeを追加
            latestRecord.is_complete = nowComplete;

            if (nowComplete) {
              // incomplete → complete に移動
              addRecordToDestination(latestRecord, true);
              // レコードを削除
              const filtered = prev.filter((r) => r.id !== recordId);

              // 親コンポーネントに変更を通知
              if (onDataChange && data) {
                setTimeout(() => {
                  const updatedData = [...data];
                  const targetIndex = updatedData.findIndex(
                    (r) => r.id === recordId
                  );
                  if (targetIndex !== -1) {
                    // 元のデータからis_complete_on_importを取得（originalDataRefから）
                    const originalRecord = originalDataRef.current.find(
                      (r) => r.id === recordId
                    );
                    updatedData[targetIndex] = {
                      ...updatedData[targetIndex],
                      date: latestRecord.date,
                      start: latestRecord.start,
                      end: latestRecord.end,
                      role: latestRecord.role,
                      // is_complete_on_importは元の値をそのまま保持（オレンジ色のハイライトを維持するため）
                      is_complete_on_import:
                        originalRecord?.is_complete_on_import ?? false,
                      // is_completeは現在の完全性に基づく
                      is_complete: true,
                    };
                    onDataChange(updatedData);
                  }
                }, 0);
              }

              return filtered;
            }
            return prev;
          });
        }

        return currentEditingValues;
      });
    }, 0);
  };

  // 編集中はローカル状態を使用、そうでなければuseMemoの結果を使用
  const displayCompleteRecords = isEditing
    ? localCompleteRecords
    : completeRecords;
  const displayIncompleteRecords = isEditing
    ? localIncompleteRecords
    : incompleteRecords;

  // incomplete recordsの数を親に通知
  useEffect(() => {
    if (onIncompleteCountChange) {
      onIncompleteCountChange(displayIncompleteRecords.length);
    }
  }, [displayIncompleteRecords.length, onIncompleteCountChange]);

  // Cancel処理：元のデータに復元
  const handleCancel = () => {
    if (onCancel && originalDataRef.current) {
      // 元のデータでローカル状態をリセット
      const complete: WorkingHoursRecord[] = [];
      const incomplete: WorkingHoursRecord[] = [];

      originalDataRef.current.forEach((record, index) => {
        const displayRecord: WorkingHoursRecord = {
          id: record.id,
          name: record.name,
          date: record.date || null,
          start: record.start || null,
          end: record.end || null,
          role: record.role || null,
          is_complete_on_import: record.is_complete_on_import,
          is_complete:
            record.is_complete ??
            isRecordComplete({
              name: record.name,
              date: record.date,
              start: record.start,
              end: record.end,
              role: record.role,
            } as WorkingHoursRecord),
          wasIncomplete: false,
          originalIndex: index,
        };

        // is_completeでcomplete/incompleteを判定
        if (displayRecord.is_complete) {
          complete.push(displayRecord);
        } else {
          incomplete.push(displayRecord);
        }
      });

      setLocalCompleteRecords(complete);
      setLocalIncompleteRecords(incomplete);
      setEditingInputValues({});
      onCancel();
    }
  };

  // テーブル行をレンダリングする関数
  const renderTableRow = (
    record: WorkingHoursRecord,
    index: number,
    isComplete: boolean
  ) => {
    // record.idのみをキーとして使用（complete/incompleteに関係なく）
    // これにより、レコードが移動しても同じキーを使用できる
    const recordKey = record.id;
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

    // オレンジ色の判定：is_complete_on_importがfalseのレコード（インポート時に不完全だったレコード）
    const shouldShowOrange = !record.is_complete_on_import;

    return (
      <tr
        key={`${isComplete ? "complete" : "incomplete"}-${record.id}-${index}`}
        className={`${shouldShowOrange ? "bg-orange-50" : "bg-white"}`}
      >
        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
          {record.name}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200">
          {isEditing && (!hasData("date") || shouldShowOrange) ? (
            <input
              type="text"
              placeholder="MM/DD/YY"
              value={getInputValue("date")}
              onChange={(e) =>
                handleCellChange(index, "date", e.target.value, isComplete)
              }
              onBlur={() => handleCellBlur(index, isComplete, record.id)}
              className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("date")
                  ? "text-gray-400 bg-gray-100 px-1.5 py-0.5 text-xs rounded block"
                  : ""
              }
            >
              {formatDate(record.date) || ""}
            </span>
          )}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200">
          {isEditing && (!hasData("start") || shouldShowOrange) ? (
            <input
              type="text"
              placeholder="--:--"
              value={getInputValue("start")}
              onChange={(e) =>
                handleCellChange(index, "start", e.target.value, isComplete)
              }
              onBlur={() => handleCellBlur(index, isComplete, record.id)}
              className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("start")
                  ? "text-gray-400 bg-gray-100 px-1.5 py-0.5 text-xs rounded block"
                  : ""
              }
            >
              {formatTime(record.start) || ""}
            </span>
          )}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200">
          {isEditing && (!hasData("end") || shouldShowOrange) ? (
            <input
              type="text"
              placeholder="--:--"
              value={getInputValue("end")}
              onChange={(e) =>
                handleCellChange(index, "end", e.target.value, isComplete)
              }
              onBlur={() => handleCellBlur(index, isComplete, record.id)}
              className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("end")
                  ? "text-gray-400 bg-gray-100 px-1.5 py-0.5 text-xs rounded block"
                  : ""
              }
            >
              {formatTime(record.end) || ""}
            </span>
          )}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-xs">
          {isEditing && (!hasData("role") || shouldShowOrange) ? (
            <input
              type="text"
              placeholder=""
              value={getInputValue("role")}
              onChange={(e) =>
                handleCellChange(index, "role", e.target.value, isComplete)
              }
              onBlur={() => handleCellBlur(index, isComplete, record.id)}
              className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span
              className={
                isDisabled("role")
                  ? "text-gray-400 bg-gray-100 px-1.5 py-0.5 text-xs rounded block"
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
        <h3 className="text-base font-semibold mb-3 text-gray-800">
          Complete Records
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Start
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  End
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCompleteRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-2 text-center text-xs text-gray-500"
                  >
                    No complete records
                  </td>
                </tr>
              ) : (
                displayCompleteRecords.map((record, index) =>
                  renderTableRow(record, index, true)
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 右側: 不完全なレコード */}
      <div className="min-w-0">
        <h3 className="text-base font-semibold mb-3 text-gray-800">
          Incomplete Records
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  Start
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  End
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayIncompleteRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-2 text-center text-xs text-gray-500"
                  >
                    No incomplete records
                  </td>
                </tr>
              ) : (
                displayIncompleteRecords.map((record, index) =>
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
