"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import {
  getColumnCardMidYs,
  startTouchDragSession,
  type TouchDragTarget,
} from "@/lib/dragDom";
import {
  computeDropIndex,
  computeDropOrder,
  isValidOrder,
  moveCardInState,
  restoreCardInState,
} from "@/lib/order";
import type { Card, Column } from "@/lib/types";

export type TouchDragState = TouchDragTarget;

export interface UseDragAndDropOptions {
  enabled?: boolean;
}

export interface UseDragAndDropResult {
  onDragStart: ((e: React.DragEvent, cardId: string) => void) | undefined;
  onDragOver: ((e: React.DragEvent) => void) | undefined;
  onDrop: ((e: React.DragEvent, columnId: string, index?: number) => void) | undefined;
  onTouchStart: ((e: React.TouchEvent, cardId: string) => void) | undefined;
  pendingIds: Set<string>;
  touchDrag: TouchDragState | null;
}

/**
 * Shared mouse (HTML5 drag) and touch (300 ms long-press) drag-and-drop hook.
 * Both input paths converge on `commitDrop` for optimistic updates and rollback.
 * When `options.enabled` is false (e.g. guest role), all handlers are undefined and drops no-op.
 */
export function useDragAndDrop(
  columns: Column[],
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>,
  options: UseDragAndDropOptions = {}
): UseDragAndDropResult {
  const enabled = options.enabled ?? true;
  const { handleError } = useErrorHandler();
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [touchDrag, setTouchDrag] = useState<TouchDragState | null>(null);

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const pendingRef = useRef(pendingIds);
  pendingRef.current = pendingIds;

  const dragCardIdRef = useRef<string | null>(null);
  const isTouchActiveRef = useRef(false);
  const cleanupTouchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      cleanupTouchRef.current?.();
      cleanupTouchRef.current = null;
      isTouchActiveRef.current = false;
      setTouchDrag(null);
    }
    return () => {
      cleanupTouchRef.current?.();
    };
  }, [enabled]);

  const commitDrop = useCallback(
    async (cardId: string, columnId: string, dropIndex: number) => {
      if (!enabled) {
        return;
      }
      if (pendingRef.current.has(cardId)) {
        return;
      }

      const currentCols = columnsRef.current;
      let sourceCol: Column | undefined;
      let draggedCard: Card | undefined;

      for (const col of currentCols) {
        const found = col.cards.find((c) => c.card_id === cardId);
        if (found) {
          sourceCol = col;
          draggedCard = found;
          break;
        }
      }

      const targetCol = currentCols.find((c) => c.column_id === columnId);
      if (!sourceCol || !draggedCard || !targetCol) {
        return;
      }

      const sortedSource = [...sourceCol.cards].sort((a, b) => a.order - b.order);
      const oldIndex = sortedSource.findIndex((c) => c.card_id === cardId);
      const targetCards = [...targetCol.cards]
        .filter((c) => c.card_id !== cardId)
        .sort((a, b) => a.order - b.order);

      const clampedIndex = Math.max(0, Math.min(dropIndex, targetCards.length));
      if (sourceCol.column_id === columnId && clampedIndex === oldIndex) {
        return;
      }

      const nextOrder = computeDropOrder(targetCards, clampedIndex);
      if (!isValidOrder(nextOrder)) {
        handleError(new Error("Invalid drop order"));
        return;
      }

      const snapshot = {
        card_id: cardId,
        column_id: sourceCol.column_id,
        order: draggedCard.order,
      };

      setColumns((prev) => moveCardInState(prev, cardId, columnId, nextOrder));
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(cardId);
        return next;
      });

      try {
        const updated = await apiRequest<Card>(`/api/cards/${cardId}/position`, {
          method: "PATCH",
          body: { column_id: columnId, order: nextOrder },
        });
        setColumns((prev) =>
          prev.map((col) =>
            col.column_id === columnId
              ? {
                  ...col,
                  cards: col.cards
                    .map((c) => (c.card_id === cardId ? { ...c, ...updated } : c))
                    .sort((a, b) => a.order - b.order),
                }
              : col
          )
        );
      } catch (err) {
        setColumns((prev) => restoreCardInState(prev, snapshot));
        handleError(err);
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(cardId);
          return next;
        });
      }
    },
    [enabled, handleError, setColumns]
  );

  const onDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    if (isTouchActiveRef.current) {
      e.preventDefault();
      return;
    }
    dragCardIdRef.current = cardId;
    e.dataTransfer?.setData("text/plain", cardId);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent, columnId: string, index?: number) => {
      e.preventDefault();
      const cardId = e.dataTransfer?.getData("text/plain") || dragCardIdRef.current;
      dragCardIdRef.current = null;
      if (!cardId) {
        return;
      }

      let resolvedIndex = index;
      if (resolvedIndex === undefined) {
        const colEl = e.currentTarget as HTMLElement;
        const midYs = getColumnCardMidYs(colEl, cardId);
        resolvedIndex =
          midYs.length > 0 && e.clientY > 0
            ? computeDropIndex(midYs, e.clientY)
            : midYs.length;
      }
      void commitDrop(cardId, columnId, resolvedIndex);
    },
    [commitDrop]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent, cardId: string) => {
      if (e.touches.length !== 1 || pendingRef.current.has(cardId)) {
        return;
      }
      cleanupTouchRef.current?.();
      const touch = e.touches[0];
      const cleanup = startTouchDragSession({
        cardId,
        startX: touch.clientX,
        startY: touch.clientY,
        onStateChange: setTouchDrag,
        onActiveChange: (active) => {
          isTouchActiveRef.current = active;
          if (!active) {
            cleanupTouchRef.current = null;
          }
        },
        onDrop: (columnId, index) => {
          void commitDrop(cardId, columnId, index);
        },
      });
      cleanupTouchRef.current = cleanup;
    },
    [commitDrop]
  );

  if (!enabled) {
    return {
      onDragStart: undefined,
      onDragOver: undefined,
      onDrop: undefined,
      onTouchStart: undefined,
      pendingIds,
      touchDrag: null,
    };
  }

  return {
    onDragStart,
    onDragOver,
    onDrop,
    onTouchStart,
    pendingIds,
    touchDrag,
  };
}
