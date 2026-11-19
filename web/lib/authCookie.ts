export const ACCESS_COOKIE = "kano_access";
export const REFRESH_COOKIE = "kano_refresh";

export type GuardDecision = "allow" | "refresh" | "redirect-login" | "redirect-home";

export interface GuardInput {
  pathname: string;
  accessExp: number | null;
  refreshExp: number | null;
  now: number;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") {
    return;
  }
  const safeMaxAge = Math.max(0, Math.floor(maxAgeSeconds));
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${safeMaxAge}; SameSite=Lax${secure}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const prefix = `${name}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      const raw = part.slice(prefix.length);
      return raw ? decodeURIComponent(raw) : null;
    }
  }
  return null;
}

/** Store the access token cookie with `Max-Age` taken from the API `expires_in`. */
export function setAccessCookie(token: string, expiresIn: number): void {
  writeCookie(ACCESS_COOKIE, token, expiresIn);
}

/** Store the refresh token cookie with `Max-Age` taken from the API `refresh_expires_in`. */
export function setRefreshCookie(token: string, refreshExpiresIn: number): void {
  writeCookie(REFRESH_COOKIE, token, refreshExpiresIn);
}

/** Read the access token from `document.cookie` (browser only). */
export function getAccessToken(): string | null {
  return readCookie(ACCESS_COOKIE);
}

/** Read the refresh token from `document.cookie` (browser only). */
export function getRefreshToken(): string | null {
  return readCookie(REFRESH_COOKIE);
}

/** Clear both auth cookies in the browser. */
export function clearAuthCookies(): void {
  writeCookie(ACCESS_COOKIE, "", 0);
  writeCookie(REFRESH_COOKIE, "", 0);
}

/** Decode a JWT's `exp` claim (Unix seconds) without verifying signature. */
export function decodeJwtExp(token: string | null | undefined): number | null {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: unknown };
    return typeof payload.exp === "number" && Number.isFinite(payload.exp) ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Pure route guard decision used by the Next.js middleware/proxy. */
export function guardDecision({
  pathname,
  accessExp,
  refreshExp,
  now,
}: GuardInput): GuardDecision {
  const accessValid = accessExp !== null && accessExp > now;
  const refreshValid = refreshExp !== null && refreshExp > now;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return accessValid || refreshValid ? "redirect-home" : "allow";
  }
  if (accessValid) {
    return "allow";
  }
  if (refreshValid) {
    return "refresh";
  }
  return "redirect-login";
}
