"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { FormattedWorkingHours } from "@/types";
import { X } from "lucide-react";

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

type SegmentType = "hour" | "minute" | "space";

interface Segment {
  type: SegmentType;
  symbols: string;
  index: number;
  value: string;
}

type DateSegmentType = "month" | "day" | "year" | "space";

interface DateSegment {
  type: DateSegmentType;
  symbols: string;
  index: number;
  value: string;
}

/**
 * Convert date string (YYYY-MM-DD) to MM/DD/YY format
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  // 文字列を直接分割してタイムゾーンの影響を避ける
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${month}/${day}/${year.slice(-2)}`;
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
 * Parse MM/DD/YY string into segments
 */
function parseDateString(dateString: string | null): DateSegment[] {
  const segments: DateSegment[] = [];
  let index = 0;

  // Month segment (MM)
  segments.push({
    type: "month",
    symbols: "MM",
    index: index,
    value: dateString ? dateString.slice(0, 2) : "",
  });
  index += 2;

  // Space segment (/)
  segments.push({
    type: "space",
    symbols: "/",
    index: index,
    value: "/",
  });
  index += 1;

  // Day segment (DD)
  segments.push({
    type: "day",
    symbols: "DD",
    index: index,
    value: dateString ? dateString.slice(3, 5) : "",
  });
  index += 2;

  // Space segment (/)
  segments.push({
    type: "space",
    symbols: "/",
    index: index,
    value: "/",
  });
  index += 1;

  // Year segment (YY)
  segments.push({
    type: "year",
    symbols: "YY",
    index: index,
    value: dateString ? dateString.slice(6, 8) : "",
  });

  return segments;
}

/**
 * Build date string from segments
 */
function buildDateString(segments: DateSegment[]): string {
  const month = segments.find((s) => s.type === "month")?.value || "";
  const day = segments.find((s) => s.type === "day")?.value || "";
  const year = segments.find((s) => s.type === "year")?.value || "";

  if (!month && !day && !year) return "";

  // Pad with zeros if needed
  const monthPadded = month.padStart(2, "0");
  const dayPadded = day.padStart(2, "0");
  const yearPadded = year.padStart(2, "0");

  // Validate month (1-12)
  const monthNum = parseInt(monthPadded, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return "";

  // Validate day (1-31)
  const dayNum = parseInt(dayPadded, 10);
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return "";

  // Validate year (00-99)
  const yearNum = parseInt(yearPadded, 10);
  if (isNaN(yearNum) || yearNum < 0 || yearNum > 99) return "";

  return `${monthPadded}/${dayPadded}/${yearPadded}`;
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
    if (document.activeElement === inputRef.current && inputRef.current) {
      inputRef.current.setSelectionRange(
        segment.index,
        segment.index + segment.symbols.length,
        "none"
      );
    }
  });
}

/**
 * Set selection range on input element for date segments
 */
