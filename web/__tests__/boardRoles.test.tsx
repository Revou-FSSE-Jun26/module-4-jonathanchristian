import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import fc from "fast-check";
import { BoardView } from "@/components/boards/BoardView";
import type { BoardDetail, CardStatus, Role } from "@/lib/types";
import { CARD_STATUSES, STATUS_LABEL } from "@/lib/status";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { user_id: "u1", name: "User", email: "u@b.c", created_at: "" } }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

function makeBoard(role: Role, status: CardStatus = "IN_PROGRESS"): BoardDetail {
  return {
    board_id: "b1",
    name: "Roadmap",
    my_role: role,
    created_at: "2026-11-18T00:00:00Z",
    columns: [
      {
        column_id: "col-1",
        board_id: "b1",
        name: "To Do",
        order: 1,
        cards: [
          {
            card_id: "c1",
            board_id: "b1",
            column_id: "col-1",
            title: "Ship V6",
            description: null,
            due_date: null,
            labels: [],
            assignee: null,
            status,
            completed_at: status === "DONE" ? "2026-11-20T00:00:00Z" : null,
            order: 1,
            checklist_done: 0,
            checklist_total: 0,
            link_count: 0,
            created_at: "2026-11-18T00:00:00Z",
            updated_at: "2026-11-18T00:00:00Z",
          },
        ],
      },
      {
        column_id: "col-2",
        board_id: "b1",
        name: "Done",
        order: 2,
        cards: [],
      },
    ],
  };
}

describe("Board role gating and StatusBadge (Task 30.1)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    );
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows admin controls for admin, edit controls without Members/Analytics for member", () => {
    const { rerender } = render(<BoardView board={makeBoard("admin")} />);
    expect(screen.getByRole("button", { name: "Members" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add column" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add a card" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Rename To Do" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete To Do" })).toBeInTheDocument();

    rerender(<BoardView board={makeBoard("member")} />);
    expect(screen.queryByRole("button", { name: "Members" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add a card" })).toHaveLength(2);

    rerender(<BoardView board={makeBoard("manager")} />);
    expect(screen.getByRole("button", { name: "Members" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analytics" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add column" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add a card" })).toHaveLength(2);
  });

  it("Property 55 (render): guest sees Guest badge, StatusBadge, search input, and zero edit/drag controls", () => {
    fc.assert(
      fc.property(fc.constantFrom(...CARD_STATUSES), (status) => {
        cleanup();
        const { container, unmount } = render(<BoardView board={makeBoard("guest", status)} />);
        expect(screen.getByText("Guest")).toBeInTheDocument();
        expect(screen.getByRole("searchbox")).toBeInTheDocument();

        expect(screen.queryByRole("button", { name: "Members" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Analytics" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Add a card" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Rename/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();

        const cardEl = container.querySelector<HTMLElement>('[data-card-id="c1"]');
        expect(cardEl).not.toBeNull();
        expect(within(cardEl!).getByText(STATUS_LABEL(status))).toBeInTheDocument();
        expect(cardEl!.hasAttribute("draggable")).toBe(false);
        unmount();
      }),
      { numRuns: 10 }
    );
  });

  it("dragging a card to another column keeps its StatusBadge unchanged", () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/members")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      if (url.endsWith("/position") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: makeBoard("member", "IN_PROGRESS").columns[0].cards[0],
            }),
            { status: 200 }
          )
        );
      }
      return Promise.reject(new Error("Unexpected call"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<BoardView board={makeBoard("member", "IN_PROGRESS")} />);
    const cardEl = container.querySelector('[data-card-id="c1"]')!;
    const col2 = container.querySelector('[data-column-id="col-2"]')!;
    const dataTransfer = { setData: vi.fn(), getData: vi.fn(() => "c1") };

    fireEvent.dragStart(cardEl, { dataTransfer });
    fireEvent.drop(col2, { dataTransfer });

    expect(col2.querySelector('[data-card-id="c1"]')).not.toBeNull();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });
});
