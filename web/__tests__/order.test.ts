import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  INITIAL_TOUCH_GESTURE,
  LONG_PRESS_MS,
  MOVE_TOLERANCE_PX,
  computeDropIndex,
  computeDropOrder,
  isValidOrder,
  moveCardInState,
  restoreCardInState,
  touchGestureStep,
  type TouchEv,
} from "@/lib/order";
import { CARD_STATUSES } from "@/lib/status";
import type { BoardCard, CardStatus, Column } from "@/lib/types";

function makeCard(
  card_id: string,
  column_id: string,
  order: number,
  status: CardStatus = "NOT_STARTED",
  completed_at: string | null = null
): BoardCard {
  return {
    card_id,
    board_id: "b1",
    column_id,
    title: `Card ${card_id}`,
    description: null,
    due_date: null,
    labels: [],
    assignee: null,
    status,
    completed_at,
    order,
    checklist_done: 0,
    checklist_total: 0,
    link_count: 0,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
  };
}

describe("lib/order", () => {
  // Feature: kano, Property 30: Client drop order computation
  it("Property 30: computeDropOrder produces valid positive order placing card at dropIndex", () => {
    const ordersArb = fc
      .uniqueArray(fc.double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true }), {
        maxLength: 15,
      })
      .map((arr) => arr.sort((a, b) => a - b).map((order, i) => ({ card_id: `c${i}`, order })));

    fc.assert(
      fc.property(ordersArb, fc.integer({ min: 0, max: 20 }), (cards, rawIndex) => {
        const dropIndex = Math.min(rawIndex, cards.length);
        const nextOrder = computeDropOrder(cards, dropIndex);
        expect(isValidOrder(nextOrder)).toBe(true);

        if (cards.length === 0) {
          expect(nextOrder).toBe(1.0);
        } else if (dropIndex === 0) {
          expect(nextOrder).toBe(cards[0].order / 2);
        } else if (dropIndex === cards.length) {
          expect(nextOrder).toBe(cards[cards.length - 1].order + 1);
        } else {
          expect(nextOrder).toBe((cards[dropIndex - 1].order + cards[dropIndex].order) / 2);
        }

        const withNew = [...cards, { card_id: "dragged", order: nextOrder }].sort(
          (a, b) => a.order - b.order
        );
        // When orders are separated enough in JS float64, dragged sits at dropIndex
        if (
          (dropIndex === 0 || nextOrder > cards[dropIndex - 1].order) &&
          (dropIndex === cards.length || nextOrder < cards[dropIndex].order)
        ) {
          expect(withNew[dropIndex].card_id).toBe("dragged");
        }
      }),
      { numRuns: 150 }
    );
  });

  // Feature: kano, Property 31: Optimistic move and revert
  it("Property 31: moveCardInState and restoreCardInState round-trip to original state", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
        (targetColIdx, newOrder) => {
          const initial: Column[] = [
            {
              column_id: "col-1",
              board_id: "b1",
              name: "To Do",
              order: 1,
              cards: [makeCard("c1", "col-1", 1), makeCard("c2", "col-1", 2)],
            },
            {
              column_id: "col-2",
              board_id: "b1",
              name: "Done",
              order: 2,
              cards: [makeCard("c3", "col-2", 1)],
            },
          ];
          const snapshot = { card_id: "c1", column_id: "col-1", order: 1 };
          const targetColId = targetColIdx === 0 ? "col-1" : "col-2";

          const moved = moveCardInState(initial, "c1", targetColId, newOrder);
          const movedCard = moved
            .find((c) => c.column_id === targetColId)
            ?.cards.find((c) => c.card_id === "c1");
          expect(movedCard?.order).toBe(newOrder);
          expect(movedCard?.column_id).toBe(targetColId);

          const restored = restoreCardInState(moved, snapshot);
          expect(restored).toEqual(initial);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: kano, Property 56: Status labels, badges, and moves (move part)
  it("Property 56 (moves): moveCardInState and restoreCardInState preserve status and completed_at", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CARD_STATUSES),
        fc.option(fc.constant("2026-11-20T12:00:00Z"), { nil: null }),
        (status, completedAt) => {
          const initial: Column[] = [
            {
              column_id: "col-1",
              board_id: "b1",
              name: "To Do",
              order: 1,
              cards: [makeCard("c1", "col-1", 1, status, completedAt)],
            },
            {
              column_id: "col-2",
              board_id: "b1",
              name: "Done",
              order: 2,
              cards: [],
            },
          ];
          const moved = moveCardInState(initial, "c1", "col-2", 1.0);
          const movedCard = moved[1].cards[0];
          expect(movedCard.status).toBe(status);
          expect(movedCard.completed_at).toBe(completedAt);

          const restored = restoreCardInState(moved, {
            card_id: "c1",
            column_id: "col-1",
            order: 1,
          });
          expect(restored[0].cards[0].status).toBe(status);
          expect(restored[0].cards[0].completed_at).toBe(completedAt);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: kano, Property 41: Touch drop index from the touch point
  it("Property 41: computeDropIndex counts midpoints strictly smaller than pointY", () => {
    const midYsArb = fc
      .array(fc.double({ min: 0, max: 2000, noNaN: true, noDefaultInfinity: true }), {
        maxLength: 20,
      })
      .map((arr) => arr.sort((a, b) => a - b));

    fc.assert(
      fc.property(
        midYsArb,
        fc.double({ min: -100, max: 2100, noNaN: true, noDefaultInfinity: true }),
        (midYs, pointY) => {
          const idx = computeDropIndex(midYs, pointY);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(midYs.length);
          expect(idx).toBe(midYs.filter((y) => y < pointY).length);
        }
      ),
      { numRuns: 150 }
    );
  });

  // Feature: kano, Property 42: Touch gesture state machine
  it("Property 42: touchGestureStep reaches dragging iff 300ms timer fires without >10px move, scroll, end, or cancel", () => {
    const eventArb: fc.Arbitrary<TouchEv> = fc.oneof(
      fc.record({
        type: fc.constant("move" as const),
        x: fc.integer({ min: 80, max: 120 }),
        y: fc.integer({ min: 80, max: 120 }),
        t: fc.integer({ min: 100, max: 600 }),
      }),
      fc.record({
        type: fc.constant("timer" as const),
        t: fc.integer({ min: 100, max: 800 }),
      }),
      fc.constant({ type: "scroll" as const }),
      fc.constant({ type: "end" as const }),
      fc.constant({ type: "cancel" as const })
    );

    fc.assert(
      fc.property(fc.array(eventArb, { minLength: 1, maxLength: 10 }), (events) => {
        let g = touchGestureStep(INITIAL_TOUCH_GESTURE, {
          type: "start",
          x: 100,
          y: 100,
          t: 100,
        });
        let invalidatedBeforeTimer = false;
        let sawDragging = false;

        for (const ev of events) {
          if (g.phase === "pressing") {
            if (ev.type === "move" && Math.hypot(ev.x - 100, ev.y - 100) > MOVE_TOLERANCE_PX) {
              invalidatedBeforeTimer = true;
            }
            if (ev.type === "scroll" || ev.type === "end" || ev.type === "cancel") {
              invalidatedBeforeTimer = true;
            }
            if (ev.type === "timer" && ev.t - 100 >= LONG_PRESS_MS && !invalidatedBeforeTimer) {
              sawDragging = true;
            }
          }
          g = touchGestureStep(g, ev);
          if (g.phase === "dragging") {
            expect(sawDragging).toBe(true);
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});
