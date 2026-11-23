import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  isVisitorAuthenticated,
  logoTarget,
  type AuthStatus,
} from "@/lib/logoTarget";

const AUTH_STATUSES: AuthStatus[] = ["loading", "authenticated", "anonymous"];

describe("logoTarget (Task 34.1)", () => {
  // Feature: kano, Property 59: Logo target depends only on authentication
  it("Property 59: isVisitorAuthenticated and logoTarget depend only on AuthContext status and never return /login", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<AuthStatus>(...AUTH_STATUSES), {
          minLength: 1,
          maxLength: 20,
        }),
        (sequence) => {
          for (const status of sequence) {
            const isAuth = isVisitorAuthenticated(status);
            expect(isAuth).toBe(status === "authenticated");

            const target = logoTarget(isAuth);
            expect(target).toBe(status === "authenticated" ? "/" : "/welcome");
            expect(target).not.toBe("/login");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
