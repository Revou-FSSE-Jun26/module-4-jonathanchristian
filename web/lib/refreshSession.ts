import { getRefreshToken, setAccessCookie, clearAuthCookies } from "./authCookie";
import { ApiError } from "./errors";
import type { RefreshResult } from "./types";

interface SessionHooks {
  onRefreshed(accessToken: string): void;
  onExpired(): void;
}

let hooks: SessionHooks | null = null;
let inFlight: Promise<string> | null = null;

const REQUEST_TIMEOUT_MS = 10_000;

/** Register AuthProvider callbacks for token refresh and session expiration. */
export function registerSessionHooks(nextHooks: SessionHooks): void {
  hooks = nextHooks;
}

/** Clear both auth cookies and notify AuthProvider that the session expired. */
export function sessionExpired(): void {
  clearAuthCookies();
  hooks?.onExpired();
}

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    sessionExpired();
    throw new ApiError(401, "Session expired");
  }

  const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!rawBaseUrl) {
    throw new ApiError(0, "API base URL is not configured (NEXT_PUBLIC_API_BASE_URL)");
  }

  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, "Could not reach the server");
  } finally {
    clearTimeout(timeoutId);
  }

  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const message =
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof (parsed as { error?: unknown }).error === "string"
        ? (parsed as { error: string }).error
        : response.status === 401
          ? "Session expired"
          : "Unexpected server response";

    if (response.status === 401) {
      sessionExpired();
    }
    throw new ApiError(response.status, message);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("data" in parsed) ||
    !parsed.data ||
    typeof parsed.data !== "object"
  ) {
    throw new ApiError(response.status, "Unexpected server response");
  }

  const data = parsed.data as RefreshResult;
  if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
    throw new ApiError(response.status, "Unexpected server response");
  }

  setAccessCookie(data.access_token, data.expires_in);
  hooks?.onRefreshed(data.access_token);
  return data.access_token;
}

/**
 * Refresh the access token using a single-flight shared promise.
 * Concurrent callers share one `POST /api/auth/refresh` request.
 */
export function refreshAccessToken(): Promise<string> {
  if (!inFlight) {
    inFlight = doRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
