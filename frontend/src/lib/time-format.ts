/**
 * Convert 24-hour time (HH:MM) to 12-hour time (HH:MM AM/PM)
 * @param time24 - Time string in 24-hour format (HH:MM or HH:MM:SS)
 * @returns Time string in 12-hour format (HH:MM AM/PM) or empty string
 */
export function convert24To12(time24: string | null): string {
  if (!time24 || time24.trim() === "") return "";

  // Remove seconds if present (HH:MM:SS -> HH:MM)
  const timeWithoutSeconds = time24.slice(0, 5);
  const [hoursStr, minutesStr] = timeWithoutSeconds.split(":");

  if (!hoursStr || !minutesStr) return "";

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "";
  }

  let hours12 = hours;
  let period = "AM";

  if (hours === 0) {
    hours12 = 12; // 00:XX -> 12:XX AM
  } else if (hours === 12) {
    hours12 = 12; // 12:XX -> 12:XX PM
    period = "PM";
  } else if (hours > 12) {
    hours12 = hours - 12; // 13:XX -> 1:XX PM
    period = "PM";
  }

  return `${hours12.toString().padStart(2, "0")}:${minutesStr} ${period}`;
}

/**
 * Convert 12-hour time (HH:MM AM/PM) to 24-hour time (HH:MM)
 * @param time12 - Time string in 12-hour format (HH:MM AM/PM)
 * @returns Time string in 24-hour format (HH:MM) or empty string
 */
export function convert12To24(time12: string | null): string {
  if (!time12 || time12.trim() === "") return "";

  // Match pattern: HH:MM AM/PM or HH:MMAM/PM (with or without space)
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return "";

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (isNaN(hours) || hours < 1 || hours > 12) return "";
  if (parseInt(minutes, 10) < 0 || parseInt(minutes, 10) > 59) return "";

  // Convert to 24-hour format
  if (period === "AM") {
    if (hours === 12) {
      hours = 0; // 12:XX AM -> 00:XX
    }
    // 1-11 AM stays as is
  } else if (period === "PM") {
    if (hours !== 12) {
      hours = hours + 12; // 1-11 PM -> 13-23
    }
    // 12 PM stays as 12
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}
