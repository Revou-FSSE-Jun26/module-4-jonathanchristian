"use client";

import { useState } from "react";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { showSuccess } from "@/lib/toast";
import type { BoardSummary } from "@/lib/types";
import { validateBoardName } from "@/lib/validation";

export interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (board: BoardSummary) => void;
}

/** Modal dialog for creating a new board with client-side name validation. */
export function CreateBoardModal({ open, onClose, onCreated }: CreateBoardModalProps) {
  const { handleError } = useErrorHandler();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateBoardName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const board = await apiRequest<BoardSummary>("/api/boards", {
        method: "POST",
        body: { name: name.trim() },
      });
      setName("");
      showSuccess("Board created.");
      onCreated(board);
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} title="Create board">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="board-name-input" className="block text-sm font-medium text-ink mb-1">
            Board name
          </label>
          <input
            id="board-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product roadmap"
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
          <BaseButton variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </BaseButton>
          <BaseButton type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create board"}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
}
