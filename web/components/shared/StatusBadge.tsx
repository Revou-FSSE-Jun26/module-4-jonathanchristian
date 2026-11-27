import { BaseBadge } from "@/components/shared/BaseBadge";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/status";
import type { CardStatus } from "@/lib/types";

export interface StatusBadgeProps {
  status: CardStatus;
  className?: string;
}

/** Shared status badge; the only place a CardStatus becomes human-readable text. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <BaseBadge variant={STATUS_STYLE[status].variant} className={className}>
      {STATUS_LABEL(status)}
    </BaseBadge>
  );
}
