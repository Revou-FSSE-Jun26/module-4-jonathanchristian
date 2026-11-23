import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { ACCESS_COOKIE, REFRESH_COOKIE, WELCOME_COOKIE } from "@/lib/authCookie";

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

describe("proxy (Next.js 16 route guard with V6 welcome & invite)", () => {
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

  it("redirects unauthenticated `/` without welcome cookie to `/welcome` and with cookie to `/login`", async () => {
    const first = await proxy(makeRequest("/"));
    expect(first.status).toBe(307);
    expect(new URL(first.headers.get("location")!).pathname).toBe("/welcome");

    const seen = await proxy(makeRequest("/", { [WELCOME_COOKIE]: "1" }));
    expect(seen.status).toBe(307);
    expect(new URL(seen.headers.get("location")!).pathname).toBe("/login");
  });

  it("allows `/welcome` for unauthenticated visitors without setting the welcome cookie, and redirects authenticated users to `/`", async () => {
    const anon = await proxy(makeRequest("/welcome"));
    expect(anon.status).toBe(200);
    expect(anon.cookies.get(WELCOME_COOKIE)).toBeUndefined();

    const authed = await proxy(makeRequest("/welcome", { [ACCESS_COOKIE]: makeJwt(futureExp) }));
    expect(authed.status).toBe(307);
    expect(new URL(authed.headers.get("location")!).pathname).toBe("/");
  });

  it("sets welcome cookie on `/login` and `/register` when absent for unauthenticated visitors", async () => {
    const res = await proxy(makeRequest("/login"));
    expect(res.status).toBe(200);
    expect(res.cookies.get(WELCOME_COOKIE)?.value).toBe("1");
  });

  it("redirects unauthenticated `/invite/<token>` to `/login?next=...` regardless of welcome cookie", async () => {
    const res = await proxy(makeRequest("/invite/abc_123"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("next")).toBe("/invite/abc_123");
  });

  it("redirects authenticated visitors from `/login` and `/register` to `/`", async () => {
    const validAccess = makeJwt(futureExp);
    for (const path of ["/login", "/register"]) {
      const res = await proxy(makeRequest(path, { [ACCESS_COOKIE]: validAccess }));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/");
    }
  });

  it("allows `/login?expired=1` and deletes both auth cookies", async () => {
    const validRefresh = makeJwt(futureExp);
    const res = await proxy(makeRequest("/login?expired=1", { [REFRESH_COOKIE]: validRefresh }));
    expect(res.status).toBe(200);
    expect(res.cookies.get(ACCESS_COOKIE)?.value).toBe("");
    expect(res.cookies.get(REFRESH_COOKIE)?.value).toBe("");
  });

  it("refreshes expired access token on `/invite/<token>` and `/boards/b1` and sets new access cookie", async () => {
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
      makeRequest("/invite/token_123", {
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

  it("re-evaluates as unauthenticated when refresh returns 401 (keeps `next` for invite, respects welcome cookie for `/`)", async () => {
    const validRefresh = makeJwt(futureExp);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ error: "Invalid refresh" }), { status: 401 }))
      )
    );

    const inviteRes = await proxy(makeRequest("/invite/tok_9", { [REFRESH_COOKIE]: validRefresh }));
    expect(inviteRes.status).toBe(307);
    const inviteLoc = new URL(inviteRes.headers.get("location")!);
    expect(inviteLoc.pathname).toBe("/login");
    expect(inviteLoc.searchParams.get("next")).toBe("/invite/tok_9");
    expect(inviteRes.cookies.get(ACCESS_COOKIE)?.value).toBe("");
    expect(inviteRes.cookies.get(REFRESH_COOKIE)?.value).toBe("");

    const rootNoWelcome = await proxy(makeRequest("/", { [REFRESH_COOKIE]: validRefresh }));
    expect(rootNoWelcome.status).toBe(307);
    expect(new URL(rootNoWelcome.headers.get("location")!).pathname).toBe("/welcome");

    const rootWithWelcome = await proxy(
      makeRequest("/", { [REFRESH_COOKIE]: validRefresh, [WELCOME_COOKIE]: "1" })
    );
    expect(rootWithWelcome.status).toBe(307);
    expect(new URL(rootWithWelcome.headers.get("location")!).pathname).toBe("/login");
  });

  it("redirects to `/login?expired=1` on network error or 5xx during refresh", async () => {
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
