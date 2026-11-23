import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  WELCOME_COOKIE,
  clearAuthCookies,
  decodeJwtExp,
  getAccessToken,
  getRefreshToken,
  getWelcomeSeen,
  setAccessCookie,
  setRefreshCookie,
  setWelcomeCookie,
} from "@/lib/authCookie";

function makeJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: "u1", exp }));
  return `${header}.${payload}.sig`;
}

describe("lib/authCookie", () => {
  beforeEach(() => {
    clearAuthCookies();
    document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
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

  it("reads and clears both auth cookies while preserving the welcome cookie", () => {
    setAccessCookie("token-a", 120);
    setRefreshCookie("token-r", 240);
    setWelcomeCookie();

    expect(getAccessToken()).toBe("token-a");
    expect(getRefreshToken()).toBe("token-r");
    expect(getWelcomeSeen()).toBe(true);

    clearAuthCookies();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getWelcomeSeen()).toBe(true);
  });

  it("decodes JWT exp safely", () => {
    const token = makeJwt(1800000000);
    expect(decodeJwtExp(token)).toBe(1800000000);
    expect(decodeJwtExp("invalid")).toBeNull();
    expect(decodeJwtExp(null)).toBeNull();
  });
});
