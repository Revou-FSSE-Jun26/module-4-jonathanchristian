import {
  INITIAL_TOUCH_GESTURE,
  LONG_PRESS_MS,
  computeDropIndex,
  touchGestureStep,
  type TouchGesture,
} from "./order";

export interface TouchDragTarget {
  cardId: string;
  targetColumnId: string | null;
  targetIndex: number | null;
}

/** Return sorted vertical midpoints of cards inside `columnEl`, excluding `draggedCardId`. */
export function getColumnCardMidYs(columnEl: Element, draggedCardId: string): number[] {
  const cardEls = Array.from(columnEl.querySelectorAll<HTMLElement>("[data-card-id]"));
  return cardEls
    .filter((el) => el.dataset.cardId !== draggedCardId)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2;
    })
    .sort((a, b) => a - b);
}

/** Hit-test `(x, y)` to find the target column id and drop index for touch dragging. */
export function findTouchTarget(
  x: number,
  y: number,
  draggedCardId: string
): { columnId: string | null; index: number | null } {
  if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") {
    return { columnId: null, index: null };
  }
  const el = document.elementFromPoint(x, y);
  const columnEl = el?.closest?.("[data-column-id]") ?? null;
  if (!columnEl) {
    return { columnId: null, index: null };
  }
  const columnId = (columnEl as HTMLElement).dataset.columnId ?? null;
  if (!columnId) {
    return { columnId: null, index: null };
  }
  const midYs = getColumnCardMidYs(columnEl, draggedCardId);
  return { columnId, index: computeDropIndex(midYs, y) };
}

/** Attach document/window listeners and long-press timer for a touch drag session. */
export function startTouchDragSession(params: {
  cardId: string;
  startX: number;
  startY: number;
  onStateChange: (state: TouchDragTarget | null) => void;
  onActiveChange: (active: boolean) => void;
  onDrop: (columnId: string, index: number) => void;
}): () => void {
  const { cardId, startX, startY, onStateChange, onActiveChange, onDrop } = params;
  const startedAt = Date.now();
  let gesture: TouchGesture = touchGestureStep(INITIAL_TOUCH_GESTURE, {
    type: "start",
    x: startX,
    y: startY,
    t: startedAt,
  });
  onActiveChange(true);

  let timerId: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;
  let lastPoint = { x: startX, y: startY };

  const cleanup = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (rafId !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    document.removeEventListener("touchmove", onDocTouchMove);
    document.removeEventListener("touchend", onDocTouchEnd);
    document.removeEventListener("touchcancel", onDocTouchCancel);
    window.removeEventListener("scroll", onWindowScroll);
    onActiveChange(false);
    onStateChange(null);
  };

  const onWindowScroll = () => {
    gesture = touchGestureStep(gesture, { type: "scroll" });
    if (gesture.phase === "cancelled") {
      cleanup();
    }
  };

  const onDocTouchMove = (ev: TouchEvent) => {
    const pt = ev.touches[0];
    if (!pt) {
      return;
    }
    lastPoint = { x: pt.clientX, y: pt.clientY };

    if (gesture.phase === "dragging") {
      ev.preventDefault();
      if (rafId === null) {
        const schedule =
          typeof requestAnimationFrame === "function"
            ? requestAnimationFrame
            : (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number;
        rafId = schedule(() => {
          rafId = null;
          const target = findTouchTarget(lastPoint.x, lastPoint.y, cardId);
          onStateChange({
            cardId,
            targetColumnId: target.columnId,
            targetIndex: target.index,
          });
        });
      }
      return;
    }

    gesture = touchGestureStep(gesture, {
      type: "move",
      x: pt.clientX,
      y: pt.clientY,
      t: Date.now(),
    });
    if (gesture.phase === "cancelled") {
      cleanup();
    }
  };

  const onDocTouchEnd = (ev: TouchEvent) => {
    const pt = ev.changedTouches[0];
    const finalPoint = pt ? { x: pt.clientX, y: pt.clientY } : lastPoint;
    const wasDragging = gesture.phase === "dragging";
    gesture = touchGestureStep(gesture, { type: "end" });
    cleanup();

    if (wasDragging) {
      const target = findTouchTarget(finalPoint.x, finalPoint.y, cardId);
      if (target.columnId !== null && target.index !== null) {
        onDrop(target.columnId, target.index);
      }
    }
  };

  const onDocTouchCancel = () => {
    gesture = touchGestureStep(gesture, { type: "cancel" });
    cleanup();
  };

  document.addEventListener("touchmove", onDocTouchMove, { passive: false });
  document.addEventListener("touchend", onDocTouchEnd, { passive: false });
  document.addEventListener("touchcancel", onDocTouchCancel, { passive: false });
  window.addEventListener("scroll", onWindowScroll, { passive: true });

  timerId = setTimeout(() => {
    timerId = null;
    gesture = touchGestureStep(gesture, {
      type: "timer",
      t: startedAt + LONG_PRESS_MS,
    });
    if (gesture.phase === "dragging") {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(10);
      }
      const target = findTouchTarget(lastPoint.x, lastPoint.y, cardId);
      onStateChange({
        cardId,
        targetColumnId: target.columnId,
        targetIndex: target.index,
      });
    }
  }, LONG_PRESS_MS);

  return cleanup;
}
