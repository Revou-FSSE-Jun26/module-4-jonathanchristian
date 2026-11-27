"use client";

import { useState } from "react";
import { AddMemberForm } from "@/components/boards/AddMemberForm";
import { useBoardRole } from "@/components/boards/BoardRoleContext";
import { InviteLinksPanel } from "@/components/boards/InviteLinksPanel";
import { MemberList } from "@/components/boards/MemberList";
import { BaseModal } from "@/components/shared/BaseModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { showSuccess } from "@/lib/toast";
import type { Member, MemberRoleUpdate } from "@/lib/types";

export interface MemberPanelProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  members: Member[];
  onMembersChange: (members: Member[]) => void;
  onMemberDemotedToGuest?: (userId: string) => void;
}

/** Member management modal for listing, adding, changing roles, removing members, and invite links. */
export function MemberPanel({
  open,
  onClose,
  boardId,
  members,
  onMembersChange,
  onMemberDemotedToGuest,
}: MemberPanelProps) {
  const { can } = useBoardRole();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [busy, setBusy] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Member | null>(null);

  if (!can("manage_members")) {
    return null;
  }

  const handleRoleChange = async (member: Member, nextRole: MemberRoleUpdate["role"]) => {
    if (nextRole === member.role) {
      return;
    }
    setBusyUserId(member.user_id);
    try {
      const updated = await apiRequest<Member>(
        `/api/boards/${boardId}/members/${member.user_id}`,
        { method: "PATCH", body: { role: nextRole } }
      );
      onMembersChange(
        members.map((m) => (m.user_id === member.user_id ? updated : m))
      );
      if (updated.role === "guest") {
        onMemberDemotedToGuest?.(member.user_id);
      }
      showSuccess(`Updated ${member.name}'s role to ${updated.role}.`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = async () => {
    if (!confirmTarget) {
      return;
    }
    setBusy(true);
    try {
      await apiRequest<{ user_id: string }>(
        `/api/boards/${boardId}/members/${confirmTarget.user_id}`,
        { method: "DELETE" }
      );
      onMembersChange(members.filter((m) => m.user_id !== confirmTarget.user_id));
      showSuccess(`Removed ${confirmTarget.name}.`);
      setConfirmTarget(null);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BaseModal open={open} onClose={onClose} title="Board members" className="max-w-2xl">
        <AddMemberForm
          boardId={boardId}
          onAdded={(added) => onMembersChange([...members, added])}
        />

        <MemberList
          members={members}
          currentUserId={user?.user_id}
          busyUserId={busyUserId}
          onChangeRole={(member, role) => {
            void handleRoleChange(member, role);
          }}
          onRequestRemove={(member) => setConfirmTarget(member)}
        />

        {open && can("view_invite_links") ? <InviteLinksPanel boardId={boardId} /> : null}
      </BaseModal>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Remove member"
        message={
          confirmTarget
            ? `Remove ${confirmTarget.name} from this board? Their card assignments will be cleared.`
            : ""
        }
        confirmLabel="Remove"
        busy={busy}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          void handleRemove();
        }}
      />
    </>
  );
}
