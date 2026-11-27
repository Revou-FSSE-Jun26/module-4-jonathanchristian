import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardView } from "@/components/boards/BoardView";
import { BOARD_PATCHES_KEY, parsePatches } from "@/lib/boardPatches";
import type { BoardDetail, Role } from "@/lib/types";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const handleErrorMock = vi.fn();
const showSuccessMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { user_id: "u1", name: "Admin", email: "a@b.c", created_at: "" },
    status: "authenticated",
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: vi.fn(),
  showLoading: vi.fn(),
}));

function makeBoard(role: Role): BoardDetail {
  return {
    board_id: "b1",
    name: "Roadmap",
    my_role: role,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
    columns: [],
  };
}

describe("V12 Board rename and delete controls", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    window.sessionStorage.clear();
    pushMock.mockReset();
    refreshMock.mockReset();
    handleErrorMock.mockReset();
    showSuccessMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 74: Frontend can and role controls
  it("Property 74 (edit_board, delete_board): renders rename and delete controls only for admin", () => {
    const cases: Array<[Role, boolean]> = [
      ["admin", true],
      ["manager", false],
      ["member", false],
      ["guest", false],
    ];

    for (const [role, expected] of cases) {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      );
      render(<BoardView board={makeBoard(role)} />);
      if (expected) {
        expect(screen.getByRole("button", { name: "Rename board" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Delete board" })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole("button", { name: "Rename board" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Delete board" })).not.toBeInTheDocument();
      }
      cleanup();
    }
  });

  it("validates rename input, skips same-name PATCH, sends trimmed PATCH, and handles failure", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((url: string, _init?: RequestInit) => {
      if (String(url).endsWith("/members")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              board_id: "b1",
              name: "New Roadmap",
              my_role: "admin",
              created_at: "2026-11-18T00:00:00Z",
              updated_at: "2026-11-27T12:00:00Z",
              member_count: 1,
              card_count: 0,
            },
          }),
          { status: 200 }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BoardView board={makeBoard("admin")} />);

    // Invalid: empty, whitespace-only, and 101 chars
    await user.click(screen.getByRole("button", { name: "Rename board" }));
    const dialog = screen.getByRole("dialog");
    const input = within(dialog).getByLabelText("Board name");

    await user.clear(input);
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Board name is required");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "   " } });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Board name is required");
    expect(input).toHaveValue("   ");

    const overLong = "a".repeat(101);
    fireEvent.change(input, { target: { value: overLong } });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(within(dialog).getByRole("alert")).toBeInTheDocument();
    expect(input).toHaveValue(overLong);
    expect(fetchMock.mock.calls.filter((c) => c[1]?.method === "PATCH")).toHaveLength(0);

    // Same name after trim -> closes with no request
    fireEvent.change(input, { target: { value: "  Roadmap  " } });
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(fetchMock.mock.calls.filter((c) => c[1]?.method === "PATCH")).toHaveLength(0);

    // Valid trimmed PATCH -> updates h1, writes sessionStorage patch, shows toast
    await user.click(screen.getByRole("button", { name: "Rename board" }));
    const dialog2 = screen.getByRole("dialog");
    const input2 = within(dialog2).getByLabelText("Board name");
    fireEvent.change(input2, { target: { value: "  New Roadmap  " } });
    await user.click(within(dialog2).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("New Roadmap");
    expect(showSuccessMock).toHaveBeenCalledWith("Board renamed.");
    const patchCalls = fetchMock.mock.calls.filter((c) => c[1]?.method === "PATCH");
    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0][1]?.body).toBe(JSON.stringify({ name: "New Roadmap" }));

    const stored = parsePatches(window.sessionStorage.getItem(BOARD_PATCHES_KEY));
    expect(stored.renamed.b1).toEqual({
      name: "New Roadmap",
      updated_at: "2026-11-27T12:00:00Z",
    });

    // Failing PATCH -> keeps modal open, retains text, keeps h1, calls handleError once
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify({ error: "Server error" }), { status: 500 }))
    );
    await user.click(screen.getByRole("button", { name: "Rename board" }));
    const dialog3 = screen.getByRole("dialog");
    const input3 = within(dialog3).getByLabelText("Board name");
    fireEvent.change(input3, { target: { value: "Failed Name" } });
    await user.click(within(dialog3).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByLabelText("Board name")).toHaveValue(
      "Failed Name"
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("New Roadmap");
  });

  it("handles delete cancel, busy confirm with Escape guard, patch + redirect, and delete failure", async () => {
    const user = userEvent.setup();
    let resolveDelete: ((res: Response) => void) | null = null;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (String(url).endsWith("/members")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      if (init?.method === "DELETE") {
        return new Promise<Response>((resolve) => {
          resolveDelete = resolve;
        });
      }
      return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BoardView board={makeBoard("admin")} />);

    // Cancel sends no request
    await user.click(screen.getByRole("button", { name: "Delete board" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent('Delete "Roadmap"? Its columns, cards, and comments are deleted with it.');
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter((c) => c[1]?.method === "DELETE")).toHaveLength(0);

    // Confirm -> busy disables buttons, Escape ignored, then resolves -> patch + push("/")
    await user.click(screen.getByRole("button", { name: "Delete board" }));
    const confirmDialog = screen.getByRole("dialog");
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete board" }));

    await waitFor(() => {
      expect(within(confirmDialog).getByRole("button", { name: "Delete board" })).toBeDisabled();
      expect(within(confirmDialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    });

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    resolveDelete!(new Response(JSON.stringify({ data: { board_id: "b1" } }), { status: 200 }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
    });
    expect(showSuccessMock).toHaveBeenCalledWith("Board deleted.");
    const stored = parsePatches(window.sessionStorage.getItem(BOARD_PATCHES_KEY));
    expect(stored.deleted).toContain("b1");

    // Failing DELETE -> keeps dialog open, re-enables buttons, calls handleError once
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (String(url).endsWith("/members")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      if (init?.method === "DELETE") {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Cannot delete" }), { status: 500 })
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    });

    cleanup();
    pushMock.mockReset();
    handleErrorMock.mockReset();
    render(<BoardView board={makeBoard("admin")} />);

    await user.click(screen.getByRole("button", { name: "Delete board" }));
    const failDialog = screen.getByRole("dialog");
    await user.click(within(failDialog).getByRole("button", { name: "Delete board" }));

    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(failDialog).getByRole("button", { name: "Delete board" })).toBeEnabled();
    expect(within(failDialog).getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
