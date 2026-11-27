import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardView } from "@/components/boards/BoardView";
import { resolveCardParam } from "@/lib/deepLink";
import type { BoardDetail, Role } from "@/lib/types";

const handleErrorMock = vi.fn();
const showErrorMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { user_id: "u1", name: "User", email: "u@b.c", created_at: "" },
    status: "authenticated",
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: (...args: unknown[]) => showErrorMock(...args),
  showLoading: vi.fn(),
}));

function makeBoard(role: Role = "member"): BoardDetail {
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
            title: "Deep linked task",
            description: "Task body",
            due_date: null,
            labels: [],
            assignee: null,
            status: "IN_PROGRESS",
            completed_at: null,
            order: 1,
            created_at: "2026-11-18T00:00:00Z",
            updated_at: "2026-11-18T00:00:00Z",
            checklist_done: 0,
            checklist_total: 0,
            link_count: 0,
          },
        ],
      },
    ],
  };
}

function stubBoardAndCardFetch() {
  const fetchMock = vi.fn((url: string) => {
    const target = String(url);
    if (target.endsWith("/members")) {
      return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    }
    if (target.includes("/api/cards/c1/comments")) {
      return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    }
    if (target.endsWith("/api/cards/c1")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              ...makeBoard().columns[0].cards[0],
              checklist: [],
              links: [],
            },
          }),
          { status: 200 }
        )
      );
    }
    return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("V12 BoardView deep link (Property 80)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    handleErrorMock.mockReset();
    showErrorMock.mockReset();
    window.history.replaceState(null, "", "/boards/b1?card=c1&filter=open#top");
  });

  afterEach(() => {
    cleanup();
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 80: Deep-link resolution and the open-once rule
  it("Property 80: opens modal on first render for known card, strips card param on close, and never reopens on rerender", async () => {
    const user = userEvent.setup();
    const fetchMock = stubBoardAndCardFetch();
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    const { rerender } = render(<BoardView board={makeBoard("member")} initialCardId="c1" />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByDisplayValue("Deep linked task")).toBeInTheDocument();
    // Existing card mode (isNew = false): Delete card button is shown for member
    expect(within(dialog).getByRole("button", { name: "Delete card" })).toBeInTheDocument();

    const cardGets = fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("/api/cards/c1"));
    expect(cardGets).toHaveLength(1);

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy.mock.calls[0][2]).toBe("/boards/b1?filter=open#top");

    // Re-render with updated board does not reopen the modal
    rerender(<BoardView board={makeBoard("member")} initialCardId="c1" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens no modal and shows no toast for unknown card id", () => {
    const fetchMock = stubBoardAndCardFetch();
    window.history.replaceState(null, "", "/boards/b1?card=missing");

    render(<BoardView board={makeBoard("member")} initialCardId="missing" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(handleErrorMock).not.toHaveBeenCalled();
    expect(showErrorMock).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes("/api/cards/"))).toHaveLength(0);
  });

  it("opens read-only modal for guest and uses first value when repeated", async () => {
    stubBoardAndCardFetch();
    const firstId = resolveCardParam(["c1", "c2"]);
    expect(firstId).toBe("c1");

    render(<BoardView board={makeBoard("guest")} initialCardId={firstId} />);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByDisplayValue("Deep linked task")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Delete card" })).not.toBeInTheDocument();
  });

  it("leaves history untouched when closing a click-opened card", async () => {
    const user = userEvent.setup();
    stubBoardAndCardFetch();
    window.history.replaceState(null, "", "/boards/b1");
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    render(<BoardView board={makeBoard("member")} initialCardId={null} />);
    await user.click(screen.getByText("Deep linked task"));

    const dialog = await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
