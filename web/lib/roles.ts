import type { BaseBadgeVariant } from "@/components/shared/BaseBadge";
import type { Role } from "./types";

export const ROLE_VARIANT: Record<Role, BaseBadgeVariant> = {
  admin: "blue",
  member: "gray",
  guest: "yellow",
};

/** Return true iff `role` can create, edit, move, or delete board content. */
export function canEdit(role: Role): boolean {
  return role === "admin" || role === "member";
}

/** Return true iff `role` is board admin. */
export function isAdmin(role: Role): boolean {
  return role === "admin";
}

/** Return true iff `role` is read-only board guest. */
export function isGuest(role: Role): boolean {
  return role === "guest";
}
