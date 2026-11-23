import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";
import { MyTasksList } from "@/components/cards/MyTasksList";
import { ProfileForm } from "@/components/users/ProfileForm";
import { groupByBoard } from "@/lib/format";
import { CARD_STATUSES } from "@/lib/status";
import type { CardSearchResult } from "@/lib/types";

const updateUserMock = vi.fn();
const handleErrorMock = vi.fn();
const refreshMock = vi.fn();
const mockUser = {
  user_id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  created_at: "2026-11-18T00:00:00Z",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: refreshMock }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
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
      status: fc.constantFrom(...CARD_STATUSES),
      completed_at: fc.constant(null),
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

  it("MyTasksList renders grouped tasks with StatusBadge (including Done), empty state, and error panel", () => {
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
        status: "NOT_STARTED",
        completed_at: null,
        order: 1,
        created_at: "2026-11-18T00:00:00Z",
        updated_at: "2026-11-18T00:00:00Z",
      },
      {
        card_id: "c2",
        board_id: "b1",
        board_name: "Roadmap",
        column_id: "col-2",
        column_name: "Shipped",
        title: "Release V6",
        description: null,
        due_date: null,
        labels: [],
        assignee: null,
        status: "DONE",
        completed_at: "2026-11-20T00:00:00Z",
        order: 2,
        created_at: "2026-11-18T00:00:00Z",
        updated_at: "2026-11-20T00:00:00Z",
      },
    ];

    const { rerender } = render(<MyTasksList initialCards={tasks} />);
    expect(screen.getByText("Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.getByText("Release V6")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();

    rerender(<MyTasksList initialCards={[]} />);
    expect(screen.getByText("No tasks assigned")).toBeInTheDocument();

    rerender(<MyTasksList initialCards={[]} initialError="Load failed" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Load failed");
  });

  it("ProfileForm renders fixed email as text, validates name and password section, and handles 200 and 400 current_password", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "current_password: does not match" }),
          { status: 400 }
        )
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
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Email" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");

    // Name 0 and 101 validation
    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Name is required")).toBeInTheDocument();

    await user.type(nameInput, "a".repeat(101));
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Name must be at most 100 characters")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    // Valid name only -> body has only { name }, no email, no password
    await user.clear(nameInput);
    await user.type(nameInput, "Ada King");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledTimes(1);
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ name: "Ada King" });

    // One-filled password section error
    const curPw = screen.getByLabelText("Current password");
    const newPw = screen.getByLabelText("New password");
    await user.type(curPw, "oldpass1");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("New password is required")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 7-char new password error
    await user.type(newPw, "1234567");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 8-char new password -> 400 naming current_password keeps name and sets field error
    await user.type(newPw, "8");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("current_password: does not match")).toBeInTheDocument();
    expect(nameInput).toHaveValue("Ada King");
    expect(updateUserMock).toHaveBeenCalledTimes(1);
    expect(handleErrorMock).not.toHaveBeenCalled();

    // Retry with valid current_password -> 200 clears password inputs
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledTimes(2);
    });
    expect(curPw).toHaveValue("");
    expect(newPw).toHaveValue("");
    expect(JSON.parse(fetchMock.mock.calls[2][1]!.body as string)).toEqual({
      name: "Ada King",
      password: "12345678",
      current_password: "oldpass1",
    });
  });
});
