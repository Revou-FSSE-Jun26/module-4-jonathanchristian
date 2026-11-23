export type AuthState = "authenticated" | "refreshable" | "unauthenticated";
export type PathClass = "root" | "welcome" | "login" | "register" | "invite" | "protected";
export type RouteDecision =
  | { kind: "continue"; setWelcomeCookie?: boolean }
  | { kind: "refresh-then-continue" }
  | { kind: "redirect"; to: string; setWelcomeCookie?: boolean };

export const INVITE_PATH_RE = /^\/invite\/[A-Za-z0-9_-]{1,128}$/;

/** Classify a request pathname into one of the route-guard path classes. */
export function classifyPath(pathname: string): PathClass {
  if (pathname === "/") return "root";
  if (pathname === "/welcome") return "welcome";
  if (pathname === "/login") return "login";
  if (pathname === "/register") return "register";
  if (INVITE_PATH_RE.test(pathname)) return "invite";
  return "protected";
}

/**
 * Pure route guard decision for `proxy.ts` (B4-V6).
 * Covers `/`, `/welcome`, `/login`, `/register`, `/invite/<token>`, and all other protected paths.
 */
export function decideRoute({
  pathname,
  auth,
  welcomeSeen,
}: {
  pathname: string;
  auth: AuthState;
  welcomeSeen: boolean;
}): RouteDecision {
  const pathClass = classifyPath(pathname);

  if (pathClass === "root") {
    if (auth === "authenticated") return { kind: "continue" };
    if (auth === "refreshable") return { kind: "refresh-then-continue" };
    return { kind: "redirect", to: welcomeSeen ? "/login" : "/welcome" };
  }

  if (pathClass === "welcome") {
    if (auth === "authenticated" || auth === "refreshable") {
      return { kind: "redirect", to: "/" };
    }
    return { kind: "continue" };
  }

  if (pathClass === "login" || pathClass === "register") {
    if (auth === "authenticated" || auth === "refreshable") {
      return { kind: "redirect", to: "/" };
    }
    return welcomeSeen ? { kind: "continue" } : { kind: "continue", setWelcomeCookie: true };
  }

  if (pathClass === "invite") {
    if (auth === "authenticated") return { kind: "continue" };
    if (auth === "refreshable") return { kind: "refresh-then-continue" };
    return { kind: "redirect", to: `/login?next=${encodeURIComponent(pathname)}` };
  }

  // "protected"
  if (auth === "authenticated") return { kind: "continue" };
  if (auth === "refreshable") return { kind: "refresh-then-continue" };
  return { kind: "redirect", to: "/login" };
}
