"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CommentList } from "@/components/comments/CommentList";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { diffCardFields, type CardEditableFields } from "@/lib/format";
import { showSuccess } from "@/lib/toast";
import type { Card, Member } from "@/lib/types";
import { validateCardTitle } from "@/lib/validation";

export interface CardDetailModalProps {
  card: Card | null;
  members: Member[];
  onClose: () => void;
  onUpdated: (card: Card) => void;
  onDeleted: (cardId: string) => void;
}

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle";

/** Modal for viewing and editing a card's details, assignee, and comments. */
export function CardDetailModal({
  card,
  members,
  onClose,
  onUpdated,
  onDeleted,
}: CardDetailModalProps) {
  const { handleError } = useErrorHandler();
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState(card?.due_date ?? "");
  const [labelsInput, setLabelsInput] = useState(card?.labels.join(", ") ?? "");
  const [assigneeId, setAssigneeId] = useState(card?.assignee?.user_id ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!card) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateCardTitle(title);
    if (validationError) {
      setTitleError(validationError);
      return;
    }

    const original: CardEditableFields = {
      title: card.title,
      description: card.description,
      due_date: card.due_date,
      labels: card.labels,
      assignee_id: card.assignee?.user_id ?? null,
    };

    const parsedLabels = labelsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const edited: CardEditableFields = {
      title: title.trim(),
      description: description.trim() === "" ? null : description.trim(),
      due_date: dueDate === "" ? null : dueDate,
      labels: parsedLabels,
      assignee_id: assigneeId === "" ? null : assigneeId,
    };

    const diff = diffCardFields(original, edited);
    if (Object.keys(diff).length === 0) {
      onClose();
      return;
    }

    setTitleError(null);
    setBusy(true);
    try {
      const updated = await apiRequest<Card>(`/api/cards/${card.card_id}`, {
        method: "PATCH",
        body: diff,
      });
      onUpdated(updated);
      showSuccess("Card updated.");
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiRequest<{ card_id: string }>(`/api/cards/${card.card_id}`, {
        method: "DELETE",
      });
      onDeleted(card.card_id);
      showSuccess("Card deleted.");
      setConfirmDeleteOpen(false);
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <BaseModal open={true} onClose={onClose} title="Card details" className="max-w-2xl">
        <form
          onSubmit={(e) => {
            void handleSave(e);
          }}
          noValidate
          className="flex flex-col gap-4"
        >
          <div>
            <label htmlFor="card-title-input" className="block text-sm font-medium text-ink mb-1">
              Title
            </label>
            <input
              id="card-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={titleError ? "true" : undefined}
              className={INPUT_CLASSES}
            />
            {titleError ? (
              <p role="alert" className="text-xs text-danger-ink mt-1">
                {titleError}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="card-desc-input" className="block text-sm font-medium text-ink mb-1">
              Description
            </label>
            <textarea
              id="card-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full min-h-[80px] rounded-md border border-field bg-surface p-3 text-sm text-ink"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-due-input" className="block text-sm font-medium text-ink mb-1">
                Due date
              </label>
              <input
                id="card-due-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label
                htmlFor="card-assignee-select"
                className="block text-sm font-medium text-ink mb-1"
              >
                Assignee
              </label>
              <select
                id="card-assignee-select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={INPUT_CLASSES}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="card-labels-input" className="block text-sm font-medium text-ink mb-1">
              Labels (comma separated)
            </label>
            <input
              id="card-labels-input"
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              placeholder="bug, frontend"
              className={INPUT_CLASSES}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <BaseButton
              variant="secondary"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={busy}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span>Delete card</span>
            </BaseButton>
            <div className="flex flex-wrap gap-2">
              <BaseButton variant="secondary" onClick={onClose} disabled={busy}>
                Cancel
              </BaseButton>
              <BaseButton type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </BaseButton>
            </div>
          </div>
        </form>

        <CommentList cardId={card.card_id} />
      </BaseModal>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete card"
        message={`Delete "${card.title}"? This cannot be undone.`}
        busy={busy}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </>
  );
}
