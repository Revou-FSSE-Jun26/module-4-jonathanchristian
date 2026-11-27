"use client";

import { Calendar, User as UserIcon } from "lucide-react";
import { useBoardRole } from "@/components/boards/BoardRoleContext";
import { CardMetaRow } from "@/components/cards/CardMetaRow";
import { cn } from "@/lib/cn";
import type { BoardCard } from "@/lib/types";

export interface CardItemProps {
  card: BoardCard;
  today?: string;
  isTouchDragging?: boolean;
  isPending?: boolean;
  onSelect?: (card: BoardCard) => void;
  onDragStart?: (e: React.DragEvent, cardId: string) => void;
  onTouchStart?: (e: React.TouchEvent, cardId: string) => void;
}

/** Draggable Kanban task card with labels, title, status, overdue/link/checklist indicators, and assignee. */
export function CardItem({
  card,
  today,
  isTouchDragging = false,
  isPending = false,
  onSelect,
  onDragStart,
  onTouchStart,
}: CardItemProps) {
  const { can } = useBoardRole();
  const allowEditCards = can("edit_cards");

  return (
    <li
      data-card-id={card.card_id}
      data-column-id={card.column_id}
      draggable={allowEditCards ? !isPending : undefined}
      onDragStart={allowEditCards && onDragStart ? (e) => onDragStart(e, card.card_id) : undefined}
      onTouchStart={allowEditCards && onTouchStart ? (e) => onTouchStart(e, card.card_id) : undefined}
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
      <p className="text-sm font-medium text-ink line-clamp-3 break-words">
        {card.title}
      </p>

      <CardMetaRow card={card} today={today} />

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
