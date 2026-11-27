"use client";

import { useState } from "react";
import { BaseButton } from "@/components/shared/BaseButton";
import { validateChecklistText } from "@/lib/validation";

export interface AddChecklistFormProps {
  itemCount: number;
  onAdd: (text: string) => Promise<boolean>;
}

const MAX_CHECKLIST_ITEMS = 50;

/** Inline form for adding a checklist item, enforcing 1-200 char validation and the 50-item limit. */
export function AddChecklistForm({ itemCount, onAdd }: AddChecklistFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const atLimit = itemCount >= MAX_CHECKLIST_ITEMS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (atLimit || busy) {
      return;
    }
    const validationError = validateChecklistText(text);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setBusy(true);
    const ok = await onAdd(text.trim());
    setBusy(false);
    if (ok) {
      setText("");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      noValidate
      className="flex flex-col gap-1 pt-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="add-checklist-input" className="sr-only">
          Add checklist item
        </label>
        <input
          id="add-checklist-input"
          type="text"
          value={text}
          disabled={atLimit || busy}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item..."
          aria-invalid={error ? "true" : undefined}
          className="flex-1 min-w-0 min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle disabled:bg-sunken disabled:text-ink-subtle disabled:cursor-not-allowed"
        />
        <BaseButton type="submit" disabled={atLimit || busy}>
          {busy ? "Adding..." : "Add item"}
        </BaseButton>
      </div>
      {atLimit ? (
        <p className="text-xs text-ink-muted">Limit of 50 items reached</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      ) : null}
    </form>
  );
}
