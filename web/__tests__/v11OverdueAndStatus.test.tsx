import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "@/components/NotificationBell";
import { CardMetaRow } from "@/components/cards/CardMetaRow";
import { MyTasksList } from "@/components/cards/MyTasksList";
import { NotificationList } from "@/components/notifications/NotificationList";
import { formatOverdue } from "@/lib/overdue";
import { CARD_STATUSES, STATUS_STYLE } from "@/lib/status";
import { AuthContext } from "@/lib/authContext";
import type {
  AuthContextValue,
  BoardCard,
  CardSearchResult,
  OverdueItem,
} from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

function makeAuth(): AuthContextValue {
  return {
    user: {
      user_id: "u1",
      name: "Alice",
      email: "alice@example.com",
      created_at: "2026-11-18T00:00:00Z",
    },
    accessToken: "tok",
    refreshToken: "ref",
    status: "authenticated",
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    setAccessToken: vi.fn(),
  };
}

function makeBoardCard(
  due_date: string | null,
  status: BoardCard["status"]
): BoardCard {
  return {
    card_id: "c1",
    board_id: "b1",
    column_id: "col-1",
    title: "Card",
    description: null,
    due_date,
    labels: [],
    assignee: null,
    status,
    completed_at: null,
    order: 1,
    checklist_done: 0,
    checklist_total: 0,
    link_count: 0,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
  };
}

describe("V11 overdue and status-map UI tests (Task 51.4)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    vi.useFakeTimers();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 65: Overdue chip and text (component part)
  it("Property 65: shows Overdue chip iff due < today and status !== DONE, and formats 1 vs N days overdue", () => {
    expect(formatOverdue(1)).toBe("1 day overdue");
    expect(formatOverdue(4)).toBe("4 days overdue");

    const { rerender } = render(
      <CardMetaRow card={makeBoardCard("2026-11-26", "URGENT")} today="2026-11-27" />
    );
    expect(screen.getByText("Overdue")).toBeInTheDocument();

    rerender(
      <CardMetaRow card={makeBoardCard("2026-11-26", "DONE")} today="2026-11-27" />
    );
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();

    rerender(
      <CardMetaRow card={makeBoardCard("2026-11-27", "NOT_STARTED")} today="2026-11-27" />
    );
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("loads overdue on mount and on open (never on a timer), excludes overdue from bell count, and checks empty-state rule", async () => {
    const overdueItems: OverdueItem[] = [
      {
        card_id: "c1",
        title: "Late report",
        due_date: "2026-11-26",
        status: "URGENT",
        column_name: "To Do",
        board_id: "b1",
        board_name: "Ops",
        days_overdue: 1,
      },
    ];

    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/api/notifications/overdue")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ data: { items: overdueItems, total: 1 } }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: { items: [], page: 1, per_page: 20, total: 0, unread_count: 0 },
          }),
          { status: 200 }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthContext.Provider value={makeAuth()}>
        <NotificationBell />
      </AuthContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    const overdueCallsAfterMount = fetchMock.mock.calls.filter(([u]) =>
      String(u).includes("/api/notifications/overdue")
    ).length;
    expect(overdueCallsAfterMount).toBe(1);
    // Overdue items do not show a bell unread badge
    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();

    // Advance 10 minutes: stored notifications poll, overdue does NOT poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    });
    const overdueCallsAfter10Min = fetchMock.mock.calls.filter(([u]) =>
      String(u).includes("/api/notifications/overdue")
    ).length;
    expect(overdueCallsAfter10Min).toBe(1);

    // Opening the notification list triggers one overdue refresh and shows the Overdue group
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
      await Promise.resolve();
    });
    const overdueCallsAfterOpen = fetchMock.mock.calls.filter(([u]) =>
      String(u).includes("/api/notifications/overdue")
    ).length;
    expect(overdueCallsAfterOpen).toBe(2);
    expect(screen.getByText("1 day overdue")).toBeInTheDocument();
    expect(screen.getByText("Late report")).toBeInTheDocument();
    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();

    // Empty state shows only when both lists are empty
    const emptyList = render(
      <NotificationList items={[]} overdueItems={[]} onMarkRead={vi.fn()} />
    );
    expect(screen.getByText("No notifications yet.")).toBeInTheDocument();
    emptyList.unmount();
  });

  // Feature: kano, Property 62: Status style map (component use)
  it("Property 62 (component): board Card and My Tasks show the same StatusBadge for all four statuses", () => {
    for (const status of CARD_STATUSES) {
      const boardCard = makeBoardCard(null, status);
      const taskCard: CardSearchResult = {
        ...boardCard,
        board_name: "Ops",
        column_name: "To Do",
      };

      const cardView = render(<CardMetaRow card={boardCard} today="2026-11-27" />);
      const cardBadge = screen.getByText(STATUS_STYLE[status].label);
      const cardBadgeClass = cardBadge.className;
      cardView.unmount();

      const tasksView = render(<MyTasksList initialCards={[taskCard]} />);
      const tasksBadge = screen.getByText(STATUS_STYLE[status].label);
      expect(tasksBadge.className).toBe(cardBadgeClass);
      tasksView.unmount();
    }
  });
});
