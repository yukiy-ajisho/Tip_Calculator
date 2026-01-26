"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { convert24To12, convert12To24 } from "@/lib/time-format";

type SegmentType = "hour" | "minute" | "space" | "ampm";

interface Segment {
  type: SegmentType;
  symbols: string;
  index: number;
  value: string;
}

/**
 * Parse HH:MM string into segments (24-hour format)
 */
function parseTimeString24(timeString: string | null): Segment[] {
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
 * Parse HH:MM AM/PM string into segments (12-hour format)
 */
function parseTimeString12(timeString: string | null): Segment[] {
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
  index += 2;

  // Space segment ( )
  segments.push({
    type: "space",
    symbols: " ",
    index: index,
    value: " ",
  });
  index += 1;

  // AM/PM segment
  const ampmMatch = timeString ? timeString.match(/\s*(AM|PM)$/i) : null;
  segments.push({
    type: "ampm",
    symbols: "AM/PM",
    index: index,
    value: ampmMatch ? ampmMatch[1].toUpperCase() : "",
  });

  return segments;
}

/**
 * Build time string from segments (24-hour format)
 */
function buildTimeString24(segments: Segment[]): string {
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
 * Build time string from segments (12-hour format)
 */
function buildTimeString12(segments: Segment[]): string {
  const hour = segments.find((s) => s.type === "hour")?.value || "";
  const minute = segments.find((s) => s.type === "minute")?.value || "";
  const ampm = segments.find((s) => s.type === "ampm")?.value || "";

  if (!hour && !minute) return "";
  if (!ampm) return ""; // AM/PM is required for 12-hour format

  // Pad with zeros if needed
  const hourPadded = hour.padStart(2, "0");
  const minutePadded = minute.padStart(2, "0");

  // Validate hour (1-12)
  const hourNum = parseInt(hourPadded, 10);
  if (isNaN(hourNum) || hourNum < 1 || hourNum > 12) return "";

  // Validate minute (0-59)
  const minuteNum = parseInt(minutePadded, 10);
  if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) return "";

  // Validate AM/PM
  if (ampm !== "AM" && ampm !== "PM") return "";

  return `${hourPadded}:${minutePadded} ${ampm}`;
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
 * Time input component with segment-based editing
 */
export function TimeInput({
  value,
  onChange,
  onBlur,
  disabled,
  timeFormat = "24h",
  onKeyDown,
  "data-record-id": dataRecordId,
  "data-field": dataField,
  "data-is-complete": dataIsComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  timeFormat?: "24h" | "12h";
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  "data-record-id"?: string;
  "data-field"?: string;
  "data-is-complete"?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert 24-hour value to 12-hour format for display if needed
  const displayValue = useMemo(() => {
    if (timeFormat === "12h" && value) {
      return convert24To12(value);
    }
    return value;
  }, [value, timeFormat]);

  const [segments, setSegments] = useState<Segment[]>(() => {
    // Calculate display value for initial state
    const initialDisplayValue =
      timeFormat === "12h" && value ? convert24To12(value) : value;
    if (timeFormat === "12h") {
      return parseTimeString12(initialDisplayValue);
    }
    return parseTimeString24(initialDisplayValue);
  });
  const [selectedSegmentAt, setSelectedSegmentAt] = useState<
    number | undefined
  >(undefined);
  const [isFocused, setIsFocused] = useState(false);

  // Update segments when value prop changes (from outside)
  // Sync only when not focused, and avoid unnecessary state updates
  useEffect(() => {
    if (isFocused) return;
    const nextSegments =
      timeFormat === "12h"
        ? parseTimeString12(displayValue)
        : parseTimeString24(displayValue);

    const handle = requestAnimationFrame(() => {
      setSegments((prev) => {
        const isSame =
          prev.length === nextSegments.length &&
          prev.every((seg, idx) => {
            const next = nextSegments[idx];
            return (
              seg.type === next.type &&
              seg.symbols === next.symbols &&
              seg.index === next.index &&
              seg.value === next.value
            );
          });
        return isSame ? prev : nextSegments;
      });
    });

    return () => cancelAnimationFrame(handle);
  }, [displayValue, isFocused, timeFormat]);

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
      .map((s) => {
        if (s.type === "ampm") {
          // AM/PM segment: show value or placeholder
          return s.value || s.symbols;
        }
        return s.value ? s.value.padStart(s.symbols.length, "0") : s.symbols;
      })
      .join("");
  }, [segments]);

  // Build time string from segments and call onChange
  // Only call onChange when segments change due to user input, not when value prop changes
  useEffect(() => {
    let timeString: string;
    if (timeFormat === "12h") {
      timeString = buildTimeString12(segments);
      // Convert 12-hour format to 24-hour format for onChange
      if (timeString) {
        const time24 = convert12To24(timeString);
        // Only call onChange if the time24 is different from value AND it's a valid time
        if (time24 !== value && time24 !== "") {
          onChange(time24);
        }
      }
    } else {
      timeString = buildTimeString24(segments);
      // Only call onChange if the timeString is different from value AND it's a valid time
      if (timeString !== value && timeString !== "") {
        onChange(timeString);
      }
    }
  }, [segments, value, onChange, timeFormat]);

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
      if (
        !curSegment ||
        curSegment.type === "space" ||
        curSegment.type === "ampm"
      )
        return;

      const length = curSegment.symbols.length;
      const rawValue = curSegment.value
        ? parseInt(curSegment.value).toString()
        : "";
      // For minute segment, always replace if current value is 2 digits (e.g., "00")
      // For hour segment, append if current value is less than 2 digits
      let newValue: string;
      if (
        curSegment.type === "minute" &&
        curSegment.value &&
        curSegment.value.length === length
      ) {
        // Minute segment: replace if already 2 digits (e.g., "00")
        newValue = num;
      } else {
        // Hour segment or minute segment with less than 2 digits: append
        newValue = rawValue.length < length ? rawValue + num : num;
      }

      // Validate and adjust based on segment type
      const numValue = parseInt(newValue, 10);
      if (curSegment.type === "hour") {
        if (timeFormat === "12h") {
          // Hour: 1-12 for 12-hour format
          // Allow single digits 1-9 (will be padded to 01-09)
          // Allow 10, 11, 12
          // Reject if > 12
          if (newValue.length === 1) {
            // Single digit: allow 1-9
            if (numValue < 1 || numValue > 9) {
              newValue = num;
            }
          } else if (newValue.length === 2) {
            // Two digits: must be 01-12
            // Keep 2-digit format for 01-09, 10, 11, 12
            if (numValue < 1 || numValue > 12) {
              // Invalid value: replace with single digit
              newValue = num;
            }
            // Valid 2-digit value (01-12): keep as is, don't replace with single digit
          }
        } else {
          // Hour: 0-23 for 24-hour format
          if (numValue > 2 && newValue.length === 1) {
            // First digit > 2, can't be valid hour
            newValue = num;
          } else if (numValue > 23) {
            newValue = num;
          }
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
    [segments, curSegment, onSegmentChange, timeFormat]
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

  const setAmpm = useCallback(
    (ampm: "AM" | "PM") => {
      if (!curSegment || curSegment.type !== "ampm") return;

      const updatedSegments = segments.map((s) =>
        s.index === curSegment.index ? { ...curSegment, value: ampm } : s
      );
      setSegments(updatedSegments);
      setSelection(inputRef, curSegment);
    },
    [segments, curSegment]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const key = event.key;

      // Enterキーの場合は親のonKeyDownに委譲（setSelectionは不要）
      if (key === "Enter" && onKeyDown) {
        onKeyDown(event);
        return;
      }

      setSelection(inputRef, curSegment);

      switch (key) {
        case "ArrowRight":
        case "ArrowLeft":
          onSegmentChange(key === "ArrowRight" ? "right" : "left");
          event.preventDefault();
          break;
        case "ArrowUp":
          // Set AM in 12-hour format
          if (timeFormat === "12h" && curSegment?.type === "ampm") {
            setAmpm("AM");
            event.preventDefault();
          }
          break;
        case "ArrowDown":
          // Set PM in 12-hour format
          if (timeFormat === "12h" && curSegment?.type === "ampm") {
            setAmpm("PM");
            event.preventDefault();
          }
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
      setAmpm,
      timeFormat,
      onKeyDown,
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

  // Get placeholder based on time format
  const placeholder = timeFormat === "12h" ? "HH:MM AM/PM" : "HH:MM";

  // Adjust input width for 12-hour format (longer placeholder)
  const inputWidth = timeFormat === "12h" ? "w-28" : "w-20";

  const hasValue = useMemo(() => {
    return validSegments.some((s) => s.value);
  }, [validSegments]);

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={inputRef}
        className={`font-mono ${inputWidth} px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50`}
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
        onKeyDown={handleKeyDown}
        value={inputStr}
        placeholder={placeholder}
        onChange={() => {}}
        disabled={disabled}
        spellCheck={false}
        data-record-id={dataRecordId}
        data-field={dataField}
        data-is-complete={dataIsComplete}
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
