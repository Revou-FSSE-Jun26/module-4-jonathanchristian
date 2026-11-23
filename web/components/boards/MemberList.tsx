"use client";

import { Trash2 } from "lucide-react";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { ROLE_VARIANT } from "@/lib/roles";
import type { Member } from "@/lib/types";

export interface MemberListProps {
  members: Member[];
  currentUserId?: string;
  onRequestRemove: (member: Member) => void;
}

/** List of board members with role badges and remove controls for non-admin rows. */
export function MemberList({ members, currentUserId, onRequestRemove }: MemberListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => {
        const canRemove = member.role !== "admin" && currentUserId !== member.user_id;
        return (
          <li
            key={member.user_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{member.name}</p>
              <p className="text-xs text-ink-muted truncate">{member.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <BaseBadge variant={ROLE_VARIANT[member.role]}>{member.role}</BaseBadge>
              {canRemove ? (
                <BaseButton
                  variant="ghost"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => onRequestRemove(member)}
                  className="px-2"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </BaseButton>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
