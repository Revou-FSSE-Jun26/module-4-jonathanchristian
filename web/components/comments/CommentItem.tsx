"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { Comment } from "@/lib/types";
import { validateCommentText } from "@/lib/validation";

export interface CommentItemProps {
  comment: Comment;
  isOwner: boolean;
  onUpdated: (comment: Comment) => void;
  onDeleted: (commentId: string) => void;
}

/** Single comment row showing edit and delete controls only to its author. */
export function CommentItem({ comment, isOwner, onUpdated, onDeleted }: CommentItemProps) {
  const { handleError } = useErrorHandler();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateCommentText(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const updated = await apiRequest<Comment>(`/api/comments/${comment.comment_id}`, {
        method: "PATCH",
        body: { content: draft.trim() },
      });
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiRequest<{ comment_id: string }>(`/api/comments/${comment.comment_id}`, {
        method: "DELETE",
      });
      onDeleted(comment.comment_id);
      setConfirmOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-md border border-line bg-surface p-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-ink-muted">
          <span className="font-medium text-ink">{comment.author.name}</span> ·{" "}
          <span>{new Date(comment.created_at).toLocaleString()}</span>
        </div>
        {isOwner && !editing ? (
          <div className="flex items-center gap-1">
            <BaseButton
              variant="ghost"
              aria-label="Edit comment"
              onClick={() => {
                setDraft(comment.content);
                setEditing(true);
              }}
              className="px-2"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              aria-label="Delete comment"
              onClick={() => setConfirmOpen(true)}
              className="px-2"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </BaseButton>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            void handleSave(e);
          }}
          noValidate
          className="flex flex-col gap-2"
        >
          <textarea
            aria-label="Edit comment text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full min-h-[80px] rounded-md border border-field bg-surface p-2 text-sm text-ink"
          />
          {error ? (
            <p role="alert" className="text-xs text-danger-ink">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <BaseButton type="submit" disabled={busy}>
              Save
            </BaseButton>
            <BaseButton
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setDraft(comment.content);
                setError(null);
              }}
            >
              Cancel
            </BaseButton>
          </div>
        </form>
      ) : (
        <p className="text-sm text-ink whitespace-pre-wrap break-words">{comment.content}</p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete comment"
        message="Delete this comment? This cannot be undone."
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </li>
  );
}
