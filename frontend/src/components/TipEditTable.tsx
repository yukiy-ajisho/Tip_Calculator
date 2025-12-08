"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FormattedTipData } from "@/types";
import { X } from "lucide-react";

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

type SegmentType = "hour" | "minute" | "space";

interface Segment {
  type: SegmentType;
  symbols: string;
  index: number;
  value: string;
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

/**
 * Parse HH:MM string into segments
 */
function parseTimeString(timeString: string | null): Segment[] {
  const segments: Segment[] = [];
  let index = 0;

  // Hour segment (HH)
  segments.push({
    type: "hour",
    symbols: "HH",
    index: index,
    value: timeString ? timeString.slice(0, 2) : "",
  });
  index += 2;

  // Space segment (:)
  segments.push({
    type: "space",
    symbols: ":",
    index: index,
    value: ":",
  });
  index += 1;

  // Minute segment (MM)
  segments.push({
    type: "minute",
    symbols: "MM",
    index: index,
    value: timeString ? timeString.slice(3, 5) : "",
  });

  return segments;
}

/**
 * Build time string from segments
 */
function buildTimeString(segments: Segment[]): string {
  const hour = segments.find((s) => s.type === "hour")?.value || "";
  const minute = segments.find((s) => s.type === "minute")?.value || "";

  if (!hour && !minute) return "";

  // Pad with zeros if needed
  const hourPadded = hour.padStart(2, "0");
  const minutePadded = minute.padStart(2, "0");

  // Validate hour (0-23)
  const hourNum = parseInt(hourPadded, 10);
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) return "";

  // Validate minute (0-59)
  const minuteNum = parseInt(minutePadded, 10);
  if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) return "";

  return `${hourPadded}:${minutePadded}`;
}

/**
 * Set selection range on input element
 */
function setSelection(
  inputRef: React.RefObject<HTMLInputElement | null>,
  segment?: Segment
) {
  if (!inputRef.current || !segment) return;

  requestAnimationFrame(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      inputRef.current.setSelectionRange(
        segment.index,
        segment.index + segment.symbols.length,
        "none"
      );
    }
  });
}

/**
 * Time input component with segment-based editing
 */