function setDateSelection(
  inputRef: React.RefObject<HTMLInputElement | null>,
  segment?: DateSegment
) {
  if (!inputRef.current || !segment) return;

  requestAnimationFrame(() => {
    if (document.activeElement === inputRef.current && inputRef.current) {
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
  // Note: This pattern matches TipEditTable implementation
  // Note: setState in useEffect is intentional to sync segments with value prop
  useEffect(() => {
    if (!isFocused) {
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
        if (!segment) {
          segment = [...validSegments]
            .reverse()
            .find((s) => s.index <= selectionStart);
        }
        if (!segment) {
          segment = validSegments.find((s) => s.index >= selectionStart);
        }
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

/**
 * Date input component with segment-based editing
 */
function DateInput({
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
  const [segments, setSegments] = useState<DateSegment[]>(() =>
    parseDateString(value)
  );
  const [selectedSegmentAt, setSelectedSegmentAt] = useState<
    number | undefined
  >(undefined);
  const [isFocused, setIsFocused] = useState(false);

  // Update segments when value prop changes (from outside)
  // Note: setState in useEffect is intentional to sync segments with value prop
  useEffect(() => {
    if (!isFocused) {
      setSegments(parseDateString(value));
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

  // Build date string from segments and call onChange
  // Only call onChange when segments change due to user input, not when value prop changes
  useEffect(() => {
    const dateString = buildDateString(segments);
    // Only call onChange if the dateString is different from value AND it's a valid date
    // This prevents calling onChange when value prop changes from outside (e.g., on cancel)
    if (dateString !== value && dateString !== "") {
      onChange(dateString);
    }
  }, [segments, value, onChange]);

  const setCurrentSegment = useCallback(
    (segment: DateSegment | undefined) => {
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
        if (!segment) {
          segment = [...validSegments]
            .reverse()
            .find((s) => s.index <= selectionStart);
        }
        if (!segment) {
          segment = validSegments.find((s) => s.index >= selectionStart);
        }
        setCurrentSegment(segment);
        setDateSelection(inputRef, segment);
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
        setDateSelection(inputRef, segment);
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
      if (curSegment.type === "month") {
        // Month: 1-12
        if (numValue > 1 && newValue.length === 1) {
          // First digit > 1, can't be valid month
          newValue = num;
        } else if (numValue > 12) {
          newValue = num;
        }
      } else if (curSegment.type === "day") {
        // Day: 1-31
        if (numValue > 3 && newValue.length === 1) {
          // First digit > 3, can't be valid day
          newValue = num;
        } else if (numValue > 31) {
          newValue = num;
        }
      } else if (curSegment.type === "year") {
        // Year: 00-99 (2 digits)
        if (numValue > 99) {
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
        setDateSelection(inputRef, updatedSegment);
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
      setDateSelection(inputRef, segment);
    } else {
      onSegmentChange("left");
    }
  }, [segments, curSegment, onSegmentChange]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const key = event.key;
      setDateSelection(inputRef, curSegment);

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
      const firstSegment = clearedSegments.find((s) => s.type === "month");
      if (firstSegment) {
        setCurrentSegment(firstSegment);
        setDateSelection(inputRef, firstSegment);
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
            const firstSegment = segments.find((s) => s.type === "month");
            if (firstSegment) {
              setCurrentSegment(firstSegment);
              setDateSelection(inputRef, firstSegment);
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
        placeholder="MM/DD/YY"
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

    // ソート関数: name -> date -> start の順で昇順ソート
    const sortRecords = (records: WorkingHoursRecord[]) => {
      return records.sort((a, b) => {
        // 1. name で比較（昇順）
        if (a.name !== b.name) {
          return a.name.localeCompare(b.name);
        }

        // 2. date で比較（昇順、nullは最後）
        const dateA = a.date || "";
        const dateB = b.date || "";
        if (dateA !== dateB) {
          // nullの場合は最後に配置
          if (!a.date) return 1;
          if (!b.date) return -1;
          return dateA.localeCompare(dateB);
        }

        // 3. start で比較（昇順、nullは最後）
        const startA = a.start || "";
        const startB = b.start || "";
        // nullの場合は最後に配置
        if (!a.start && !b.start) return 0;
        if (!a.start) return 1;
        if (!b.start) return -1;
        return startA.localeCompare(startB);
      });
    };

    // ソートを適用
    sortRecords(complete);
    sortRecords(incomplete);

    return { completeRecords: complete, incompleteRecords: incomplete };
  }, [data]);

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

  // 編集モードの切り替え時のみ状態を初期化
  useEffect(() => {
    if (isEditing && !prevIsEditingRef.current) {
      // 編集モードに入った時のみ、元のデータを保存（Cancel用）
      originalDataRef.current = data ? [...data] : [];
      setEditingInputValues({});
    } else if (!isEditing && prevIsEditingRef.current) {
      // 編集モードを抜けた時、編集中の入力値をクリア
      // Note: We don't call onDataChange here because:
      // - On Save: parent component (handleSaveWorkingHours) will read workingHoursData directly
      // - On Cancel: parent component (handleCancelWorkingHours) will restore originalWorkingHoursData
      // Calling onDataChange here would interfere with Cancel operation
      setEditingInputValues({});
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
    const records = isComplete ? completeRecords : incompleteRecords;
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

    // dataから直接更新（completeRecords/incompleteRecordsはuseMemoの結果で古い可能性があるため）
    if (onDataChange && data) {
      const updatedData = data.map((r) => {
        if (r.id !== record.id) return r;

        // 更新されたレコードを作成
        const updatedRecord = { ...r };

        if (field === "date") {
          updatedRecord.date = parseDate(value);
        } else if (field === "start") {
          updatedRecord.start = parseTime(value);
        } else if (field === "end") {
          updatedRecord.end = parseTime(value);
        } else if (field === "role") {
          updatedRecord.role = value || null;
        }

        // is_completeは現在の完全性に基づいて更新（Save時に再計算される）
        // ただし、編集中はis_completeを変更しない（Save時に一括で更新）
        return updatedRecord;
      });

      onDataChange(updatedData);
    }
  };

  // フォーカスアウト時の処理（簡素化：自動移動は行わない）
  const handleCellBlur = () => {
    // Save時に完全性チェックと移動を行うため、ここでは何もしない
    // 必要に応じて、将来的にバリデーションなどの処理を追加可能
  };

  // useMemoの結果を直接使用（ローカル状態は削除）
  const displayCompleteRecords = completeRecords;
  const displayIncompleteRecords = incompleteRecords;

  // incomplete recordsの数を親に通知
  useEffect(() => {
    if (onIncompleteCountChange) {
      onIncompleteCountChange(displayIncompleteRecords.length);
    }
  }, [displayIncompleteRecords.length, onIncompleteCountChange]);

  // Cancel処理：元のデータに復元（親コンポーネントで処理されるため、ここでは入力値をクリアのみ）
  // Note: onCancel is passed from parent component, so handleCancel is used via onCancel prop
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCancel = () => {
    setEditingInputValues({});
    if (onCancel) {
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
            <DateInput
              key={`${record.id}-date-${isEditing}`}
              value={getInputValue("date")}
              onChange={(value) =>
                handleCellChange(index, "date", value, isComplete)
              }
              onBlur={handleCellBlur}
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
            <TimeInput
              key={`${record.id}-start-${isEditing}`}
              value={getInputValue("start")}
              onChange={(value) =>
                handleCellChange(index, "start", value, isComplete)
              }
              onBlur={handleCellBlur}
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
            <TimeInput
              key={`${record.id}-end-${isEditing}`}
              value={getInputValue("end")}
              onChange={(value) =>
                handleCellChange(index, "end", value, isComplete)
              }
              onBlur={handleCellBlur}
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
              onBlur={handleCellBlur}
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
