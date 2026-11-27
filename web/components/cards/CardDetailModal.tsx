"use client";

import { useEffect, useState } from "react";
import { useBoardRole } from "@/components/boards/BoardRoleContext";
import { CardDetailForm } from "@/components/cards/CardDetailForm";
import { ChecklistSection } from "@/components/cards/ChecklistSection";
import { LinksSection } from "@/components/cards/LinksSection";
import { CommentList } from "@/components/comments/CommentList";
import { BaseModal } from "@/components/shared/BaseModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { cn } from "@/lib/cn";
import { diffCardFields, type CardEditableFields } from "@/lib/format";
import { LABEL_CLASS, labelColor } from "@/lib/labelColor";
import { showSuccess } from "@/lib/toast";
import type {
  BoardCard,
  Card,
  CardDetail,
  CardLink,
  CardStatus,
  ChecklistItem,
  Member,
} from "@/lib/types";
import { validateCardTitle } from "@/lib/validation";

export interface CardCounts {
  checklist_done: number;
  checklist_total: number;
  link_count: number;
}

export interface CardDetailModalProps {
  card: BoardCard | Card | null;
  members: Member[];
  isNew?: boolean;
  onClose: () => void;
  onUpdated: (card: BoardCard | Card) => void;
  onCountsChanged?: (cardId: string, counts: CardCounts) => void;
  onDeleted: (cardId: string) => void;
}

/** Modal shell for viewing and editing a card's details, status, assignee, checklist, links, and comments. */
export function CardDetailModal({
  card,
  members,
  isNew = false,
  onClose,
  onUpdated,
  onCountsChanged,
  onDeleted,
}: CardDetailModalProps) {
  const { can } = useBoardRole();
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

  const [detailLoading, setDetailLoading] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [links, setLinks] = useState<CardLink[]>([]);
  const [counts, setCounts] = useState<CardCounts>({
    checklist_done: card && "checklist_done" in card ? card.checklist_done : 0,
    checklist_total: card && "checklist_total" in card ? card.checklist_total : 0,
    link_count: card && "link_count" in card ? card.link_count : 0,
  });

  useEffect(() => {
    if (!card) {
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    apiRequest<CardDetail>(`/api/cards/${card.card_id}`)
      .then((detail) => {
        if (!cancelled) {
          setChecklist(detail.checklist ?? []);
          setLinks(detail.links ?? []);
          setCounts({
            checklist_done: detail.checklist_done ?? 0,
            checklist_total: detail.checklist_total ?? 0,
            link_count: detail.link_count ?? 0,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          handleError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [card?.card_id, handleError]);

  if (!card) {
    return null;
  }

  const readOnly = !can("edit_cards");

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
      const updated = await apiRequest<BoardCard>(`/api/cards/${card.card_id}`, {
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

  const handleChecklistCountsChange = (done: number, total: number) => {
    const next = { ...counts, checklist_done: done, checklist_total: total };
    setCounts(next);
    onCountsChanged?.(card.card_id, next);
  };

  const handleLinksCountChange = (linkCount: number) => {
    const next = { ...counts, link_count: linkCount };
    setCounts(next);
    onCountsChanged?.(card.card_id, next);
  };

  return (
    <>
      <BaseModal open={true} onClose={onClose} title="Card details" className="max-w-2xl">
        {card.labels.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-4">
            {card.labels.map((label) => (
              <span
                key={label}
                className={cn(
                  "inline-flex items-center h-5 px-2 rounded-sm text-xs font-medium",
                  LABEL_CLASS[labelColor(label)]
                )}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}

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

        <ChecklistSection
          cardId={card.card_id}
          initialItems={checklist}
          loading={detailLoading}
          readOnly={readOnly}
          onCountsChange={handleChecklistCountsChange}
        />

        <LinksSection
          cardId={card.card_id}
          initialLinks={links}
          loading={detailLoading}
          readOnly={readOnly}
          onCountChange={handleLinksCountChange}
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
