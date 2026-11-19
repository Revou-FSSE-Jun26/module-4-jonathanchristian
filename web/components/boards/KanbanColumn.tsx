"use client";

import { CardItem } from "@/components/cards/CardItem";
import { ColumnHeader } from "@/components/boards/ColumnHeader";
import { cn } from "@/lib/cn";
import type { Card, Column } from "@/lib/types";

export interface KanbanColumnProps {
  column: Column;
  isDragTarget?: boolean;
  touchDraggingCardId?: string | null;
  pendingIds?: Set<string>;
  onSelectCard?: (card: Card) => void;
  onDragStart?: (e: React.DragEvent, cardId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, columnId: string) => void;
  onTouchStart?: (e: React.TouchEvent, cardId: string) => void;
  onRenameColumn?: (columnId: string, newName: string) => Promise<boolean>;
  onDeleteColumn?: (columnId: string) => Promise<void>;
  footer?: React.ReactNode;
}

/** Single Kanban column with header, sorted cards list, and optional footer. */
export function KanbanColumn({
  column,
  isDragTarget = false,
  touchDraggingCardId = null,
  pendingIds,
  onSelectCard,
  onDragStart,
  onDragOver,
  onDrop,
  onTouchStart,
  onRenameColumn,
  onDeleteColumn,
  footer,
}: KanbanColumnProps) {
  const sortedCards = [...column.cards].sort((a, b) => a.order - b.order);

  return (
    <section
      data-column-id={column.column_id}
      aria-label={column.name}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, column.column_id)}
      className={cn(
        "w-72 min-w-[240px] shrink-0 rounded-lg bg-sunken p-2 flex flex-col gap-2",
        isDragTarget && "outline-2 outline-dashed outline-primary-200"
      )}
    >
      <ColumnHeader
        column={column}
        onRename={onRenameColumn}
        onDelete={onDeleteColumn}
      />

      <ul className="flex flex-col gap-2 min-h-[16px]">
        {sortedCards.map((card) => (
          <CardItem
            key={card.card_id}
            card={card}
            isTouchDragging={touchDraggingCardId === card.card_id}
            isPending={pendingIds?.has(card.card_id)}
            onSelect={onSelectCard}
            onDragStart={onDragStart}
            onTouchStart={onTouchStart}
          />
        ))}
      </ul>

      {footer}
    </section>
  );
}
