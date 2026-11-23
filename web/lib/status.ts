import type { BaseBadgeVariant } from "@/components/shared/BaseBadge";
import type { CardStatus } from "./types";

export const CARD_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE"] as const;
export type { CardStatus };

export const STATUS_LABEL: Record<CardStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export const STATUS_VARIANT: Record<CardStatus, Extract<BaseBadgeVariant, "gray" | "blue" | "green">> = {
  NOT_STARTED: "gray",
  IN_PROGRESS: "blue",
  DONE: "green",
};

/** Return true iff `value` is one of the valid `CardStatus` values. */
export function isCardStatus(value: unknown): value is CardStatus {
  return (
    typeof value === "string" &&
    (CARD_STATUSES as readonly string[]).includes(value)
  );
}
