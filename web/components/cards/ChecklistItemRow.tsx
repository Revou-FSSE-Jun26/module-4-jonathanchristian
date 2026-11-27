"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { cn } from "@/lib/cn";
import type { ChecklistItem } from "@/lib/types";
import { validateChecklistText } from "@/lib/validation";

export interface ChecklistItemRowProps {
  item: ChecklistItem;
  readOnly: boolean;
  onToggle: (item: ChecklistItem) => void;
  onEdit: (item: ChecklistItem, text: string) => Promise<boolean>;
  onDelete: (item: ChecklistItem) => Promise<boolean>;
}

/** Single checklist row with checkbox, inline edit, and delete control. */
export function ChecklistItemRow({
  item,
  readOnly,
  onToggle,
  onEdit,
  onDelete,
}: ChecklistItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const commitEdit = async () => {
    const trimmed = draft.trim();
    const validationError = validateChecklistText(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (trimmed === item.text) {
      setEditing(false);
      setError(null);
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await onEdit(item, trimmed);
    setBusy(false);
    if (ok) {
      setEditing(false);
    }
  };

  return (
    <li className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2 min-h-[44px] min-w-0">
        <label className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={item.is_done}
            disabled={readOnly}
            aria-label={`Toggle ${item.text}`}
            onChange={() => onToggle(item)}
            className="size-4 rounded-sm border border-field bg-surface accent-primary-500 disabled:cursor-not-allowed"
          />
        </label>

        {editing && !readOnly ? (
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <input
              type="text"
              aria-label={`Edit ${item.text}`}
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void commitEdit();
                } else if (e.key === "Escape") {
                  setEditing(false);
                  setDraft(item.text);
                  setError(null);
                }
              }}
              onBlur={() => {
                void commitEdit();
              }}
              className="w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink"
            />
          </div>
        ) : (
          <span
            className={cn(
              "flex-1 text-sm break-words min-w-0",
              item.is_done ? "text-ink-muted line-through" : "text-ink"
            )}
          >
            {item.text}
          </span>
        )}

        {!readOnly && !editing ? (
          <div className="flex items-center gap-1 shrink-0">
            <BaseButton
              variant="ghost"
              aria-label={`Edit ${item.text}`}
              onClick={() => {
                setDraft(item.text);
                setError(null);
                setEditing(true);
              }}
              className="px-2"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </BaseButton>
            <BaseButton
              variant="ghost"
              aria-label={`Delete ${item.text}`}
              onClick={() => {
                void onDelete(item);
              }}
              className="px-2"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </BaseButton>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger-ink pl-11">
          {error}
        </p>
      ) : null}
    </li>
  );
}
