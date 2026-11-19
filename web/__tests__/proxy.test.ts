import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/authCookie";

function makeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: "u1", exp }));
  return `${header}.${payload}.sig`;
}

function makeRequest(path: string, cookies: Record<string, string> = {}): NextRequest {
  const req = new NextRequest(`http://localhost:3000${path}`);
  for (const [k, v] of Object.entries(cookies)) {
    req.cookies.set(k, v);
  }
  return req;
}

describe("proxy (Next.js 16 route guard)", () => {
  const originalServerUrl = process.env.API_BASE_URL;
  const futureExp = Math.floor(Date.now() / 1000) + 600;
  const pastExp = Math.floor(Date.now() / 1000) - 600;

  beforeEach(() => {
    process.env.API_BASE_URL = "http://localhost:5000";
  });

  afterEach(() => {
    process.env.API_BASE_URL = originalServerUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("redirects unauthenticated visitors from protected routes to /login", async () => {
    const res = await proxy(makeRequest("/"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("redirects authenticated visitors from /login and /register to /", async () => {
    const validAccess = makeJwt(futureExp);
    for (const path of ["/login", "/register"]) {
      const res = await proxy(makeRequest(path, { [ACCESS_COOKIE]: validAccess }));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/");
    }
  });

  it("allows /login?expired=1 and deletes both auth cookies", async () => {
    const validRefresh = makeJwt(futureExp);
    const res = await proxy(makeRequest("/login?expired=1", { [REFRESH_COOKIE]: validRefresh }));
    expect(res.status).toBe(200);
    expect(res.cookies.get(ACCESS_COOKIE)?.value).toBe("");
    expect(res.cookies.get(REFRESH_COOKIE)?.value).toBe("");
  });

  it("refreshes expired access token via API_BASE_URL and sets new access cookie", async () => {
    const expiredAccess = makeJwt(pastExp);
    const validRefresh = makeJwt(futureExp);
    const freshAccess = makeJwt(futureExp + 1200);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { access_token: freshAccess, token_type: "Bearer", expires_in: 1200 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await proxy(
      makeRequest("/boards/b1", {
        [ACCESS_COOKIE]: expiredAccess,
        [REFRESH_COOKIE]: validRefresh,
      })
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/auth/refresh",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: `Bearer ${validRefresh}` },
      })
    );
    expect(res.cookies.get(ACCESS_COOKIE)?.value).toBe(freshAccess);
  });

  it("redirects to /login and deletes both cookies when refresh returns 401", async () => {
    const validRefresh = makeJwt(futureExp);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Invalid refresh" }), { status: 401 })
      )
    );

    const res = await proxy(makeRequest("/", { [REFRESH_COOKIE]: validRefresh }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expect(res.cookies.get(ACCESS_COOKIE)?.value).toBe("");
    expect(res.cookies.get(REFRESH_COOKIE)?.value).toBe("");
  });

  it("redirects to /login?expired=1 on network error or 5xx during refresh", async () => {
    const validRefresh = makeJwt(futureExp);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const res = await proxy(makeRequest("/", { [REFRESH_COOKIE]: validRefresh }));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("expired")).toBe("1");
    expect(res.cookies.get(ACCESS_COOKIE)?.value).toBe("");
    expect(res.cookies.get(REFRESH_COOKIE)?.value).toBe("");
  });
});
