"use client";

import Link from "next/link";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { formatOverdue } from "@/lib/overdue";
import type { OverdueItem } from "@/lib/types";

export interface OverdueItemRowProps {
  item: OverdueItem;
  onSelect?: () => void;
}

/** Single overdue card row inside the notification list Overdue group. */
export function OverdueItemRow({ item, onSelect }: OverdueItemRowProps) {
  return (
    <li className="rounded-md p-2 border border-line bg-surface text-sm transition-colors duration-150 min-w-0">
      <Link
        href={`/boards/${item.board_id}`}
        onClick={() => onSelect?.()}
        className="block hover:underline min-h-[44px]"
      >
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <BaseBadge variant="red">Overdue</BaseBadge>
          <span className="text-xs text-ink-muted">
            {formatOverdue(item.days_overdue)}
          </span>
        </div>
        <p className="font-medium text-ink break-words">{item.title}</p>
        <p className="text-xs text-ink-muted mt-0.5 break-words">{item.board_name}</p>
      </Link>
    </li>
  );
}
