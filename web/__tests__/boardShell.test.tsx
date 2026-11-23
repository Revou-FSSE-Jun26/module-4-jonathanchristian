import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardAccessMessage } from "@/components/boards/BoardAccessMessage";
import { BoardView } from "@/components/boards/BoardView";
import type { BoardDetail } from "@/lib/types";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { user_id: "u1", name: "Admin", email: "a@b.c", created_at: "" } }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

describe("Board Detail shell", () => {
  it("renders columns and cards sorted by ascending order", () => {
    const board: BoardDetail = {
      board_id: "b1",
      name: "Roadmap",
      my_role: "admin",
      created_at: "2026-11-18T00:00:00Z",
      columns: [
        {
          column_id: "col-2",
          board_id: "b1",
          name: "Done",
          order: 2,
          cards: [],
        },
        {
          column_id: "col-1",
          board_id: "b1",
          name: "To Do",
          order: 1,
          cards: [
            {
              card_id: "c2",
              board_id: "b1",
              column_id: "col-1",
              title: "Second",
              description: null,
              due_date: null,
              labels: [],
              assignee: null,
              status: "NOT_STARTED",
              completed_at: null,
              order: 2,
              created_at: "2026-11-18T00:00:00Z",
              updated_at: "2026-11-18T00:00:00Z",
            },
            {
              card_id: "c1",
              board_id: "b1",
              column_id: "col-1",
              title: "First",
              description: null,
              due_date: null,
              labels: [],
              assignee: null,
              status: "NOT_STARTED",
              completed_at: null,
              order: 1,
              created_at: "2026-11-18T00:00:00Z",
              updated_at: "2026-11-18T00:00:00Z",
            },
          ],
        },
      ],
    };

    const { container } = render(<BoardView board={board} />);
    const headings = Array.from(container.querySelectorAll("section h2")).map(
      (el) => el.textContent
    );
    expect(headings).toEqual(["To Do", "Done"]);

    const cardTitles = Array.from(container.querySelectorAll("[data-card-id] p")).map(
      (el) => el.textContent
    );
    expect(cardTitles).toEqual(["First", "Second"]);
  });

  it("renders 403 and 404 access messages with link to / and no cards", () => {
    const { rerender, container } = render(<BoardAccessMessage statusCode={403} />);
    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/");
    expect(container.querySelectorAll("[data-card-id]")).toHaveLength(0);

    rerender(<BoardAccessMessage statusCode={404} />);
    expect(screen.getByText("Board not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/");
    expect(container.querySelectorAll("[data-card-id]")).toHaveLength(0);
  });
});
