import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  WELCOME_COOKIE,
  WELCOME_COOKIE_MAX_AGE,
  decodeJwtExp,
} from "@/lib/authCookie";
import { decideRoute, type AuthState } from "@/lib/decideRoute";
import type { RefreshResult } from "@/lib/types";

// Next.js 16.4.6 replaced the `middleware.ts` convention with `proxy.ts` (`export function proxy`).

function deleteAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

function applyWelcomeCookie(
  response: NextResponse,
  shouldSet: boolean | undefined,
  isHttps: boolean
): NextResponse {
  if (shouldSet) {
    response.cookies.set(WELCOME_COOKIE, "1", {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: WELCOME_COOKIE_MAX_AGE,
      secure: isHttps,
    });
  }
  return response;
}

function computeAuthState(
  accessToken: string | null,
  refreshToken: string | null,
  now: number
): AuthState {
  const accessExp = decodeJwtExp(accessToken);
  if (accessExp !== null && accessExp > now) {
    return "authenticated";
  }
  const refreshExp = decodeJwtExp(refreshToken);
  if (refreshExp !== null && refreshExp > now) {
    return "refreshable";
  }
  return "unauthenticated";
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams, protocol } = request.nextUrl;
  const isHttps = protocol === "https:";

  if (pathname === "/login" && searchParams.get("expired") === "1") {
    return deleteAuthCookies(NextResponse.next());
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? null;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value ?? null;
  const welcomeSeen = request.cookies.get(WELCOME_COOKIE)?.value === "1";
  const now = Math.floor(Date.now() / 1000);

  const auth = computeAuthState(accessToken, refreshToken, now);
  const decision = decideRoute({ pathname, auth, welcomeSeen });

  if (decision.kind === "continue") {
    return applyWelcomeCookie(NextResponse.next(), decision.setWelcomeCookie, isHttps);
  }

  if (decision.kind === "redirect") {
    return applyWelcomeCookie(
      NextResponse.redirect(new URL(decision.to, request.url)),
      decision.setWelcomeCookie,
      isHttps
    );
  }

  // decision.kind === "refresh-then-continue"
  const rawBaseUrl = process.env.API_BASE_URL?.trim();
  if (!rawBaseUrl || !refreshToken) {
    return deleteAuthCookies(NextResponse.redirect(new URL("/login?expired=1", request.url)));
  }

  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (res.status === 401) {
      const fallback = decideRoute({ pathname, auth: "unauthenticated", welcomeSeen });
      const target = fallback.kind === "redirect" ? fallback.to : "/login";
      const response = deleteAuthCookies(NextResponse.redirect(new URL(target, request.url)));
      return applyWelcomeCookie(
        response,
        fallback.kind === "redirect" ? fallback.setWelcomeCookie : undefined,
        isHttps
      );
    }

    if (!res.ok) {
      return deleteAuthCookies(NextResponse.redirect(new URL("/login?expired=1", request.url)));
    }

    const body = (await res.json()) as { data?: RefreshResult };
    const nextAccess = body?.data?.access_token;
    const expiresIn = body?.data?.expires_in;
    if (typeof nextAccess !== "string" || typeof expiresIn !== "number") {
      return deleteAuthCookies(NextResponse.redirect(new URL("/login?expired=1", request.url)));
    }

    request.cookies.set(ACCESS_COOKIE, nextAccess);
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    response.cookies.set(ACCESS_COOKIE, nextAccess, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: Math.max(0, Math.floor(expiresIn)),
      secure: isHttps,
    });
    return response;
  } catch {
    return deleteAuthCookies(NextResponse.redirect(new URL("/login?expired=1", request.url)));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
