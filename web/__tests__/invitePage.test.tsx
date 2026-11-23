import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteJoinCard } from "@/components/boards/InviteJoinCard";

const pushMock = vi.fn();
const handleErrorMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

describe("InviteJoinCard (/invite/[token])", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    pushMock.mockReset();
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders board name, role, and joins via POST accept", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { board_id: "b1", role: "member" } }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <InviteJoinCard
        token="tok-1"
        info={{ board_id: "b1", board_name: "Roadmap", role: "member", current_role: null }}
      />
    );

    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Member: can edit")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Join" }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/boards/b1");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/invites/tok-1/accept",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("shows current role and open-board link when acceptOutcome is none", () => {
    render(
      <InviteJoinCard
        token="tok-2"
        info={{ board_id: "b1", board_name: "Roadmap", role: "guest", current_role: "admin" }}
      />
    );

    expect(screen.getByText("Guest: view only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open board" })).toHaveAttribute("href", "/boards/b1");
  });

  it("renders not-found message with link to / and no Join button on 404", () => {
    render(<InviteJoinCard token="bad" info={null} notFound={true} />);

    expect(screen.getByText("Invitation not found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute("href", "/");
  });
});
