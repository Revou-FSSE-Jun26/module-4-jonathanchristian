"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { Column } from "@/lib/types";
import { validateColumnName } from "@/lib/validation";

export interface AddColumnFormProps {
  boardId: string;
  onAdded: (column: Column) => void;
}

/** Inline form for adding a new column to a board. */
export function AddColumnForm({ boardId, onAdded }: AddColumnFormProps) {
  const { handleError } = useErrorHandler();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <div className="w-72 min-w-[240px] shrink-0">
        <BaseButton
          variant="secondary"
          onClick={() => setOpen(true)}
          className="w-full justify-start"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Add column</span>
        </BaseButton>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateColumnName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const created = await apiRequest<Column>(`/api/boards/${boardId}/columns`, {
        method: "POST",
        body: { name: name.trim() },
      });
      onAdded({ ...created, cards: created.cards ?? [] });
      setName("");
      setOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      noValidate
      className="w-72 min-w-[240px] shrink-0 rounded-lg bg-sunken p-3 flex flex-col gap-2"
    >
      <label htmlFor="new-column-name" className="text-sm font-medium text-ink">
        Column name
      </label>
      <input
        id="new-column-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="In Progress"
        aria-invalid={error ? "true" : undefined}
        className="w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle"
      />
      {error ? (
        <p role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <BaseButton type="submit" disabled={busy}>
          {busy ? "Adding..." : "Add column"}
        </BaseButton>
        <BaseButton
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </BaseButton>
      </div>
    </form>
  );
}
