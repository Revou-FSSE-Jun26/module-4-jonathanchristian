import type { Card, Column } from "./types";

export const LONG_PRESS_MS = 300;
export const MOVE_TOLERANCE_PX = 10;

export interface CardSnapshot {
  card_id: string;
  column_id: string;
  order: number;
}

export type TouchPhase = "idle" | "pressing" | "dragging" | "cancelled";

export interface TouchGesture {
  phase: TouchPhase;
  startX: number;
  startY: number;
  startedAt: number;
}

export type TouchEv =
  | { type: "start"; x: number; y: number; t: number }
  | { type: "move"; x: number; y: number; t: number }
  | { type: "timer"; t: number }
  | { type: "scroll" }
  | { type: "end" }
  | { type: "cancel" };

export const INITIAL_TOUCH_GESTURE: TouchGesture = {
  phase: "idle",
  startX: 0,
  startY: 0,
  startedAt: 0,
};

/**
 * Compute the new `order` value for a card dropped at `dropIndex`
 * into `targetCards` (excluding the dragged card, sorted ascending).
 */
export function computeDropOrder(
  targetCards: { card_id: string; order: number }[],
  dropIndex: number
): number {
  if (targetCards.length === 0) {
    return 1.0;
  }
  if (dropIndex <= 0) {
    return targetCards[0].order / 2;
  }
  if (dropIndex >= targetCards.length) {
    return targetCards[targetCards.length - 1].order + 1;
  }
  return (targetCards[dropIndex - 1].order + targetCards[dropIndex].order) / 2;
}

/** Return true iff `order` is a finite positive number. */
export function isValidOrder(order: number): boolean {
  return Number.isFinite(order) && order > 0;
}

/** Pure optimistic update moving `cardId` to `toColumnId` with `order`. */
export function moveCardInState(
  columns: Column[],
  cardId: string,
  toColumnId: string,
  order: number
): Column[] {
  let movedCard: Card | null = null;
  const withoutCard = columns.map((col) => {
    const found = col.cards.find((c) => c.card_id === cardId);
    if (found) {
      movedCard = { ...found, column_id: toColumnId, order };
      return {
        ...col,
        cards: col.cards.filter((c) => c.card_id !== cardId),
      };
    }
    return col;
  });

  if (!movedCard) {
    return columns;
  }

  const cardToInsert: Card = movedCard;
  return withoutCard.map((col) => {
    if (col.column_id !== toColumnId) {
      return col;
    }
    const nextCards = [...col.cards, cardToInsert].sort((a, b) => a.order - b.order);
    return { ...col, cards: nextCards };
  });
}

/** Pure revert restoring a card back to its pre-drag column and order. */
export function restoreCardInState(columns: Column[], snapshot: CardSnapshot): Column[] {
  return moveCardInState(columns, snapshot.card_id, snapshot.column_id, snapshot.order);
}

/**
 * Compute drop index in a column from sorted vertical midpoints of its cards
 * (excluding the dragged card) and the pointer Y coordinate.
 */
export function computeDropIndex(cardMidYs: number[], pointY: number): number {
  let count = 0;
  for (const midY of cardMidYs) {
    if (midY < pointY) {
      count += 1;
    }
  }
  return count;
}

/** Pure state machine for the 300 ms long-press touch drag gesture. */
export function touchGestureStep(gesture: TouchGesture, event: TouchEv): TouchGesture {
  if (event.type === "start") {
    return {
      phase: "pressing",
      startX: event.x,
      startY: event.y,
      startedAt: event.t,
    };
  }

  if (gesture.phase === "pressing") {
    if (event.type === "timer") {
      if (event.t - gesture.startedAt >= LONG_PRESS_MS) {
        return { ...gesture, phase: "dragging" };
      }
      return gesture;
    }
    if (event.type === "move") {
      const distance = Math.hypot(event.x - gesture.startX, event.y - gesture.startY);
      if (distance > MOVE_TOLERANCE_PX) {
        return { ...gesture, phase: "cancelled" };
      }
      return gesture;
    }
    if (event.type === "scroll" || event.type === "end" || event.type === "cancel") {
      return { ...gesture, phase: "cancelled" };
    }
  }

  if (gesture.phase === "dragging") {
    if (event.type === "end") {
      return { ...gesture, phase: "idle" };
    }
    if (event.type === "cancel") {
      return { ...gesture, phase: "cancelled" };
    }
    return gesture;
  }

  return gesture;
}
