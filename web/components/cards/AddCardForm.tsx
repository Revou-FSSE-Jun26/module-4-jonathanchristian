"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useBoardRole } from "@/components/boards/BoardRoleContext";
import { BaseButton } from "@/components/shared/BaseButton";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { Card } from "@/lib/types";
import { validateCardTitle } from "@/lib/validation";

export interface AddCardFormProps {
  columnId: string;
  onAdded: (card: Card) => void;
}

/** Inline form in a column footer for creating a new card. */
export function AddCardForm({ columnId, onAdded }: AddCardFormProps) {
  const { canEdit } = useBoardRole();
  const { handleError } = useErrorHandler();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!canEdit) {
    return null;
  }

  if (!open) {
    return (
      <BaseButton
        variant="ghost"
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        <Plus className="size-4" aria-hidden="true" />
        <span>Add a card</span>
      </BaseButton>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateCardTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const created = await apiRequest<Card>(`/api/columns/${columnId}/cards`, {
        method: "POST",
        body: { title: title.trim() },
      });
      onAdded(created);
      setTitle("");
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
      className="flex flex-col gap-2 pt-1"
    >
      <label htmlFor={`add-card-${columnId}`} className="sr-only">
        Card title
      </label>
      <input
        id={`add-card-${columnId}`}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for this card..."
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
          {busy ? "Adding..." : "Add card"}
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
