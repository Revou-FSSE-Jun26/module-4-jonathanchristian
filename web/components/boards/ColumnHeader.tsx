"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { validateColumnName } from "@/lib/validation";
import type { Column } from "@/lib/types";

export interface ColumnHeaderProps {
  column: Column;
  onRename?: (columnId: string, newName: string) => Promise<boolean>;
  onDelete?: (columnId: string) => Promise<void>;
}

/** Column header showing name, card count, and inline rename / delete controls. */
export function ColumnHeader({ column, onRename, onDelete }: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(column.name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateColumnName(draftName);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!onRename) {
      setEditing(false);
      return;
    }
    setError(null);
    setBusy(true);
    const ok = await onRename(column.column_id, draftName.trim());
    setBusy(false);
    if (ok) {
      setEditing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) {
      setConfirmOpen(false);
      return;
    }
    setBusy(true);
    await onDelete(column.column_id);
    setBusy(false);
    setConfirmOpen(false);
  };

  return (
    <div className="px-2 py-1">
      {editing ? (
        <form
          onSubmit={(e) => {
            void handleRenameSubmit(e);
          }}
          noValidate
          className="flex flex-col gap-2"
        >
          <input
            type="text"
            aria-label="Column name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="w-full min-h-[44px] rounded-md border border-field bg-surface px-2 text-sm text-ink"
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
                setDraftName(column.name);
                setError(null);
              }}
            >
              Cancel
            </BaseButton>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-semibold text-ink truncate">{column.name}</h2>
            <span className="text-xs text-ink-muted bg-surface rounded-full px-2 py-0.5 shrink-0">
              {column.cards.length}
            </span>
          </div>
          {onRename || onDelete ? (
            <div className="flex items-center gap-1 shrink-0">
              {onRename ? (
                <BaseButton
                  variant="ghost"
                  aria-label={`Rename ${column.name}`}
                  onClick={() => {
                    setDraftName(column.name);
                    setEditing(true);
                  }}
                  className="px-2"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </BaseButton>
              ) : null}
              {onDelete ? (
                <BaseButton
                  variant="ghost"
                  aria-label={`Delete ${column.name}`}
                  onClick={() => setConfirmOpen(true)}
                  className="px-2"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </BaseButton>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete column"
        message={`Delete "${column.name}" and all its cards? This cannot be undone.`}
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
