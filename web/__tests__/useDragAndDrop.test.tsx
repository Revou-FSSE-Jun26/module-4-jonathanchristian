import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import type { Card, Column } from "@/lib/types";

const handleErrorMock = vi.fn();
vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

function makeCard(card_id: string, column_id: string, order: number): Card {
  return {
    card_id,
    board_id: "b1",
    column_id,
    title: `Card ${card_id}`,
    description: null,
    due_date: null,
    labels: [],
    assignee: null,
    status: "NOT_STARTED",
    completed_at: null,
    order,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
  };
}

function makeInitialColumns(): Column[] {
  return [
    {
      column_id: "col-1",
      board_id: "b1",
      name: "To Do",
      order: 1,
      cards: [makeCard("c1", "col-1", 1)],
    },
    {
      column_id: "col-2",
      board_id: "b1",
      name: "Done",
      order: 2,
      cards: [],
    },
  ];
}

function Harness({ enabled = true }: { enabled?: boolean }) {
  const [cols, setCols] = useState<Column[]>(makeInitialColumns);
  const { onDragStart, onDragOver, onDrop, onTouchStart, touchDrag } = useDragAndDrop(
    cols,
    setCols,
    { enabled }
  );

  return (
    <div>
      <span data-testid="touch-phase">{touchDrag ? touchDrag.cardId : "none"}</span>
      <span data-testid="handlers-defined">
        {String(Boolean(onDragStart && onDragOver && onDrop && onTouchStart))}
      </span>
      {cols.map((col) => (
        <div
          key={col.column_id}
          data-testid={col.column_id}
          data-column-id={col.column_id}
          onDragOver={onDragOver}
          onDrop={onDrop ? (e) => onDrop(e, col.column_id) : undefined}
        >
          {col.cards.map((card) => (
            <div
              key={card.card_id}
              data-testid={`card-${card.card_id}`}
              data-card-id={card.card_id}
              draggable={enabled}
              onDragStart={onDragStart ? (e) => onDragStart(e, card.card_id) : undefined}
              onTouchStart={onTouchStart ? (e) => onTouchStart(e, card.card_id) : undefined}
            >
              {card.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

describe("hooks/useDragAndDrop", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("moves card optimistically before request resolves and reverts with one toast on failure", async () => {
    let rejectFetch!: (reason?: unknown) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((_, reject) => {
          rejectFetch = reject;
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    const card = screen.getByTestId("card-c1");
    const col2 = screen.getByTestId("col-2");
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(() => "c1"),
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(col2, { dataTransfer });

    // Optimistically moved before fetch resolves/rejects
    expect(col2.querySelector('[data-card-id="c1"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rejectFetch(new Error("Network error"));
    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId("col-1").querySelector('[data-card-id="c1"]')).not.toBeNull();
  });

  it("ignores drop on same column and same position", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    const card = screen.getByTestId("card-c1");
    const col1 = screen.getByTestId("col-1");
    const dataTransfer = { setData: vi.fn(), getData: vi.fn(() => "c1") };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.drop(col1, { dataTransfer });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Property 55 (hook): returns undefined handlers and starts no drag when enabled is false", () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Harness enabled={false} />);
    expect(screen.getByTestId("handlers-defined").textContent).toBe("false");
    expect(screen.getByTestId("touch-phase").textContent).toBe("none");

    const card = screen.getByTestId("card-c1");
    const col2 = screen.getByTestId("col-2");
    fireEvent.dragStart(card);
    fireEvent.drop(col2);
    fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 50 }] });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.touchEnd(card);

    expect(screen.getByTestId("touch-phase").textContent).toBe("none");
    expect(col2.querySelector('[data-card-id="c1"]')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("touch 300ms hold starts drag, prevents default on touchmove, and moves card on touchend", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: makeCard("c1", "col-2", 1) }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);
    const col2 = screen.getByTestId("col-2");
    document.elementFromPoint = vi.fn(() => col2);

    const card = screen.getByTestId("card-c1");
    fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 50 }] });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("touch-phase")).toHaveTextContent("c1");

    const moveEvent = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(moveEvent, "touches", { value: [{ clientX: 200, clientY: 50 }] });
    document.dispatchEvent(moveEvent);
    expect(moveEvent.defaultPrevented).toBe(true);

    const endEvent = new Event("touchend", { bubbles: true, cancelable: true });
    Object.defineProperty(endEvent, "changedTouches", { value: [{ clientX: 200, clientY: 50 }] });
    await act(async () => {
      document.dispatchEvent(endEvent);
    });

    expect(col2.querySelector('[data-card-id="c1"]')).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cancels touch drag on >10px move before 300ms, touchend outside column, or touchcancel", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);
    const card = screen.getByTestId("card-c1");

    // Move > 10px before 300ms
    fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 50 }] });
    const moveEvent = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(moveEvent, "touches", { value: [{ clientX: 80, clientY: 50 }] });
    document.dispatchEvent(moveEvent);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("touch-phase")).toHaveTextContent("none");
    expect(fetchMock).not.toHaveBeenCalled();

    // Touch end outside any column after 300ms
    document.elementFromPoint = vi.fn(() => document.body);
    fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 50 }] });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("touch-phase")).toHaveTextContent("c1");
    const endEvent = new Event("touchend", { bubbles: true, cancelable: true });
    Object.defineProperty(endEvent, "changedTouches", { value: [{ clientX: 10, clientY: 10 }] });
    act(() => {
      document.dispatchEvent(endEvent);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    // touchcancel after 300ms
    fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 50 }] });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    act(() => {
      document.dispatchEvent(new Event("touchcancel", { bubbles: true }));
    });
    expect(screen.getByTestId("touch-phase")).toHaveTextContent("none");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Property 55 (hook): returns undefined handlers and starts no drag when enabled is false", () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Harness enabled={false} />);
    expect(screen.getByTestId("handlers-defined").textContent).toBe("false");
    expect(screen.getByTestId("touch-phase").textContent).toBe("none");

    const card = screen.getByTestId("card-c1");
    const col2 = screen.getByTestId("col-2");
    fireEvent.dragStart(card);
    fireEvent.drop(col2);
    fireEvent.touchStart(card, { touches: [{ clientX: 50, clientY: 50 }] });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.touchEnd(card);

    expect(screen.getByTestId("touch-phase").textContent).toBe("none");
    expect(col2.querySelector('[data-card-id="c1"]')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
