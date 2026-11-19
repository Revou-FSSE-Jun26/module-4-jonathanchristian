"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { BaseButton } from "./BaseButton";

export interface ErrorPanelProps {
  message: string;
  onRetry?: () => void;
}

/** Inline error banner with an optional retry button. */
export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-line bg-danger-soft text-danger-ink p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex items-start gap-2 text-sm">
        <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onRetry ? (
        <BaseButton variant="secondary" onClick={onRetry} className="shrink-0">
          Retry
        </BaseButton>
      ) : null}
    </div>
  );
}
