import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardAccessMessage } from "@/components/boards/BoardAccessMessage";
import { BoardView } from "@/components/boards/BoardView";
import { AuthContext } from "@/lib/authContext";
import type { AuthContextValue, BoardDetail, Role } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

function makeAuth(): AuthContextValue {
  return {
    user: {
      user_id: "u1",
      name: "Ada",
      email: "ada@example.com",
      created_at: "2026-11-18T00:00:00Z",
    },
    accessToken: "acc",
    refreshToken: "ref",
    status: "authenticated",
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    setAccessToken: vi.fn(),
  };
}

function makeBoard(role: Role): BoardDetail {
  return {
    board_id: "b1",
    name: "Product Board",
    my_role: role,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
    columns: [
      {
        column_id: "col1",
        board_id: "b1",
        name: "To do",
        order: 1,
        cards: [],
      },
    ],
  };
}

describe("Board separator and toolbar placement (Task 37.3)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders exactly one separator between board-toolbar and board-content for admin, member, and guest", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    for (const role of ["admin", "member", "guest"] as Role[]) {
      const { unmount } = render(
        <AuthContext.Provider value={makeAuth()}>
          <BoardView board={makeBoard(role)} />
        </AuthContext.Provider>
      );

      const separators = screen.getAllByRole("separator");
      expect(separators).toHaveLength(1);
      const sep = separators[0];
      expect(sep.className).toContain("h-px");
      expect(sep.className).toContain("bg-line");

      const toolbar = screen.getByTestId("board-toolbar");
      const content = screen.getByTestId("board-content");

      expect(
        toolbar.compareDocumentPosition(sep) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(
        sep.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();

      for (const el of [toolbar, content, toolbar.parentElement!]) {
        const classes = el.className.split(/\s+/);
        expect(classes.some((c) => c === "border" || c.startsWith("border-t") || c.startsWith("border-b"))).toBe(false);
      }

      if (role === "guest" || role === "member") {
        expect(screen.queryByRole("button", { name: /add column/i })).not.toBeInTheDocument();
      } else {
        const addColBtn = screen.getByRole("button", { name: /add column/i });
        expect(within(toolbar).queryByRole("button", { name: /add column/i })).not.toBeInTheDocument();
        expect(within(content).getByRole("button", { name: /add column/i })).toBe(addColBtn);
      }

      unmount();
    }
  });

  it("keeps the single separator in the search-results state and renders none in 403/404 states", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        )
      )
    );

    const { unmount } = render(
      <AuthContext.Provider value={makeAuth()}>
        <BoardView board={makeBoard("admin")} />
      </AuthContext.Provider>
    );

    await user.type(screen.getByPlaceholderText(/search/i), "alpha");
    await waitFor(() => {
      expect(screen.getByText("No matching cards found.")).toBeInTheDocument();
    });
    expect(screen.getAllByRole("separator")).toHaveLength(1);
    unmount();

    for (const statusCode of [403, 404] as const) {
      const res = render(<BoardAccessMessage statusCode={statusCode} />);
      expect(screen.queryAllByRole("separator")).toHaveLength(0);
      res.unmount();
    }
  });
});