function TimeInput({
  value,
  onChange,
  onBlur,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [segments, setSegments] = useState<Segment[]>(() =>
    parseTimeString(value)
  );
  const [selectedSegmentAt, setSelectedSegmentAt] = useState<
    number | undefined
  >(undefined);
  const [isFocused, setIsFocused] = useState(false);

  // Update segments when value prop changes (from outside)
  useEffect(() => {
    if (!isFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSegments(parseTimeString(value));
    }
  }, [value, isFocused]);

  const curSegment = useMemo(() => {
    if (
      selectedSegmentAt === undefined ||
      selectedSegmentAt < 0 ||
      selectedSegmentAt >= segments.length
    )
      return undefined;
    return segments[selectedSegmentAt];
  }, [segments, selectedSegmentAt]);

  const validSegments = useMemo(
    () => segments.filter((s) => s.type !== "space"),
    [segments]
  );

  const inputStr = useMemo(() => {
    return segments
      .map((s) =>
        s.value ? s.value.padStart(s.symbols.length, "0") : s.symbols
      )
      .join("");
  }, [segments]);

  // Build time string from segments and call onChange
  // Only call onChange when segments change due to user input, not when value prop changes
  useEffect(() => {
    const timeString = buildTimeString(segments);
    // Only call onChange if the timeString is different from value AND it's a valid time
    // This prevents calling onChange when value prop changes from outside (e.g., on cancel)
    if (timeString !== value && timeString !== "") {
      onChange(timeString);
    }
  }, [segments, value, onChange]);

  const setCurrentSegment = useCallback(
    (segment: Segment | undefined) => {
      const at = segments?.findIndex((s) => s.index === segment?.index);
      if (at !== -1) {
        setSelectedSegmentAt(at);
      }
    },
    [segments]
  );

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const selectionStart = inputRef.current?.selectionStart;
      if (
        inputRef.current &&
        selectionStart !== undefined &&
        selectionStart !== null
      ) {
        const validSegments = segments.filter((s) => s.type !== "space");
        let segment = validSegments.find(
          (s) =>
            s.index <= selectionStart &&
            s.index + s.symbols.length >= selectionStart
        );
        !segment &&
          (segment = [...validSegments]
            .reverse()
            .find((s) => s.index <= selectionStart));
        !segment &&
          (segment = validSegments.find((s) => s.index >= selectionStart));
        setCurrentSegment(segment);
        setSelection(inputRef, segment);
      }
    },
    [segments, setCurrentSegment]
  );

  const onSegmentChange = useCallback(
    (direction: "left" | "right") => {
      if (!curSegment) return;
      const validSegments = segments.filter((s) => s.type !== "space");
      const segment =
        direction === "left"
          ? [...validSegments].reverse().find((s) => s.index < curSegment.index)
          : validSegments.find((s) => s.index > curSegment.index);
      if (segment) {
        setCurrentSegment(segment);
        setSelection(inputRef, segment);
      }
    },
    [segments, curSegment, setCurrentSegment]
  );

  const onSegmentNumberValueChange = useCallback(
    (num: string) => {
      if (!curSegment || curSegment.type === "space") return;

      const length = curSegment.symbols.length;
      const rawValue = curSegment.value
        ? parseInt(curSegment.value).toString()
        : "";
      let newValue = rawValue.length < length ? rawValue + num : num;

      // Validate and adjust based on segment type
      const numValue = parseInt(newValue, 10);
      if (curSegment.type === "hour") {
        // Hour: 0-23
        if (numValue > 2 && newValue.length === 1) {
          // First digit > 2, can't be valid hour
          newValue = num;
        } else if (numValue > 23) {
          newValue = num;
        }
      } else if (curSegment.type === "minute") {
        // Minute: 0-59
        if (numValue > 5 && newValue.length === 1) {
          // First digit > 5, can't be valid minute
          newValue = num;
        } else if (numValue > 59) {
          newValue = num;
        }
      }

      const updatedSegments = segments.map((s) =>
        s.index === curSegment.index ? { ...curSegment, value: newValue } : s
      );
      setSegments(updatedSegments);

      const updatedSegment = updatedSegments.find(
        (s) => s.index === curSegment.index
      )!;

      // Auto-advance to next segment if filled
      const shouldNext = newValue.length === length;
      if (shouldNext) {
        onSegmentChange("right");
      } else {
        setSelection(inputRef, updatedSegment);
      }
    },
    [segments, curSegment, onSegmentChange]
  );

  const onSegmentValueRemove = useCallback(() => {
    if (!curSegment) return;
    if (curSegment.value && curSegment.type !== "space") {
      const updatedSegments = segments.map((s) =>
        s.index === curSegment.index ? { ...curSegment, value: "" } : s
      );
      setSegments(updatedSegments);
      const segment = updatedSegments.find(
        (s) => s.index === curSegment.index
      )!;
      setSelection(inputRef, segment);
    } else {
      onSegmentChange("left");
    }
  }, [segments, curSegment, onSegmentChange]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const key = event.key;
      setSelection(inputRef, curSegment);

      switch (key) {
        case "ArrowRight":
        case "ArrowLeft":
          onSegmentChange(key === "ArrowRight" ? "right" : "left");
          event.preventDefault();
          break;
        case "Backspace":
          onSegmentValueRemove();
          event.preventDefault();
          break;
        case "Delete":
          onSegmentValueRemove();
          event.preventDefault();
          break;
        default:
          if (key.match(/\d/)) {
            onSegmentNumberValueChange(key);
            event.preventDefault();
          }
          break;
      }
    },
    [
      curSegment,
      onSegmentChange,
      onSegmentValueRemove,
      onSegmentNumberValueChange,
    ]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const clearedSegments = segments.map((s) =>
        s.type !== "space" ? { ...s, value: "" } : s
      );
      setSegments(clearedSegments);
      onChange("");
      // Focus first segment
      const firstSegment = clearedSegments.find((s) => s.type === "hour");
      if (firstSegment) {
        setCurrentSegment(firstSegment);
        setSelection(inputRef, firstSegment);
      }
    },
    [segments, onChange, setCurrentSegment]
  );

  const hasValue = useMemo(() => {
    return validSegments.some((s) => s.value);
  }, [validSegments]);

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={inputRef}
        className="font-mono w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        onFocus={() => {
          setIsFocused(true);
          if (!curSegment) {
            const firstSegment = segments.find((s) => s.type === "hour");
            if (firstSegment) {
              setCurrentSegment(firstSegment);
              setSelection(inputRef, firstSegment);
            }
          }
        }}
        onBlur={() => {
          setIsFocused(false);
          setSelectedSegmentAt(undefined);
          onBlur?.();
        }}
        onClick={onClick}
        onKeyDown={onKeyDown}
        value={inputStr}
        placeholder="HH:MM"
        onChange={() => {}}
        disabled={disabled}
        spellCheck={false}
      />
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded opacity-50 hover:opacity-100 transition-opacity"
          tabIndex={-1}
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
      )}
    </div>
  );
}

export function TipEditTable({
  data,
  isEditing = false,
  onDataChange,
}: TipEditTableProps) {
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
                    {record.original_payment_time || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 border-r border-gray-200">
                    {isEditing ? (
                      <TimeInput
                        key={`${recordId}-${isEditing}`}
                        value={inputValue}
                        onChange={(value) => handleTimeChange(recordId, value)}
                      />
                    ) : (
                      record.payment_time || "-"
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
