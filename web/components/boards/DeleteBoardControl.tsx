"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { recordDelete } from "@/hooks/useBoardPatches";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { showSuccess } from "@/lib/toast";

export interface DeleteBoardControlProps {
  boardId: string;
  boardName: string;
}

/** Button and confirmation dialog for deleting a board from its toolbar. */
export function DeleteBoardControl({ boardId, boardName }: DeleteBoardControlProps) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCancel = () => {
    if (!busy) {
      setConfirmOpen(false);
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await apiRequest(`/api/boards/${boardId}`, { method: "DELETE" });
      recordDelete(boardId);
      showSuccess("Board deleted.");
      router.push("/");
    } catch (err) {
      setBusy(false);
      handleError(err);
    }
  };

  return (
    <>
      <BaseButton variant="destructive" onClick={() => setConfirmOpen(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        <span>Delete board</span>
      </BaseButton>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete board"
        message={`Delete "${boardName}"? Its columns, cards, and comments are deleted with it.`}
        confirmLabel="Delete board"
        busy={busy}
        onCancel={handleCancel}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </>
  );
}
