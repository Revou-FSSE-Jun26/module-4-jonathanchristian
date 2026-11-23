import { BaseBadge } from "@/components/shared/BaseBadge";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/status";
import type { CardStatus } from "@/lib/types";

export interface StatusBadgeProps {
  status: CardStatus;
  className?: string;
}

/** Shared status badge; the only place a CardStatus becomes human-readable text. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <BaseBadge variant={STATUS_VARIANT[status]} className={className}>
      {STATUS_LABEL[status]}
    </BaseBadge>
  );
}
