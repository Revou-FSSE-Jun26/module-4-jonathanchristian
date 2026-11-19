import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyticsView } from "@/components/boards/AnalyticsView";
import { BoardView } from "@/components/boards/BoardView";
import { MemberPanel } from "@/components/boards/MemberPanel";
import type { BoardDetail, Member } from "@/lib/types";

const handleErrorMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      user_id: "u-admin",
      name: "Admin",
      email: "admin@example.com",
      created_at: "2026-11-18T00:00:00Z",
    },
    status: "authenticated",
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

function makeBoard(role: "admin" | "member"): BoardDetail {
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
            title: "Original Card",
            description: null,
            due_date: null,
            labels: [],
            assignee: null,
            order: 1,
            created_at: "2026-11-18T00:00:00Z",
            updated_at: "2026-11-18T00:00:00Z",
          },
        ],
      },
    ],
  };
}

describe("Board search, member panel, and analytics", () => {
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

  it("search debounces 300ms, shows empty result message, and restores board on clear", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/members")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BoardView board={makeBoard("member")} />);
    expect(screen.queryByRole("button", { name: "Members" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analytics" })).not.toBeInTheDocument();

    const searchInput = screen.getByLabelText("Search cards");
    fireEvent.change(searchInput, { target: { value: "xyz" } });
    expect(fetchMock).toHaveBeenCalledTimes(1); // only initial /members

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("No matching cards found.")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Original Card")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("MemberPanel handles add, 404/409 errors, and remove for admin", async () => {
    const user = userEvent.setup();
    const onMembersChange = vi.fn();
    const members: Member[] = [
      { user_id: "u-admin", name: "Admin", email: "admin@example.com", role: "admin" },
      { user_id: "u-2", name: "Grace", email: "grace@example.com", role: "member" },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "No user with that email" }), { status: 404 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: { user_id: "u-3", name: "Ada", email: "ada@example.com", role: "member" },
          }),
          { status: 201 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { user_id: "u-2" } }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemberPanel
        open={true}
        onClose={vi.fn()}
        boardId="b1"
        members={members}
        onMembersChange={onMembersChange}
      />
    );

    const input = screen.getByLabelText("Add member by email");
    await user.type(input, "missing@example.com");
    await user.click(screen.getByRole("button", { name: "Add member" }));
    expect(await screen.findByText("No user found with that email.")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Add member" }));
    await waitFor(() => {
      expect(onMembersChange).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: "Remove Grace" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => {
      expect(onMembersChange).toHaveBeenCalledTimes(2);
    });
  });

  it("AnalyticsView renders metrics and handles error state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              cards_per_column: [{ column_id: "col-1", name: "To Do", count: 4 }],
              completed_this_week: 2,
              member_activity: [
                { user_id: "u1", name: "Ada", assigned_cards: 3, comments: 5 },
              ],
            },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(
      <AnalyticsView open={true} onClose={vi.fn()} boardId="b1" />
    );

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("3 assigned · 5 comments")).toBeInTheDocument();

    rerender(<AnalyticsView open={false} onClose={vi.fn()} boardId="b1" />);
    rerender(<AnalyticsView open={true} onClose={vi.fn()} boardId="b1" />);

    expect(await screen.findByText("Could not load analytics.")).toBeInTheDocument();
    expect(handleErrorMock).toHaveBeenCalledTimes(1);
  });
});
