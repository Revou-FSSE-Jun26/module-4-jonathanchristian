import type { BaseBadgeVariant } from "@/components/shared/BaseBadge";
import type { Role } from "./types";

export const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  member: 1,
  manager: 2,
  admin: 3,
};

export type Action =
  | "view_board"
  | "edit_cards"
  | "manage_columns"
  | "manage_members"
  | "view_invite_links"
  | "change_roles"
  | "grant_manager"
  | "edit_board"
  | "delete_board"
  | "view_analytics";

const MIN_RANK: Record<Action, number> = {
  view_board: 0,
  edit_cards: 1,
  manage_columns: 2,
  manage_members: 2,
  view_invite_links: 2,
  change_roles: 2,
  grant_manager: 3,
  edit_board: 3,
  delete_board: 3,
  view_analytics: 3,
};

/** Return true iff `role` is permitted to perform `action` (UI gating only; API enforces). */
export function can(role: Role | null, action: Action): boolean {
  return role !== null && ROLE_RANK[role] >= MIN_RANK[action];
}

/** Return the list of roles that `role` may assign to other members. */
export function assignableRoles(role: Role | null): Role[] {
  if (role === "admin") {
    return ["guest", "member", "manager"];
  }
  if (role === "manager") {
    return ["guest", "member"];
  }
  return [];
}

/** Return true iff `role` may change the role of or remove a member with `targetRole`. */
export function canActOnMember(role: Role | null, targetRole: Role): boolean {
  return role !== null && can(role, "change_roles") && ROLE_RANK[role] > ROLE_RANK[targetRole];
}

export const ROLE_VARIANT: Record<Role, Extract<BaseBadgeVariant, "yellow" | "blue" | "green" | "gray">> = {
  admin: "yellow",
  manager: "blue",
  member: "green",
  guest: "gray",
};
