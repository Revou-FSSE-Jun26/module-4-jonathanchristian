import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardList } from "@/components/boards/BoardList";

const refreshMock = vi.fn();
const handleErrorMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

describe("Dashboard BoardList and CreateBoardModal", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    refreshMock.mockReset();
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders boards with role badges and links", () => {
    render(
      <BoardList
        initialBoards={[
          { board_id: "b1", name: "Roadmap", my_role: "admin", created_at: "2026-11-18T00:00:00Z" },
          { board_id: "b2", name: "Design", my_role: "member", created_at: "2026-11-18T00:00:00Z" },
          { board_id: "b3", name: "Public", my_role: "guest", created_at: "2026-11-18T00:00:00Z" },
        ]}
      />
    );

    expect(screen.getByText("Roadmap").closest("a")).toHaveAttribute("href", "/boards/b1");
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("Design").closest("a")).toHaveAttribute("href", "/boards/b2");
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByText("Public").closest("a")).toHaveAttribute("href", "/boards/b3");
    expect(screen.getByText("guest")).toBeInTheDocument();
  });

  it("renders empty state and error panel with retry", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BoardList initialBoards={[]} />);
    expect(screen.getByText("No boards yet")).toBeInTheDocument();

    rerender(<BoardList initialBoards={[]} initialError="Failed to load" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed to load");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("validates board name in CreateBoardModal and retains text on error", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "Server error" }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<BoardList initialBoards={[]} />);

    await user.click(screen.getAllByRole("button", { name: /Create board/i })[0]);
    await user.click(screen.getByRole("dialog").querySelector('button[type="submit"]')!);

    expect(screen.getByText("Board name is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    const input = screen.getByLabelText("Board name");
    await user.type(input, "My Board");
    await user.click(screen.getByRole("dialog").querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Board name")).toHaveValue("My Board");
  });
});
