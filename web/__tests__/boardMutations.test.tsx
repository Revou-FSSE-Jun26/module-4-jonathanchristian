import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardView } from "@/components/boards/BoardView";
import type { BoardDetail } from "@/lib/types";

const handleErrorMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { user_id: "u1", name: "Member", email: "m@b.c", created_at: "" },
    status: "authenticated",
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

function makeBoard(): BoardDetail {
  return {
    board_id: "b1",
    name: "Roadmap",
    my_role: "manager",
    created_at: "2026-11-18T00:00:00Z",
    columns: [
      {
        column_id: "col-1",
        board_id: "b1",
        name: "To Do",
        order: 1,
        cards: [],
      },
    ],
  };
}

describe("BoardView column and card mutations", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("validates, adds, renames, and deletes columns, and adds cards", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/members")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      if (url.endsWith("/columns") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { column_id: "col-2", board_id: "b1", name: "Doing", order: 2 },
            }),
            { status: 201 }
          )
        );
      }
      if (url.endsWith("/columns/col-2") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { column_id: "col-2", board_id: "b1", name: "In Progress", order: 2 },
            }),
            { status: 200 }
          )
        );
      }
      if (url.endsWith("/columns/col-2") && init?.method === "DELETE") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { column_id: "col-2" } }), { status: 200 })
        );
      }
      if (url.endsWith("/columns/col-1/cards") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                card_id: "c1",
                board_id: "b1",
                column_id: "col-1",
                title: "Write tests",
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
            }),
            { status: 201 }
          )
        );
      }
      if (url.endsWith("/comments")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      if (url.endsWith("/cards/c1") && (!init?.method || init.method === "GET")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                card_id: "c1",
                board_id: "b1",
                column_id: "col-1",
                title: "Write tests",
                description: null,
                due_date: null,
                labels: [],
                assignee: null,
                status: "NOT_STARTED",
                completed_at: null,
                order: 1,
                checklist_done: 0,
                checklist_total: 0,
                link_count: 0,
                checklist: [],
                links: [],
                created_at: "2026-11-18T00:00:00Z",
                updated_at: "2026-11-18T00:00:00Z",
              },
            }),
            { status: 200 }
          )
        );
      }
      return Promise.reject(new Error("Unexpected call"));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BoardView board={makeBoard()} />);

    // Add column validation
    await user.click(screen.getByRole("button", { name: "Add column" }));
    await user.click(screen.getByRole("button", { name: "Add column" }));
    expect(screen.getByText("Column name is required")).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([u]) => typeof u === "string" && u.endsWith("/columns"))
    ).toBe(false);

    // Add column success
    await user.type(screen.getByLabelText("Column name"), "Doing");
    await user.click(screen.getByRole("button", { name: "Add column" }));
    expect(await screen.findByText("Doing")).toBeInTheDocument();

    // Rename column
    await user.click(screen.getByRole("button", { name: "Rename Doing" }));
    const renameInput = screen.getByLabelText("Column name");
    await user.clear(renameInput);
    await user.type(renameInput, "In Progress");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("In Progress")).toBeInTheDocument();

    // Delete column
    await user.click(screen.getByRole("button", { name: "Delete In Progress" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.queryByText("In Progress")).not.toBeInTheDocument();
    });

    // Add card validation + success
    await user.click(screen.getByRole("button", { name: "Add a card" }));
    await user.click(screen.getByRole("button", { name: "Add card" }));
    expect(screen.getByText("Title is required")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Card title"), "Write tests");
    await user.click(screen.getByRole("button", { name: "Add card" }));
    expect(await screen.findByText("Write tests")).toBeInTheDocument();
    // New-card flow opens CardDetailModal with the created title and a single Save button
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Write tests");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete card" })).not.toBeInTheDocument();

    // Closing without saving keeps the title-only card with status Not started
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
  });

  it("keeps state unchanged and calls handleError when mutation fails (opens no modal)", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Server error" }), { status: 500 }))
    );

    render(<BoardView board={makeBoard()} />);
    await user.click(screen.getByRole("button", { name: "Add a card" }));
    await user.type(screen.getByLabelText("Card title"), "Fail card");
    await user.click(screen.getByRole("button", { name: "Add card" }));

    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText("Fail card")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
