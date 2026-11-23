import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { acceptOutcome, type InviteTokenRole } from "@/lib/inviteRoles";
import { canEdit, isAdmin, isGuest, ROLE_VARIANT } from "@/lib/roles";
import {
  CARD_STATUSES,
  isCardStatus,
  STATUS_LABEL,
  STATUS_VARIANT,
} from "@/lib/status";
import type { Role } from "@/lib/types";

describe("status.ts, roles.ts, and inviteRoles.ts", () => {
  it("Property 56 (labels & variants): status labels and variants are pairwise distinct", () => {
    expect(CARD_STATUSES).toEqual(["NOT_STARTED", "IN_PROGRESS", "DONE"]);
    expect(STATUS_LABEL).toEqual({
      NOT_STARTED: "Not started",
      IN_PROGRESS: "In progress",
      DONE: "Done",
    });

    const labels = CARD_STATUSES.map((s) => STATUS_LABEL[s]);
    const variants = CARD_STATUSES.map((s) => STATUS_VARIANT[s]);
    expect(new Set(labels).size).toBe(3);
    expect(new Set(variants).size).toBe(3);

    for (const s of CARD_STATUSES) {
      expect(isCardStatus(s)).toBe(true);
    }
    expect(isCardStatus("done")).toBe(false);
    expect(isCardStatus("")).toBe(false);
    expect(isCardStatus(null)).toBe(false);
  });

  it("roles.ts helpers accurately classify admin, member, and guest", () => {
    const roles: Role[] = ["admin", "member", "guest"];
    expect(roles.map(canEdit)).toEqual([true, true, false]);
    expect(roles.map(isAdmin)).toEqual([true, false, false]);
    expect(roles.map(isGuest)).toEqual([false, false, true]);
    expect(new Set(roles.map((r) => ROLE_VARIANT[r])).size).toBe(3);
  });

  it("Property 50 (TypeScript twin): acceptOutcome matches Python resolve_accept and never lowers a role", () => {
    const RANK: Record<Role, number> = { guest: 1, member: 2, admin: 3 };
    const existingArb = fc.constantFrom<Role | null>(null, "guest", "member", "admin");
    const tokenArb = fc.constantFrom<InviteTokenRole>("member", "guest");

    fc.assert(
      fc.property(existingArb, tokenArb, (existing, tokenRole) => {
        const res = acceptOutcome(existing, tokenRole);
        if (existing === null) {
          expect(res).toEqual({ role: tokenRole, action: "create" });
        } else if (existing === "guest" && tokenRole === "member") {
          expect(res).toEqual({ role: "member", action: "upgrade" });
        } else {
          expect(res).toEqual({ role: existing, action: "none" });
        }

        if (existing !== null) {
          expect(RANK[res.role]).toBeGreaterThanOrEqual(RANK[existing]);
        }
        if (existing === "admin") {
          expect(res.role).toBe("admin");
        }
      }),
      { numRuns: 100 }
    );
  });
});
