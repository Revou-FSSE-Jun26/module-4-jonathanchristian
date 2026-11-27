import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardRoleProvider } from "@/components/boards/BoardRoleContext";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import type { Card, CardStatus, Comment } from "@/lib/types";

const handleErrorMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      user_id: "u-current",
      name: "Current User",
      email: "current@example.com",
      created_at: "2026-11-18T00:00:00Z",
    },
    status: "authenticated",
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

function makeCard(status: CardStatus = "NOT_STARTED"): Card {
  return {
    card_id: "c1",
    board_id: "b1",
    column_id: "col-1",
    title: "Initial Title",
    description: "Initial desc",
    due_date: "2026-12-01",
    labels: ["docs"],
    assignee: { user_id: "u-current", name: "Current User" },
    status,
    completed_at: status === "DONE" ? "2026-11-20T00:00:00Z" : null,
    order: 1,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
  };
}

describe("CardDetailModal V6 status and guest view", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows three status options preselected, sends status-only PATCH, and excludes guests from assignee", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    const card = makeCard("IN_PROGRESS");

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/comments")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      if (url.endsWith("/cards/c1") && (!init?.method || init.method === "GET")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                ...card,
                checklist_done: 0,
                checklist_total: 0,
                link_count: 0,
                checklist: [],
                links: [],
              },
            }),
            { status: 200 }
          )
        );
      }
      if (url.endsWith("/cards/c1") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { ...card, status: "DONE" } }), { status: 200 })
        );
      }
      return Promise.reject(new Error("Unexpected call"));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <BoardRoleProvider role="member">
        <CardDetailModal
          card={card}
          members={[
            { user_id: "u-current", name: "Current User", email: "c@e.com", role: "admin" },
            { user_id: "u-guest", name: "Guest User", email: "g@e.com", role: "guest" },
          ]}
          onClose={onClose}
          onUpdated={onUpdated}
          onDeleted={vi.fn()}
        />
      </BoardRoleProvider>
    );

    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(statusSelect.value).toBe("IN_PROGRESS");
    expect(Array.from(statusSelect.options).map((o) => o.text)).toEqual([
      "Not started",
      "In progress",
      "Urgent",
      "Done",
    ]);

    const assigneeSelect = screen.getByLabelText("Assignee") as HTMLSelectElement;
    expect(Array.from(assigneeSelect.options).map((o) => o.text)).toEqual([
      "Unassigned",
      "Current User",
    ]);

    await user.selectOptions(statusSelect, "DONE");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: "DONE" }));
    });
    const patchCall = fetchMock.mock.calls.find(
      ([u, init]) => u.endsWith("/cards/c1") && init?.method === "PATCH"
    );
    expect(JSON.parse(patchCall![1]!.body as string)).toEqual({ status: "DONE" });
  });

  it("keeps modal open and entered status on PATCH failure", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    const card = makeCard("NOT_STARTED");

    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url.endsWith("/comments")) {
          return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
        }
        if (url.endsWith("/cards/c1") && (!init?.method || init.method === "GET")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  ...card,
                  checklist_done: 0,
                  checklist_total: 0,
                  link_count: 0,
                  checklist: [],
                  links: [],
                },
              }),
              { status: 200 }
            )
          );
        }
        if (url.endsWith("/cards/c1") && init?.method === "PATCH") {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
          );
        }
        return Promise.reject(new Error("Unexpected call"));
      })
    );

    render(
      <BoardRoleProvider role="member">
        <CardDetailModal
          card={card}
          members={[]}
          onClose={onClose}
          onUpdated={onUpdated}
          onDeleted={vi.fn()}
        />
      </BoardRoleProvider>
    );

    await user.selectOptions(screen.getByLabelText("Status"), "IN_PROGRESS");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Status") as HTMLSelectElement).value).toBe("IN_PROGRESS");
  });

  it("Property 55 (modal): renders guest view read-only with disabled fields and no edit/delete/comment controls", async () => {
    const comments: Comment[] = [
      {
        comment_id: "cm-owned",
        card_id: "c1",
        content: "Guest authored earlier",
        author: { user_id: "u-current", name: "Current User" },
        created_at: "2026-11-18T10:00:00Z",
        updated_at: "2026-11-18T10:00:00Z",
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: comments }), { status: 200 }))
    );

    render(
      <BoardRoleProvider role="guest">
        <CardDetailModal
          card={makeCard("IN_PROGRESS")}
          members={[]}
          onClose={vi.fn()}
          onUpdated={vi.fn()}
          onDeleted={vi.fn()}
        />
      </BoardRoleProvider>
    );

    expect(await screen.findByText("Guest authored earlier")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeDisabled();
    expect(screen.getByLabelText("Description")).toBeDisabled();
    expect(screen.getByLabelText("Due date")).toBeDisabled();
    expect(screen.getByLabelText("Assignee")).toBeDisabled();
    expect(screen.getByLabelText("Status")).toBeDisabled();
    expect(screen.getByLabelText("Labels (comma separated)")).toBeDisabled();

    expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete card" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Post comment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit comment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete comment" })).not.toBeInTheDocument();
  });
});
