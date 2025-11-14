/**
 * Type guard and utility functions for handling API errors
 * that have the structure: { message: string } or { error: string }
 */

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export interface ErrorWithMessage {
  message: string;
}

/**
 * Type guard to check if error has the API error response structure
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    error !== null &&
    typeof error === "object" &&
    ("message" in error || "error" in error) &&
    (typeof (error as { message?: unknown }).message === "string" ||
      typeof (error as { error?: unknown }).error === "string")
  );
}

/**
 * Type guard to check if error has a message property
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Extract error message from various error types
 * Returns a default message if error structure is unknown
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = "An error occurred"
): string {
  if (isApiErrorResponse(error)) {
    return error.message || error.error || defaultMessage;
  }

  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
}
