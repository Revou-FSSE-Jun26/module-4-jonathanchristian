"use client";

import { useEffect, useState } from "react";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { showSuccess } from "@/lib/toast";
import type { BoardSummary } from "@/lib/types";
import { validateBoardName } from "@/lib/validation";

export interface RenameBoardModalProps {
  open: boolean;
  boardId: string;
  currentName: string;
  onClose: () => void;
  onRenamed: (board: BoardSummary) => void;
}

/** Modal dialog for renaming a board with client-side validation. */
export function RenameBoardModal({
  open,
  boardId,
  currentName,
  onClose,
  onRenamed,
}: RenameBoardModalProps) {
  const { handleError } = useErrorHandler();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
    }
  }, [open, currentName]);

  const handleClose = () => {
    if (!busy) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateBoardName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmed = name.trim();
    if (trimmed === currentName.trim()) {
      setError(null);
      onClose();
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const updated = await apiRequest<BoardSummary>(`/api/boards/${boardId}`, {
        method: "PATCH",
        body: { name: trimmed },
      });
      showSuccess("Board renamed.");
      onRenamed(updated);
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseModal open={open} onClose={handleClose} title="Rename board">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="rename-board-input" className="block text-sm font-medium text-ink mb-1">
            Board name
          </label>
          <input
            id="rename-board-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error ? "true" : undefined}
            className="w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-500 focus-visible:border-primary-500"
          />
          {error ? (
            <p role="alert" className="text-xs text-danger-ink mt-1">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <BaseButton variant="secondary" onClick={handleClose} disabled={busy}>
            Cancel
          </BaseButton>
          <BaseButton type="submit" disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
