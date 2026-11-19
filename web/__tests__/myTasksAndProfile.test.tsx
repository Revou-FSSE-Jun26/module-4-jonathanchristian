import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";
import { MyTasksList } from "@/components/cards/MyTasksList";
import { ProfileForm } from "@/components/users/ProfileForm";
import { groupByBoard } from "@/lib/format";
import type { CardSearchResult } from "@/lib/types";

const updateUserMock = vi.fn();
const handleErrorMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      user_id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      created_at: "2026-11-18T00:00:00Z",
    },
    updateUser: updateUserMock,
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

describe("MyTasksList and ProfileForm", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    updateUserMock.mockReset();
    handleErrorMock.mockReset();
    refreshMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 34: My Tasks grouping
  it("Property 34: groupByBoard creates one group per board_id and preserves all cards", () => {
    const cardArb = fc.record({
      card_id: fc.uuid(),
      board_id: fc.constantFrom("b1", "b2", "b3"),
      board_name: fc.constantFrom("Board A", "Board B", "Board C"),
      column_id: fc.constant("col-1"),
      column_name: fc.constant("To Do"),
      title: fc.string({ minLength: 1, maxLength: 20 }),
      description: fc.constant(null),
      due_date: fc.constant(null),
      labels: fc.constant([] as string[]),
      assignee: fc.constant(null),
      order: fc.constant(1),
      created_at: fc.constant("2026-11-18T00:00:00Z"),
      updated_at: fc.constant("2026-11-18T00:00:00Z"),
    });

    fc.assert(
      fc.property(fc.array(cardArb, { maxLength: 20 }), (cards) => {
        const groups = groupByBoard(cards);
        const boardIds = new Set(cards.map((c) => c.board_id));
        expect(groups).toHaveLength(boardIds.size);
        const total = groups.reduce((sum, g) => sum + g.cards.length, 0);
        expect(total).toBe(cards.length);
      }),
      { numRuns: 100 }
    );
  });

  it("MyTasksList renders grouped tasks, empty state, and error panel", () => {
    const tasks: CardSearchResult[] = [
      {
        card_id: "c1",
        board_id: "b1",
        board_name: "Roadmap",
        column_id: "col-1",
        column_name: "To Do",
        title: "Write docs",
        description: null,
        due_date: null,
        labels: [],
        assignee: null,
        order: 1,
        created_at: "2026-11-18T00:00:00Z",
        updated_at: "2026-11-18T00:00:00Z",
      },
    ];

    const { rerender } = render(<MyTasksList initialCards={tasks} />);
    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByText("No due date")).toBeInTheDocument();

    rerender(<MyTasksList initialCards={[]} />);
    expect(screen.getByText("No tasks assigned")).toBeInTheDocument();

    rerender(<MyTasksList initialCards={[]} initialError="Load failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Load failed");
  });

  it("ProfileForm pre-fills values, has no password field, handles 200 and 409", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Email in use" }), { status: 409 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              user_id: "u1",
              name: "Ada King",
              email: "ada@example.com",
              created_at: "2026-11-18T00:00:00Z",
            },
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<ProfileForm />);
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");

    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("This email is already in use.")).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Ada King");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Ada King" })
      );
    });
  });
});
