"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { showSuccess } from "@/lib/toast";
import type { Member } from "@/lib/types";
import { validateEmail } from "@/lib/validation";

export interface MemberPanelProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  members: Member[];
  onMembersChange: (members: Member[]) => void;
}

/** Admin-only member management modal for listing, adding, and removing board members. */
export function MemberPanel({
  open,
  onClose,
  boardId,
  members,
  onMembersChange,
}: MemberPanelProps) {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Member | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    setFieldError(null);
    setBusy(true);
    try {
      const added = await apiRequest<Member>(`/api/boards/${boardId}/members`, {
        method: "POST",
        body: { email: email.trim() },
      });
      onMembersChange([...members, added]);
      setEmail("");
      showSuccess(`Added ${added.name}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 404) {
          setFieldError("No user found with that email.");
        } else if (err.statusCode === 409) {
          setFieldError("User is already a member of this board.");
        } else if (err.statusCode === 400) {
          setFieldError(err.message);
        } else {
          handleError(err);
        }
      } else {
        handleError(err);
      }
    } finally {
      setBusy(false);
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
      <BaseModal open={open} onClose={onClose} title="Board members">
        <form
          onSubmit={(e) => {
            void handleAdd(e);
          }}
          noValidate
          className="flex flex-col gap-2 mb-6"
        >
          <label htmlFor="member-email-input" className="text-sm font-medium text-ink">
            Add member by email
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              id="member-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle"
            />
            <BaseButton type="submit" disabled={busy}>
              <UserPlus className="size-4" aria-hidden="true" />
              <span>Add member</span>
            </BaseButton>
          </div>
          {fieldError ? (
            <p role="alert" className="text-xs text-danger-ink">
              {fieldError}
            </p>
          ) : null}
        </form>

        <ul className="flex flex-col gap-2">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{member.name}</p>
                <p className="text-xs text-ink-muted truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <BaseBadge variant={member.role === "admin" ? "blue" : "gray"}>
                  {member.role}
                </BaseBadge>
                {user?.user_id !== member.user_id ? (
                  <BaseButton
                    variant="ghost"
                    aria-label={`Remove ${member.name}`}
                    onClick={() => setConfirmTarget(member)}
                    className="px-2"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </BaseButton>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
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
