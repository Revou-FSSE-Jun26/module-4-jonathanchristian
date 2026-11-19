import { getAccessToken, getRefreshToken } from "./authCookie";
import { ApiError } from "./errors";
import { refreshAccessToken, sessionExpired } from "./refreshSession";

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  query?: Record<string, string | undefined>;
}

const REQUEST_TIMEOUT_MS = 10_000;
const NO_REFRESH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
]);

function getBaseUrl(isServer: boolean): string {
  const raw = isServer ? process.env.API_BASE_URL : process.env.NEXT_PUBLIC_API_BASE_URL;
  const trimmed = raw?.trim();
  if (!trimmed) {
    const varName = isServer ? "API_BASE_URL" : "NEXT_PUBLIC_API_BASE_URL";
    throw new ApiError(0, `API base URL is not configured (${varName})`);
  }
  return trimmed.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | undefined>): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!query) {
    return `${baseUrl}${normalizedPath}`;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${baseUrl}${normalizedPath}?${qs}` : `${baseUrl}${normalizedPath}`;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (body && typeof body.error === "string") {
      return new ApiError(response.status, body.error);
    }
  } catch {
    // Non-JSON error body
  }
  return new ApiError(response.status, "Unexpected server response");
}

async function sendOnce(
  url: string,
  method: string,
  body: unknown,
  token: string | null,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    return await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (externalSignal?.aborted && !timedOut) {
      throw err;
    }
    throw new ApiError(0, "Could not reach the server");
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Send an HTTP request to the Kano API and unwrap `{ data }`.
 * In the browser, automatically refreshes an expired access token once on 401.
 * On the server, never refreshes or writes cookies and throws `ApiError(401)` directly.
 */
export async function apiRequest<T>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const isServer = typeof window === "undefined";
  const baseUrl = getBaseUrl(isServer);
  const url = buildUrl(baseUrl, path, opts.query);
  const method = opts.method ?? "GET";

  let token: string | null = opts.token !== undefined ? opts.token : null;
  if (opts.token === undefined && !isServer) {
    token = getAccessToken();
    if (!token && !NO_REFRESH_PATHS.has(path) && getRefreshToken()) {
      token = await refreshAccessToken();
    }
  }

  let response = await sendOnce(url, method, opts.body, token, opts.signal);

  if (
    response.status === 401 &&
    !isServer &&
    token &&
    !NO_REFRESH_PATHS.has(path) &&
    getRefreshToken()
  ) {
    const refreshedToken = await refreshAccessToken();
    response = await sendOnce(url, method, opts.body, refreshedToken, opts.signal);
    if (response.status === 401) {
      sessionExpired();
      throw await parseError(response);
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new ApiError(response.status, "Unexpected server response");
  }

  if (!parsed || typeof parsed !== "object" || !("data" in parsed)) {
    throw new ApiError(response.status, "Unexpected server response");
  }

  return (parsed as { data: T }).data;
}
