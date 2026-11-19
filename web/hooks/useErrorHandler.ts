"use client";

import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clearAuthCookies } from "@/lib/authCookie";
import { ApiError } from "@/lib/errors";
import { showError } from "@/lib/toast";

export const STATUS_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  400: "Please check your input and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested item could not be found.",
  409: "This action conflicts with existing data.",
  500: "A server error occurred. Please try again later.",
};

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Returns `handleError(err)` which displays one status-appropriate error toast
 * and clears auth state + redirects to `/login` on 401.
 */
export function useErrorHandler(): { handleError: (err: unknown) => void } {
  const { logout } = useAuth();

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) {
        const mapped = STATUS_ERROR_MESSAGES[err.statusCode];
        if (err.statusCode === 401) {
          clearAuthCookies();
          logout();
        }
        showError(mapped ?? GENERIC_ERROR_MESSAGE);
        return;
      }
      showError(GENERIC_ERROR_MESSAGE);
    },
    [logout]
  );

  return { handleError };
}
