import type { Role } from "./types";

export type InviteTokenRole = "member" | "guest";
export type AcceptAction = "create" | "upgrade" | "none";

export interface AcceptOutcome {
  role: Role;
  action: AcceptAction;
}

/**
 * Pure TypeScript twin of backend `resolve_accept(existing_role, token_role)`.
 * Accepting an invitation never lowers an existing active role.
 */
export function acceptOutcome(
  existingRole: Role | null,
  tokenRole: InviteTokenRole
): AcceptOutcome {
  if (existingRole === null) {
    return { role: tokenRole, action: "create" };
  }
  if (existingRole === "guest" && tokenRole === "member") {
    return { role: "member", action: "upgrade" };
  }
  return { role: existingRole, action: "none" };
}
