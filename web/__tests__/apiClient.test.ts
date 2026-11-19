import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { clearAuthCookies, getAccessToken, setAccessCookie, setRefreshCookie } from "@/lib/authCookie";
import { registerSessionHooks } from "@/lib/refreshSession";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("lib/apiClient", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalServerUrl = process.env.API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    process.env.API_BASE_URL = "http://localhost:5000";
    clearAuthCookies();
    registerSessionHooks({ onRefreshed: vi.fn(), onExpired: vi.fn() });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    process.env.API_BASE_URL = originalServerUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("throws ApiError(0) without calling fetch when base URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/boards")).rejects.toMatchObject({
      statusCode: 0,
      message: expect.stringContaining("NEXT_PUBLIC_API_BASE_URL"),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("includes Authorization header only when token exists and unwraps data", async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(jsonResponse(200, { data: { ok: true } }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const res1 = await apiRequest<{ ok: boolean }>("/api/health");
    expect(res1).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty("Authorization");

    setAccessCookie("acc-1", 600);
    await apiRequest("/api/boards");
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer acc-1",
    });
  });

  it("throws ApiError with statusCode for 400, 401 (no refresh), 403, 404, 409, 500", async () => {
    for (const status of [400, 401, 403, 404, 409, 500]) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse(status, { error: `Err ${status}` }))
      );
      await expect(apiRequest("/api/boards")).rejects.toEqual(new ApiError(status, `Err ${status}`));
    }
  });

  // Feature: kano, Property 26: API client behavior
  it("Property 26: returns data on 2xx and maps non-2xx envelope or non-envelope to ApiError", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1, maxLength: 40 }),
        fc.boolean(),
        async (status, errMsg, isEnvelope) => {
          vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
              isEnvelope
                ? jsonResponse(status, { error: errMsg })
                : new Response("plain error", { status })
            )
          );
          try {
            await apiRequest("/api/test");
            expect.unreachable("Should throw");
          } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            const err = e as ApiError;
            expect(err.statusCode).toBe(status);
            expect(err.message).toBe(isEnvelope ? errMsg : "Unexpected server response");
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  // Feature: kano, Property 39: Failed refresh clears the session, shared refresh runs once
  it("Property 39: concurrent 401s share one refresh and retry once", async () => {
    setAccessCookie("expired-acc", 600);
    setRefreshCookie("valid-ref", 3600);
    const onRefreshed = vi.fn();
    const onExpired = vi.fn();
    registerSessionHooks({ onRefreshed, onExpired });

    let refreshCount = 0;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/auth/refresh")) {
        refreshCount += 1;
        return jsonResponse(200, {
          data: { access_token: "fresh-acc", token_type: "Bearer", expires_in: 1200 },
        });
      }
      const auth = (init?.headers as Record<string, string>)?.Authorization;
      if (auth === "Bearer expired-acc") {
        return jsonResponse(401, { error: "Token expired" });
      }
      return jsonResponse(200, { data: { url } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const [a, b] = await Promise.all([
      apiRequest<{ url: string }>("/api/boards"),
      apiRequest<{ url: string }>("/api/users/me"),
    ]);

    expect(refreshCount).toBe(1);
    expect(a.url).toContain("/api/boards");
    expect(b.url).toContain("/api/users/me");
    expect(getAccessToken()).toBe("fresh-acc");
    expect(onRefreshed).toHaveBeenCalledWith("fresh-acc");
    expect(onExpired).not.toHaveBeenCalled();
  });

  it("clears both cookies and calls onExpired when refresh returns 401", async () => {
    setAccessCookie("expired-acc", 600);
    setRefreshCookie("bad-ref", 3600);
    const onExpired = vi.fn();
    registerSessionHooks({ onRefreshed: vi.fn(), onExpired });

    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/api/auth/refresh")) {
        return jsonResponse(401, { error: "Invalid refresh token" });
      }
      return jsonResponse(401, { error: "Token expired" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/boards")).rejects.toMatchObject({ statusCode: 401 });
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it("does not attempt refresh on /api/auth/login 401", async () => {
    setRefreshCookie("valid-ref", 3600);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { error: "Invalid email or password" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiRequest("/api/auth/login", { method: "POST", body: { email: "a@b.c", password: "x" } })
    ).rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // Feature: kano, Property 40: Server-side apiClient never renews
  it("Property 40: server runtime never refreshes or writes cookies on 401", async () => {
    vi.stubGlobal("window", undefined);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { error: "Unauthorized" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/boards", { token: "server-tok" })).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
