"use client";

import { Calendar, User as UserIcon } from "lucide-react";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { cn } from "@/lib/cn";
import type { Card } from "@/lib/types";

export interface CardItemProps {
  card: Card;
  isTouchDragging?: boolean;
  isPending?: boolean;
  onSelect?: (card: Card) => void;
  onDragStart?: (e: React.DragEvent, cardId: string) => void;
  onTouchStart?: (e: React.TouchEvent, cardId: string) => void;
}

/** Draggable Kanban task card with title, labels, due date, and assignee. */
export function CardItem({
  card,
  isTouchDragging = false,
  isPending = false,
  onSelect,
  onDragStart,
  onTouchStart,
}: CardItemProps) {
  return (
    <li
      data-card-id={card.card_id}
      data-column-id={card.column_id}
      draggable={!isPending}
      onDragStart={(e) => onDragStart?.(e, card.card_id)}
      onTouchStart={(e) => onTouchStart?.(e, card.card_id)}
      onContextMenu={(e) => {
        if (isTouchDragging) {
          e.preventDefault();
        }
      }}
      onClick={() => onSelect?.(card)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(card);
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "rounded-md border border-line bg-surface p-3 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-primary-500 cursor-pointer transition-colors duration-150 select-none [-webkit-touch-callout:none] flex flex-col gap-2",
        isTouchDragging && "rotate-2 shadow-overlay border-primary-200 opacity-90",
        isPending && "opacity-60"
      )}
    >
      {card.labels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {card.labels.slice(0, 3).map((label) => (
            <BaseBadge key={label} variant="blue">
              {label}
            </BaseBadge>
          ))}
          {card.labels.length > 3 ? (
            <BaseBadge variant="gray">+{card.labels.length - 3}</BaseBadge>
          ) : null}
        </div>
      ) : null}

      <p className="text-sm font-medium text-ink line-clamp-3 break-words">
        {card.title}
      </p>

      {card.due_date || card.assignee ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
          {card.due_date ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              <span>{card.due_date}</span>
            </span>
          ) : (
            <span />
          )}
          {card.assignee ? (
            <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
              <UserIcon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{card.assignee.name}</span>
            </span>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
