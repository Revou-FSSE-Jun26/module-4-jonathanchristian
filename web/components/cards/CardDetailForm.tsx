"use client";

import { Trash2 } from "lucide-react";
import { StatusSelect } from "@/components/cards/StatusSelect";
import { BaseButton } from "@/components/shared/BaseButton";
import type { CardStatus, Member } from "@/lib/types";

export interface CardDetailFormProps {
  title: string;
  onTitleChange: (value: string) => void;
  titleError: string | null;
  description: string;
  onDescriptionChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  assigneeId: string;
  onAssigneeIdChange: (value: string) => void;
  status: CardStatus;
  onStatusChange: (value: CardStatus) => void;
  labelsInput: string;
  onLabelsInputChange: (value: string) => void;
  members: Member[];
  readOnly: boolean;
  busy: boolean;
  isNew: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onRequestDelete: () => void;
}

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle disabled:bg-sunken disabled:text-ink-subtle disabled:cursor-not-allowed";

/** Form fields and actions inside CardDetailModal, supporting editable and guest read-only modes. */
export function CardDetailForm({
  title,
  onTitleChange,
  titleError,
  description,
  onDescriptionChange,
  dueDate,
  onDueDateChange,
  assigneeId,
  onAssigneeIdChange,
  status,
  onStatusChange,
  labelsInput,
  onLabelsInputChange,
  members,
  readOnly,
  busy,
  isNew,
  onSubmit,
  onCancel,
  onRequestDelete,
}: CardDetailFormProps) {
  const assignableMembers = members.filter((m) => m.role !== "guest");

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="card-title-input" className="block text-sm font-medium text-ink mb-1">
          Title
        </label>
        <input
          id="card-title-input"
          type="text"
          value={title}
          disabled={readOnly}
          onChange={(e) => onTitleChange(e.target.value)}
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
          disabled={readOnly}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="w-full min-h-[80px] rounded-md border border-field bg-surface p-3 text-sm text-ink disabled:bg-sunken disabled:text-ink-subtle disabled:cursor-not-allowed"
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
            disabled={readOnly}
            onChange={(e) => onDueDateChange(e.target.value)}
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
            disabled={readOnly}
            onChange={(e) => onAssigneeIdChange(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="">Unassigned</option>
            {assignableMembers.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatusSelect value={status} onChange={onStatusChange} disabled={readOnly} />

        <div>
          <label htmlFor="card-labels-input" className="block text-sm font-medium text-ink mb-1">
            Labels (comma separated)
          </label>
          <input
            id="card-labels-input"
            type="text"
            value={labelsInput}
            disabled={readOnly}
            onChange={(e) => onLabelsInputChange(e.target.value)}
            placeholder="bug, frontend"
            className={INPUT_CLASSES}
          />
        </div>
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {!isNew ? (
            <BaseButton variant="secondary" onClick={onRequestDelete} disabled={busy}>
              <Trash2 className="size-4" aria-hidden="true" />
              <span>Delete card</span>
            </BaseButton>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            <BaseButton variant="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </BaseButton>
            <BaseButton type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save changes"}
            </BaseButton>
          </div>
        </div>
      ) : null}
    </form>
  );
}
