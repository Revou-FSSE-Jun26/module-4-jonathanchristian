import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { safeNext, withNext } from "@/lib/nextParam";

const URL_SAFE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const urlSafeTokenArb = fc
  .array(fc.constantFrom(...URL_SAFE_CHARS.split("")), { minLength: 1, maxLength: 128 })
  .map((chars) => chars.join(""));

describe("safeNext and withNext (Property 52)", () => {
  it("accepts any valid /invite/<1..128 URL-safe token> path", () => {
    fc.assert(
      fc.property(urlSafeTokenArb, (token) => {
        const path = `/invite/${token}`;
        expect(safeNext(path)).toBe(path);
        expect(safeNext(path) ?? "/").toBe(path);
      }),
      { numRuns: 150 }
    );
  });

  it("rejects absolute URLs, protocol-relative URLs, backslashes, extra slashes, queries, fragments, percent encodings, whitespace, and other paths", () => {
    fc.assert(
      fc.property(urlSafeTokenArb, (token) => {
        const invalidCandidates = [
          `https://evil.test/invite/${token}`,
          `http://evil.test/invite/${token}`,
          `//evil.test/invite/${token}`,
          `\\invite\\${token}`,
          `/invite/${token}/extra`,
          `/invite//${token}`,
          `/invite/${token}?foo=bar`,
          `/invite/${token}#frag`,
          `/invite/%2e%2e/${token}`,
          `/invite/${token} `,
          ` /invite/${token}`,
          `/boards/${token}`,
          `/`,
          `/welcome`,
          `/login`,
          `/invite/`,
          `/invite/${"a".repeat(129)}`,
          "",
          null,
          undefined,
          123,
        ];
        for (const candidate of invalidCandidates) {
          expect(safeNext(candidate)).toBeNull();
          expect(safeNext(candidate) ?? "/").toBe("/");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("withNext encodes valid next targets and omits query when null", () => {
    expect(withNext("/login", "/invite/abc_123")).toBe("/login?next=%2Finvite%2Fabc_123");
    expect(withNext("/register", "/invite/abc_123")).toBe("/register?next=%2Finvite%2Fabc_123");
    expect(withNext("/login", null)).toBe("/login");
    expect(withNext("/register", null)).toBe("/register");
  });
});
