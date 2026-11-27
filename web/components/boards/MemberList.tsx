"use client";

import { Trash2 } from "lucide-react";
import { useBoardRole } from "@/components/boards/BoardRoleContext";
import { RoleSelect } from "@/components/boards/RoleSelect";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { assignableRoles, canActOnMember, ROLE_VARIANT } from "@/lib/roles";
import type { Member, MemberRoleUpdate } from "@/lib/types";

export interface MemberListProps {
  members: Member[];
  currentUserId?: string;
  busyUserId?: string | null;
  onChangeRole: (member: Member, role: MemberRoleUpdate["role"]) => void;
  onRequestRemove: (member: Member) => void;
}

/** List of board members with role badges, role dropdowns, and remove controls gated by rank. */
export function MemberList({
  members,
  currentUserId,
  busyUserId = null,
  onChangeRole,
  onRequestRemove,
}: MemberListProps) {
  const { role: myRole } = useBoardRole();
  const allowedRoles = assignableRoles(myRole);

  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => {
        const canAct =
          currentUserId !== member.user_id && canActOnMember(myRole, member.role);
        return (
          <li
            key={member.user_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-3 min-w-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{member.name}</p>
              <p className="text-xs text-ink-muted truncate">{member.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <BaseBadge variant={ROLE_VARIANT[member.role]}>{member.role}</BaseBadge>
              {canAct ? (
                <>
                  <RoleSelect
                    memberName={member.name}
                    value={member.role}
                    allowedRoles={allowedRoles}
                    disabled={busyUserId === member.user_id}
                    onChange={(nextRole) => onChangeRole(member, nextRole)}
                  />
                  <BaseButton
                    variant="ghost"
                    aria-label={`Remove ${member.name}`}
                    disabled={busyUserId === member.user_id}
                    onClick={() => onRequestRemove(member)}
                    className="px-2"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </BaseButton>
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
