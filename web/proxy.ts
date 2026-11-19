import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  decodeJwtExp,
  guardDecision,
} from "@/lib/authCookie";
import type { RefreshResult } from "@/lib/types";

// Next.js 16.4.6 replaced the `middleware.ts` convention with `proxy.ts` (`export function proxy`).

function deleteAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/login" && searchParams.get("expired") === "1") {
    return deleteAuthCookies(NextResponse.next());
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? null;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value ?? null;
  const now = Math.floor(Date.now() / 1000);

  const decision = guardDecision({
    pathname,
    accessExp: decodeJwtExp(accessToken),
    refreshExp: decodeJwtExp(refreshToken),
    now,
  });

  if (decision === "allow") {
    return NextResponse.next();
  }

  if (decision === "redirect-home") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (decision === "redirect-login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // decision === "refresh"
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
      return deleteAuthCookies(NextResponse.redirect(new URL("/login", request.url)));
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
      secure: request.nextUrl.protocol === "https:",
    });
    return response;
  } catch {
    return deleteAuthCookies(NextResponse.redirect(new URL("/login?expired=1", request.url)));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
