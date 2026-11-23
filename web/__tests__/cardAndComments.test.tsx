import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CommentList } from "@/components/comments/CommentList";
import { diffCardFields } from "@/lib/format";
import { CARD_STATUSES } from "@/lib/status";
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

describe("CardDetailModal and Comments", () => {
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

  // Feature: kano, Property 35: Changed-fields diff
  it("Property 35: diffCardFields returns only changed fields and empty for unchanged", () => {
    const fieldsArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
      due_date: fc.option(fc.constant("2026-12-01"), { nil: null }),
      labels: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 4 }),
      assignee_id: fc.option(fc.uuid(), { nil: null }),
      status: fc.constantFrom(...CARD_STATUSES),
    });

    fc.assert(
      fc.property(fieldsArb, fieldsArb, (orig, edited) => {
        expect(diffCardFields(orig, orig)).toEqual({});
        const diff = diffCardFields(orig, edited);
        if ("title" in diff) expect(diff.title).not.toBe(orig.title);
        if ("description" in diff) expect(diff.description).not.toBe(orig.description);
        if ("due_date" in diff) expect(diff.due_date).not.toBe(orig.due_date);
        if ("assignee_id" in diff) expect(diff.assignee_id).not.toBe(orig.assignee_id);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: kano, Property 34: Owned-comment controls (comment part)
  it("Property 34: CommentList shows edit/delete only for owned comments and handles add/edit/delete", async () => {
    const user = userEvent.setup();
    const comments: Comment[] = [
      {
        comment_id: "cm-owned",
        card_id: "c1",
        content: "My comment",
        author: { user_id: "u-current", name: "Current User" },
        created_at: "2026-11-18T10:00:00Z",
        updated_at: "2026-11-18T10:00:00Z",
      },
      {
        comment_id: "cm-other",
        card_id: "c1",
        content: "Other comment",
        author: { user_id: "u-other", name: "Other User" },
        created_at: "2026-11-18T10:05:00Z",
        updated_at: "2026-11-18T10:05:00Z",
      },
    ];

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/comments") && (!init?.method || init.method === "GET")) {
        return Promise.resolve(new Response(JSON.stringify({ data: comments }), { status: 200 }));
      }
      if (url.endsWith("/comments") && init?.method === "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                comment_id: "cm-new",
                card_id: "c1",
                content: "Added comment",
                author: { user_id: "u-current", name: "Current User" },
                created_at: "2026-11-18T10:10:00Z",
                updated_at: "2026-11-18T10:10:00Z",
              },
            }),
            { status: 201 }
          )
        );
      }
      if (url.endsWith("/comments/cm-owned") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { ...comments[0], content: "Edited comment" },
            }),
            { status: 200 }
          )
        );
      }
      if (url.endsWith("/comments/cm-owned") && init?.method === "DELETE") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { comment_id: "cm-owned" } }), { status: 200 })
        );
      }
      return Promise.reject(new Error("Unexpected call"));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<CommentList cardId="c1" />);
    expect(await screen.findByText("My comment")).toBeInTheDocument();
    expect(screen.getByText("Other comment")).toBeInTheDocument();

    // Only 1 Edit button and 1 Delete button (for owned comment only)
    expect(screen.getAllByRole("button", { name: "Edit comment" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Delete comment" })).toHaveLength(1);

    // Whitespace-only blocked
    await user.type(screen.getByLabelText("Add a comment"), "   ");
    await user.click(screen.getByRole("button", { name: "Post comment" }));
    expect(screen.getByText("Comment is required")).toBeInTheDocument();

    // Add comment
    await user.clear(screen.getByLabelText("Add a comment"));
    await user.type(screen.getByLabelText("Add a comment"), "Added comment");
    await user.click(screen.getByRole("button", { name: "Post comment" }));
    expect(await screen.findByText("Added comment")).toBeInTheDocument();
    expect(screen.getByLabelText("Add a comment")).toHaveValue("");

    // Edit owned comment
    await user.click(screen.getAllByRole("button", { name: "Edit comment" })[0]);
    const editBox = screen.getByLabelText("Edit comment text");
    await user.clear(editBox);
    await user.type(editBox, "Edited comment");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Edited comment")).toBeInTheDocument();

    // Delete owned comment
    await user.click(screen.getAllByRole("button", { name: "Delete comment" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.queryByText("Edited comment")).not.toBeInTheDocument();
    });
  });

  it("CardDetailModal sends only changed fields on save and deletes with ConfirmDialog", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const onDeleted = vi.fn();
    const onClose = vi.fn();
    const card = makeCard();

    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/comments")) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      }
      if (url.endsWith("/cards/c1") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { ...card, title: "Updated Title" } }), {
            status: 200,
          })
        );
      }
      if (url.endsWith("/cards/c1") && init?.method === "DELETE") {
        return Promise.resolve(
          new Response(JSON.stringify({ data: { card_id: "c1" } }), { status: 200 })
        );
      }
      return Promise.reject(new Error("Unexpected call"));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CardDetailModal
        card={card}
        members={[{ user_id: "u-current", name: "Current User", email: "c@e.com", role: "admin" }]}
        onClose={onClose}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
      />
    );

    const titleInput = screen.getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledTimes(1);
    });
    const patchCall = fetchMock.mock.calls.find(
      ([u, init]) => u.endsWith("/cards/c1") && init?.method === "PATCH"
    );
    expect(JSON.parse(patchCall![1]!.body as string)).toEqual({ title: "Updated Title" });

    // Delete card
    await user.click(screen.getByRole("button", { name: "Delete card" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledWith("c1");
    });
  });
});
