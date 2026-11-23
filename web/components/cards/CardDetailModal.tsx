"use client";

import { useState } from "react";
import { useBoardRole } from "@/components/boards/BoardRoleContext";
import { CardDetailForm } from "@/components/cards/CardDetailForm";
import { CommentList } from "@/components/comments/CommentList";
import { BaseModal } from "@/components/shared/BaseModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { diffCardFields, type CardEditableFields } from "@/lib/format";
import { showSuccess } from "@/lib/toast";
import type { Card, CardStatus, Member } from "@/lib/types";
import { validateCardTitle } from "@/lib/validation";

export interface CardDetailModalProps {
  card: Card | null;
  members: Member[];
  isNew?: boolean;
  onClose: () => void;
  onUpdated: (card: Card) => void;
  onDeleted: (cardId: string) => void;
}

/** Modal shell for viewing and editing a card's details, status, assignee, and comments. */
export function CardDetailModal({
  card,
  members,
  isNew = false,
  onClose,
  onUpdated,
  onDeleted,
}: CardDetailModalProps) {
  const { canEdit } = useBoardRole();
  const { handleError } = useErrorHandler();
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState(card?.due_date ?? "");
  const [labelsInput, setLabelsInput] = useState(card?.labels.join(", ") ?? "");
  const [assigneeId, setAssigneeId] = useState(card?.assignee?.user_id ?? "");
  const [status, setStatus] = useState<CardStatus>(card?.status ?? "NOT_STARTED");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  if (!card) {
    return null;
  }

  const readOnly = !canEdit;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      return;
    }
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
      status: card.status,
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
      status,
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
    if (readOnly) {
      return;
    }
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
        <CardDetailForm
          title={title}
          onTitleChange={setTitle}
          titleError={titleError}
          description={description}
          onDescriptionChange={setDescription}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          assigneeId={assigneeId}
          onAssigneeIdChange={setAssigneeId}
          status={status}
          onStatusChange={setStatus}
          labelsInput={labelsInput}
          onLabelsInputChange={setLabelsInput}
          members={members}
          readOnly={readOnly}
          busy={busy}
          isNew={isNew}
          onSubmit={(e) => {
            void handleSave(e);
          }}
          onCancel={onClose}
          onRequestDelete={() => setConfirmDeleteOpen(true)}
        />

        <CommentList cardId={card.card_id} readOnly={readOnly} />
      </BaseModal>

      {!readOnly ? (
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
      ) : null}
    </>
  );
}
