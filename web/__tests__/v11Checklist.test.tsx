import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardMetaRow } from "@/components/cards/CardMetaRow";
import { ChecklistSection } from "@/components/cards/ChecklistSection";
import type { BoardCard, ChecklistItem } from "@/lib/types";

const handleErrorMock = vi.fn();

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

function makeCard(done: number, total: number): BoardCard {
  return {
    card_id: "c1",
    board_id: "b1",
    column_id: "col-1",
    title: "Checklist card",
    description: null,
    due_date: null,
    labels: [],
    assignee: null,
    status: "IN_PROGRESS",
    completed_at: null,
    order: 1,
    checklist_done: done,
    checklist_total: total,
    link_count: 0,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
  };
}

function makeItems(count: number, doneCount = 0): ChecklistItem[] {
  return Array.from({ length: count }, (_, i) => ({
    checklist_item_id: `ci-${i + 1}`,
    card_id: "c1",
    text: `Item ${i + 1}`,
    is_done: i < doneCount,
    order: i + 1,
  }));
}

describe("V11 checklist tests (Task 51.2)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 66: Checklist rules (card face & section)
  it("Property 66: shows 3/5 and 60% bar for 3 done of 5, and hides indicator at 0", () => {
    const { container, rerender } = render(
      <CardMetaRow card={makeCard(3, 5)} today="2026-11-27" />
    );
    expect(screen.getByText("3/5")).toBeInTheDocument();
    const bar = container.querySelector('[style*="width: 60%"]');
    expect(bar).not.toBeNull();

    rerender(<CardMetaRow card={makeCard(0, 0)} today="2026-11-27" />);
    expect(screen.queryByText("0/0")).not.toBeInTheDocument();
    expect(container.querySelector('[style*="width:"]')).toBeNull();
  });

  // Feature: kano, Property 67: Optimistic checklist toggle
  it("Property 67: applies toggle optimistically and reverts with one handleError call on failure", async () => {
    const user = userEvent.setup();
    let rejectPatch!: (err: Error) => void;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejectPatch = reject;
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const onCountsChange = vi.fn();
    render(
      <ChecklistSection
        cardId="c1"
        initialItems={makeItems(2, 0)}
        loading={false}
        readOnly={false}
        onCountsChange={onCountsChange}
      />
    );

    const checkbox = screen.getByLabelText("Toggle Item 1") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);
    // Immediately toggled before API settles
    expect(checkbox.checked).toBe(true);

    rejectPatch(new Error("Network down"));
    await waitFor(() => {
      expect(handleErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(checkbox.checked).toBe(false);
    expect(onCountsChange).not.toHaveBeenCalled();
  });

  it("blocks invalid add inputs without a request, disables add at 50 items, and shows read-only for guest", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    // Guest read-only
    const guest = render(
      <ChecklistSection
        cardId="c1"
        initialItems={makeItems(2, 1)}
        loading={false}
        readOnly={true}
        onCountsChange={vi.fn()}
      />
    );
    const guestCb = screen.getByLabelText("Toggle Item 1") as HTMLInputElement;
    expect(guestCb).toBeDisabled();
    expect(screen.queryByLabelText("Add checklist item")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Item 1")).not.toBeInTheDocument();
    guest.unmount();

    // Validation errors without request
    const writer = render(
      <ChecklistSection
        cardId="c1"
        initialItems={makeItems(1, 0)}
        loading={false}
        readOnly={false}
        onCountsChange={vi.fn()}
      />
    );
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Checklist item is required");
    expect(fetchMock).not.toHaveBeenCalled();

    const input = screen.getByLabelText("Add checklist item");
    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: "Add item" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    writer.unmount();

    // Limit of 50 items disables add form
    render(
      <ChecklistSection
        cardId="c1"
        initialItems={makeItems(50, 10)}
        loading={false}
        readOnly={false}
        onCountsChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Add checklist item")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add item" })).toBeDisabled();
    expect(screen.getByText("Limit of 50 items reached")).toBeInTheDocument();
  });
});
