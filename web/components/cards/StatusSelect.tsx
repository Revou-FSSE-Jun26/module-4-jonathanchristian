"use client";

import { CARD_STATUSES, STATUS_LABEL } from "@/lib/status";
import type { CardStatus } from "@/lib/types";

export interface StatusSelectProps {
  value: CardStatus;
  onChange: (status: CardStatus) => void;
  disabled?: boolean;
  className?: string;
}

/** Native select for CardStatus with human-readable labels. */
export function StatusSelect({
  value,
  onChange,
  disabled = false,
  className = "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink disabled:bg-sunken disabled:text-ink-subtle disabled:cursor-not-allowed",
}: StatusSelectProps) {
  return (
    <div>
      <label htmlFor="card-status-select" className="block text-sm font-medium text-ink mb-1">
        Status
      </label>
      <select
        id="card-status-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as CardStatus)}
        className={className}
      >
        {CARD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABEL[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
