"use client";

import React from "react";
import { BaseButton } from "./BaseButton";
import { BaseModal } from "./BaseModal";

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation dialog for destructive actions such as deleting boards, columns, or cards. */
export function ConfirmDialog({
  open,
  title = "Confirm action",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <BaseModal open={open} onClose={onCancel} title={title} className="max-w-md">
      <p className="text-sm text-ink-muted mb-6">{message}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <BaseButton variant="secondary" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </BaseButton>
        <BaseButton variant="destructive" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </BaseButton>
      </div>
    </BaseModal>
  );
}
