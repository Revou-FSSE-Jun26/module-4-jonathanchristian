import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { acceptOutcome, type InviteTokenRole } from "@/lib/inviteRoles";
import {
  assignableRoles,
  can,
  canActOnMember,
  ROLE_RANK,
  ROLE_VARIANT,
  type Action,
} from "@/lib/roles";
import {
  CARD_STATUSES,
  isCardStatus,
  STATUS_LABEL,
  STATUS_STYLE,
} from "@/lib/status";
import type { Role } from "@/lib/types";

const ALL_ROLES: readonly Role[] = ["guest", "member", "manager", "admin"];
const ALL_ACTIONS: readonly Action[] = [
  "view_board",
  "edit_cards",
  "manage_columns",
  "manage_members",
  "view_invite_links",
  "change_roles",
  "grant_manager",
  "edit_board",
  "delete_board",
  "view_analytics",
];

// Independent specification of Requirement 43.3 & 43.13
function expectedCan(role: Role | null, action: Action): boolean {
  if (role === null) return false;
  switch (action) {
    case "view_board":
      return true;
    case "edit_cards":
      return role === "member" || role === "manager" || role === "admin";
    case "manage_columns":
    case "manage_members":
    case "view_invite_links":
    case "change_roles":
      return role === "manager" || role === "admin";
    case "grant_manager":
    case "edit_board":
    case "delete_board":
    case "view_analytics":
      return role === "admin";
  }
}

describe("status.ts, roles.ts, and inviteRoles.ts (V11)", () => {
  it("status helpers cover all four V11 statuses with distinct labels and styles", () => {
    expect(CARD_STATUSES).toEqual(["NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE"]);
    const labels = CARD_STATUSES.map((s) => STATUS_LABEL(s));
    const variants = CARD_STATUSES.map((s) => STATUS_STYLE[s].variant);
    expect(new Set(labels).size).toBe(4);
    expect(new Set(variants).size).toBe(4);

    for (const s of CARD_STATUSES) {
      expect(isCardStatus(s)).toBe(true);
    }
    expect(isCardStatus("done")).toBe(false);
    expect(isCardStatus("")).toBe(false);
    expect(isCardStatus(null)).toBe(false);
  });

  // Feature: kano, Property 74: Frontend can and role controls (pure part)
  it("Property 74 (pure): can(role, action), assignableRoles, canActOnMember, and ROLE_VARIANT match Requirement 43", () => {
    for (const role of [...ALL_ROLES, null] as const) {
      for (const action of ALL_ACTIONS) {
        expect(can(role, action)).toBe(expectedCan(role, action));
      }
    }

    expect(assignableRoles("admin")).toEqual(["guest", "member", "manager"]);
    expect(assignableRoles("manager")).toEqual(["guest", "member"]);
    expect(assignableRoles("member")).toEqual([]);
    expect(assignableRoles("guest")).toEqual([]);
    expect(assignableRoles(null)).toEqual([]);

    for (const actor of [...ALL_ROLES, null] as const) {
      for (const target of ALL_ROLES) {
        const expected =
          actor !== null &&
          (actor === "admin" || actor === "manager") &&
          ROLE_RANK[actor] > ROLE_RANK[target];
        expect(canActOnMember(actor, target)).toBe(expected);
      }
    }

    expect(new Set(ALL_ROLES.map((r) => ROLE_VARIANT[r])).size).toBe(4);
  });

  it("Property 50 (TypeScript twin): acceptOutcome matches Python resolve_accept and never lowers a role", () => {
    const RANK: Record<Role, number> = { guest: 0, member: 1, manager: 2, admin: 3 };
    const existingArb = fc.constantFrom<Role | null>(null, "guest", "member", "manager", "admin");
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
