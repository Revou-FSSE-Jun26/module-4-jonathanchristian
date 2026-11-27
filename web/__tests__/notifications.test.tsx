import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";
import { NotificationBell } from "@/components/NotificationBell";
import { formatBadge } from "@/lib/format";

const handleErrorMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ status: "authenticated", logout: vi.fn() }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

function makeNotification(id: string, isRead = false) {
  return {
    notification_id: id,
    type: "assignment" as const,
    message: `Assigned ${id}`,
    card_id: "c1",
    board_id: "b1",
    is_read: isRead,
    created_at: "2026-11-18T10:00:00Z",
  };
}

describe("Notifications and formatBadge", () => {
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

  // Feature: kano, Property 32: Notification badge and unread count
  it("Property 32: formatBadge formats 0, 1..99, and 100+ consistently", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 500 }), (n) => {
        const badge = formatBadge(n);
        if (n === 0) {
          expect(badge).toBe("");
        } else if (n <= 99) {
          expect(badge).toBe(String(n));
        } else {
          expect(badge).toBe("99+");
        }
      }),
      { numRuns: 150 }
    );
  });

  it("shows 1, 99, 99+ and hides badge at 0; polls every 30s and stops on unmount", async () => {
    vi.useFakeTimers();
    let unread = 0;
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/api/notifications/overdue")) {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { items: [], total: 0 } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: { items: [], page: 1, per_page: 20, total: 0, unread_count: unread },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const pollCalls = () =>
      fetchMock.mock.calls.filter(([u]) => String(u).includes("/api/notifications?")).length;

    const { unmount } = render(<NotificationBell />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
    expect(pollCalls()).toBe(1);

    unread = 1;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(screen.getByTestId("notification-badge")).toHaveTextContent("1");
    expect(pollCalls()).toBe(2);

    unread = 99;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(screen.getByTestId("notification-badge")).toHaveTextContent("99");

    unread = 120;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(screen.getByTestId("notification-badge")).toHaveTextContent("99+");

    const callsBeforeUnmount = fetchMock.mock.calls.length;
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(callsBeforeUnmount);
  });

  it("marks notification read on success and calls handleError on failure", async () => {
    const user = userEvent.setup();
    let shouldFail = false;

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === "PATCH" && url.includes("/read")) {
        if (shouldFail) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ data: makeNotification("n1", true) }), { status: 200 })
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              items: [makeNotification("n1", false)],
              page: 1,
              per_page: 20,
              total: 1,
              unread_count: 1,
            },
          }),
          { status: 200 }
        )
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<NotificationBell />);
    await screen.findByTestId("notification-badge");

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    shouldFail = true;
    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(handleErrorMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("notification-badge")).toHaveTextContent("1");

    shouldFail = false;
    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
  });
});
