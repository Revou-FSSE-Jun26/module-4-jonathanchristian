import { beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  decodeJwtExp,
  getAccessToken,
  getRefreshToken,
  guardDecision,
  setAccessCookie,
  setRefreshCookie,
} from "@/lib/authCookie";

function makeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: "u1", exp }));
  return `${header}.${payload}.sig`;
}

describe("lib/authCookie", () => {
  beforeEach(() => {
    clearAuthCookies();
  });

  it("writes access and refresh cookies using provided lifetimes other than 3600 and 604800", () => {
    const cookieSetter = vi.spyOn(document, "cookie", "set");

    setAccessCookie("acc.tok.1", 900);
    setRefreshCookie("ref.tok.2", 172800);

    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${ACCESS_COOKIE}=acc.tok.1; Path=/; Max-Age=900; SameSite=Lax`)
    );
    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${REFRESH_COOKIE}=ref.tok.2; Path=/; Max-Age=172800; SameSite=Lax`)
    );

    cookieSetter.mockRestore();
  });

  it("reads and clears both cookies", () => {
    setAccessCookie("token-a", 120);
    setRefreshCookie("token-r", 240);
    expect(getAccessToken()).toBe("token-a");
    expect(getRefreshToken()).toBe("token-r");

    clearAuthCookies();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("decodes JWT exp safely", () => {
    const token = makeJwt(1800000000);
    expect(decodeJwtExp(token)).toBe(1800000000);
    expect(decodeJwtExp("invalid")).toBeNull();
    expect(decodeJwtExp(null)).toBeNull();
  });

  // Feature: kano, Property 28: Route guard decision
  it("Property 28: guardDecision covers all auth and protected path combinations", () => {
    const pathArb = fc.constantFrom("/", "/boards/123", "/my-tasks", "/profile", "/login", "/register");
    const tokenStateArb = fc.constantFrom<"absent" | "expired" | "valid">("absent", "expired", "valid");

    fc.assert(
      fc.property(
        pathArb,
        tokenStateArb,
        tokenStateArb,
        fc.integer({ min: 1000, max: 2000000000 }),
        (pathname, accessState, refreshState, now) => {
          const toExp = (s: "absent" | "expired" | "valid") =>
            s === "absent" ? null : s === "expired" ? now - 10 : now + 60;

          const decision = guardDecision({
            pathname,
            accessExp: toExp(accessState),
            refreshExp: toExp(refreshState),
            now,
          });

          const isAuthPage = pathname === "/login" || pathname === "/register";
          if (isAuthPage) {
            if (accessState === "valid" || refreshState === "valid") {
              expect(decision).toBe("redirect-home");
            } else {
              expect(decision).toBe("allow");
            }
          } else if (accessState === "valid") {
            expect(decision).toBe("allow");
          } else if (refreshState === "valid") {
            expect(decision).toBe("refresh");
          } else {
            expect(decision).toBe("redirect-login");
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
