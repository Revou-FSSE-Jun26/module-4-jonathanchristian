"use client";

import type { MemberRoleUpdate, Role } from "@/lib/types";

export interface RoleSelectProps {
  memberName: string;
  value: Role;
  allowedRoles: Role[];
  disabled?: boolean;
  onChange: (role: MemberRoleUpdate["role"]) => void;
}

/** Role dropdown for changing a board member's role within the caller's assignable roles. */
export function RoleSelect({
  memberName,
  value,
  allowedRoles,
  disabled = false,
  onChange,
}: RoleSelectProps) {
  return (
    <select
      aria-label={`Role for ${memberName}`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as MemberRoleUpdate["role"])}
      className="min-h-[44px] rounded-md border border-field bg-surface px-2 text-sm text-ink disabled:bg-sunken disabled:text-ink-subtle disabled:cursor-not-allowed"
    >
      {allowedRoles.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}
