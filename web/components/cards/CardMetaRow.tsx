"use client";

import { Link2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/cn";
import { LABEL_CLASS, labelColor } from "@/lib/labelColor";
import { isOverdue, todayUtc } from "@/lib/overdue";
import { progressPercent } from "@/lib/progress";
import type { BoardCard, Card } from "@/lib/types";

export interface CardMetaRowProps {
  card: BoardCard | Card;
  today?: string;
}

/** Card face labels, status badge, overdue chip, link count chip, and checklist progress bar. */
export function CardMetaRow({ card, today = todayUtc() }: CardMetaRowProps) {
  const overdue = isOverdue(card.due_date, card.status, today);
  const linkCount = "link_count" in card ? card.link_count : 0;
  const checklistTotal = "checklist_total" in card ? card.checklist_total : 0;
  const checklistDone = "checklist_done" in card ? card.checklist_done : 0;
  const pct = progressPercent(checklistDone, checklistTotal);

  return (
    <div className="flex flex-col gap-2">
      {card.labels.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {card.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className={cn(
                "inline-flex items-center h-5 px-2 rounded-sm text-xs font-medium",
                LABEL_CLASS[labelColor(label)]
              )}
            >
              {label}
            </span>
          ))}
          {card.labels.length > 3 ? (
            <span className="inline-flex items-center h-5 px-2 rounded-sm text-xs font-medium bg-sunken text-ink-muted">
              +{card.labels.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1">
        <StatusBadge status={card.status} />
        {overdue ? (
          <span className="inline-flex items-center h-5 px-2 rounded-full text-xs font-medium bg-danger-soft text-danger-ink">
            Overdue
          </span>
        ) : null}
        {linkCount > 0 ? (
          <span
            aria-label={`${linkCount} links`}
            className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-xs font-medium bg-sunken text-ink-muted"
          >
            <Link2 className="size-3.5" aria-hidden="true" />
            <span>{linkCount}</span>
          </span>
        ) : null}
      </div>

      {checklistTotal > 0 ? (
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <div className="flex-1 h-1 rounded-full bg-sunken overflow-hidden">
            <div
              className={cn(
                "h-1 rounded-full",
                pct === 100 ? "bg-success" : "bg-primary-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="shrink-0">{`${checklistDone}/${checklistTotal}`}</span>
        </div>
      ) : null}
    </div>
  );
}
