import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardMetaRow } from "@/components/cards/CardMetaRow";
import { LinksSection } from "@/components/cards/LinksSection";
import { providerKey } from "@/lib/linkProvider";
import type { BoardCard, CardLink } from "@/lib/types";

const handleErrorMock = vi.fn();

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

function makeCard(link_count: number): BoardCard {
  return {
    card_id: "c1",
    board_id: "b1",
    column_id: "col-1",
    title: "Links card",
    description: null,
    due_date: null,
    labels: [],
    assignee: null,
    status: "NOT_STARTED",
    completed_at: null,
    order: 1,
    checklist_done: 0,
    checklist_total: 0,
    link_count,
    created_at: "2026-11-18T00:00:00Z",
    updated_at: "2026-11-18T00:00:00Z",
  };
}

const SAMPLE_LINKS: CardLink[] = [
  {
    card_link_id: "l1",
    card_id: "c1",
    url: "https://docs.google.com/document/d/abc",
    label: "Project spec",
    created_by: "u1",
    created_at: "2026-11-18T00:00:00Z",
  },
];

describe("V11 workspace links tests (Task 51.3)", () => {
  beforeEach(() => {
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 68: Workspace link validation (UI form)
  it("Property 68 (form): rejects empty, javascript:, data:, file:, and >2048 char URLs without sending a request", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LinksSection
        cardId="c1"
        initialLinks={[]}
        loading={false}
        readOnly={false}
        onCountChange={vi.fn()}
      />
    );

    const urlInput = screen.getByLabelText("Link URL");
    const submitBtn = screen.getByRole("button", { name: "Add link" });

    // Empty
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    for (const bad of [
      "javascript:alert(1)",
      "data:text/html,<script>",
      "file:///etc/passwd",
    ]) {
      await user.clear(urlInput);
      await user.type(urlInput, bad);
      await user.click(submitBtn);
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    }

    // Over 2048 characters (use paste/change via clear + type or fireEvent? user.paste works fast)
    await user.clear(urlInput);
    await user.click(urlInput);
    await user.paste(`https://example.com/${"a".repeat(2040)}`);
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renders anchors with target=_blank and rel=noopener noreferrer, hides controls for guest, and hides/shows count chip", () => {
    // Card face chip hidden at 0, shown above 0
    const { rerender } = render(
      <CardMetaRow card={makeCard(0)} today="2026-11-27" />
    );
    expect(screen.queryByLabelText(/links$/)).not.toBeInTheDocument();

    rerender(<CardMetaRow card={makeCard(3)} today="2026-11-27" />);
    expect(screen.getByLabelText("3 links")).toHaveTextContent("3");

    // Guest sees list without add, edit, or delete controls
    render(
      <LinksSection
        cardId="c1"
        initialLinks={SAMPLE_LINKS}
        loading={false}
        readOnly={true}
        onCountChange={vi.fn()}
      />
    );

    const anchor = screen.getByRole("link", { name: "Project spec" });
    expect(anchor).toHaveAttribute("href", SAMPLE_LINKS[0].url);
    expect(anchor).toHaveAttribute("target", "_blank");
    const rel = anchor.getAttribute("rel") ?? "";
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
    expect(screen.getByText("docs.google.com")).toBeInTheDocument();
    expect(screen.queryByLabelText("Link URL")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Edit Project spec")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delete Project spec")).not.toBeInTheDocument();
  });

  // Feature: kano, Property 69: Provider icon key
  it("Property 69: providerKey returns generic for unknown hosts and known keys for providers", () => {
    expect(providerKey("unknown.example.org")).toBe("generic");
    expect(providerKey("drive.google.com")).toBe("gdrive");
    expect(providerKey("onedrive.live.com")).toBe("onedrive");
    expect(providerKey("dropbox.com")).toBe("dropbox");
    expect(providerKey("notion.so")).toBe("notion");
  });
});
