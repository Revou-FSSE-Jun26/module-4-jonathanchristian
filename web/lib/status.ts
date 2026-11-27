import type { BaseBadgeVariant } from "@/components/shared/BaseBadge";
import type { CardStatus } from "./types";

export const CARD_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE"] as const;
export type { CardStatus };

export interface StatusStyleEntry {
  label: string;
  variant: Extract<BaseBadgeVariant, "gray" | "blue" | "red" | "green">;
  className: string;
}

export const STATUS_STYLE: Record<CardStatus, StatusStyleEntry> = {
  NOT_STARTED: {
    label: "Not started",
    variant: "gray",
    className: "bg-sunken text-ink-muted",
  },
  IN_PROGRESS: {
    label: "In progress",
    variant: "blue",
    className: "bg-primary-100 text-primary-700",
  },
  URGENT: {
    label: "Urgent",
    variant: "red",
    className: "bg-danger-soft text-danger-ink",
  },
  DONE: {
    label: "Done",
    variant: "green",
    className: "bg-success-soft text-success",
  },
};

/** Return the human-readable label for a CardStatus. */
export function STATUS_LABEL(status: CardStatus): string {
  return STATUS_STYLE[status].label;
}

/** Return true iff `value` is one of the valid `CardStatus` values. */
export function isCardStatus(value: unknown): value is CardStatus {
  return (
    typeof value === "string" &&
    (CARD_STATUSES as readonly string[]).includes(value)
  );
}
