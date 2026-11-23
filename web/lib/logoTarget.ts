import type { AuthState } from "@/lib/types";

export type LogoTarget = "/welcome" | "/";
export type AuthStatus = AuthState["status"];

/** Returns true only while AuthContext status is `"authenticated"`. */
export function isVisitorAuthenticated(status: AuthStatus): boolean {
  return status === "authenticated";
}

/** Returns `/` for authenticated visitors and `/welcome` otherwise (never `/login`). */
export function logoTarget(isAuthenticated: boolean): LogoTarget {
  return isAuthenticated ? "/" : "/welcome";
}
