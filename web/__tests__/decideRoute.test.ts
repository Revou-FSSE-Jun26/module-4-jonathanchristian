import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { classifyPath, decideRoute, type AuthState } from "@/lib/decideRoute";

const URL_SAFE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const inviteTokenArb = fc
  .array(fc.constantFrom(...URL_SAFE_CHARS.split("")), { minLength: 1, maxLength: 128 })
  .map((c) => c.join(""));

describe("lib/decideRoute (Property 53)", () => {
  it("Property 53: covers all combinations of path class, auth state, and welcomeSeen", () => {
    const fixedPathArb = fc.constantFrom(
      "/",
      "/welcome",
      "/login",
      "/register",
      "/boards/b1",
      "/my-tasks",
      "/profile",
      "/invite/",
      "/invite/bad/slash",
      `/invite/${"a".repeat(129)}`
    );
    const pathArb = fc.oneof(
      fixedPathArb,
      inviteTokenArb.map((t) => `/invite/${t}`)
    );
    const authArb = fc.constantFrom<AuthState>("authenticated", "refreshable", "unauthenticated");

    fc.assert(
      fc.property(pathArb, authArb, fc.boolean(), (pathname, auth, welcomeSeen) => {
        const pathClass = classifyPath(pathname);
        const decision = decideRoute({ pathname, auth, welcomeSeen });

        if (pathClass === "root") {
          if (auth === "authenticated") {
            expect(decision).toEqual({ kind: "continue" });
          } else if (auth === "refreshable") {
            expect(decision).toEqual({ kind: "refresh-then-continue" });
          } else {
            expect(decision).toEqual({
              kind: "redirect",
              to: welcomeSeen ? "/login" : "/welcome",
            });
          }
          return;
        }

        if (pathClass === "welcome") {
          if (auth === "unauthenticated") {
            expect(decision).toEqual({ kind: "continue" });
          } else {
            expect(decision).toEqual({ kind: "redirect", to: "/" });
          }
          return;
        }

        if (pathClass === "login" || pathClass === "register") {
          if (auth === "unauthenticated") {
            expect(decision).toEqual(
              welcomeSeen ? { kind: "continue" } : { kind: "continue", setWelcomeCookie: true }
            );
          } else {
            expect(decision).toEqual({ kind: "redirect", to: "/" });
          }
          return;
        }

        if (pathClass === "invite") {
          if (auth === "authenticated") {
            expect(decision).toEqual({ kind: "continue" });
          } else if (auth === "refreshable") {
            expect(decision).toEqual({ kind: "refresh-then-continue" });
          } else {
            expect(decision).toEqual({
              kind: "redirect",
              to: `/login?next=${encodeURIComponent(pathname)}`,
            });
          }
          return;
        }

        // protected (including malformed invite paths)
        if (auth === "authenticated") {
          expect(decision).toEqual({ kind: "continue" });
        } else if (auth === "refreshable") {
          expect(decision).toEqual({ kind: "refresh-then-continue" });
        } else {
          expect(decision).toEqual({ kind: "redirect", to: "/login" });
        }
      }),
      { numRuns: 300 }
    );
  });
});
