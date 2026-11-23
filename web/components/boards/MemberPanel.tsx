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
import type { Member } from "@/lib/types";

export interface MemberPanelProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  members: Member[];
  onMembersChange: (members: Member[]) => void;
}

/** Admin-only member management modal for listing, adding, removing members, and invite links. */
export function MemberPanel({
  open,
  onClose,
  boardId,
  members,
  onMembersChange,
}: MemberPanelProps) {
  const { isAdmin } = useBoardRole();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [busy, setBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Member | null>(null);

  if (!isAdmin) {
    return null;
  }

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
          onRequestRemove={(member) => setConfirmTarget(member)}
        />

        {open ? <InviteLinksPanel boardId={boardId} /> : null}
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
