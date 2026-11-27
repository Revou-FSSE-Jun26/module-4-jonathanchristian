import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";
import { BoardList } from "@/components/boards/BoardList";
import { formatCount } from "@/lib/format";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

describe("V12 Board counts (Property 83)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    window.sessionStorage.clear();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 83: Count text
  it("Property 83: formatCount uses singular only for 1 and plural for 0 and >= 2", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000 }),
        fc.constantFrom("member", "card"),
        (n, noun) => {
          const expected = n === 1 ? `1 ${noun}` : `${n} ${noun}s`;
          expect(formatCount(n, noun)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("renders singular and plural counts inside one link per board card", () => {
    render(
      <BoardList
        initialBoards={[
          {
            board_id: "b0",
            name: "Zero",
            my_role: "admin",
            created_at: "2026-11-18T00:00:00Z",
            member_count: 0,
            card_count: 0,
          },
          {
            board_id: "b1",
            name: "One",
            my_role: "admin",
            created_at: "2026-11-18T00:00:00Z",
            member_count: 1,
            card_count: 1,
          },
          {
            board_id: "b2",
            name: "Two",
            my_role: "member",
            created_at: "2026-11-18T00:00:00Z",
            member_count: 2,
            card_count: 2,
          },
        ]}
      />
    );

    expect(screen.getByText("0 members")).toBeInTheDocument();
    expect(screen.getByText("0 cards")).toBeInTheDocument();
    expect(screen.getByText("1 member")).toBeInTheDocument();
    expect(screen.getByText("1 card")).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
    expect(screen.getByText("2 cards")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("shows 1 member and 0 cards on newly created board from POST without a GET", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: {
            board_id: "b-new",
            name: "Fresh Board",
            my_role: "admin",
            created_at: "2026-11-27T00:00:00Z",
            updated_at: "2026-11-27T00:00:00Z",
            member_count: 1,
            card_count: 0,
          },
        }),
        { status: 201 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<BoardList initialBoards={[]} />);
    await user.click(screen.getAllByRole("button", { name: /Create board/i })[0]);
    await user.type(screen.getByLabelText("Board name"), "Fresh Board");
    await user.click(screen.getByRole("dialog").querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(screen.getByText("Fresh Board")).toBeInTheDocument();
    });
    expect(screen.getByText("1 member")).toBeInTheDocument();
    expect(screen.getByText("0 cards")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
  });
});
