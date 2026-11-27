import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CARD_STATUSES, STATUS_LABEL, STATUS_STYLE, isCardStatus } from "@/lib/status";

describe("StatusBadge and STATUS_STYLE (Task 49.2)", () => {
  it("renders the exact label and a distinct variant class for each of the four statuses", () => {
    const classSets = new Set<string>();

    for (const status of CARD_STATUSES) {
      const { unmount } = render(<StatusBadge status={status} />);
      const badge = screen.getByText(STATUS_LABEL(status));
      expect(badge).toBeInTheDocument();
      classSets.add(badge.className);
      unmount();
    }

    expect(classSets.size).toBe(4);
  });

  // Feature: kano, Property 62: Status style map
  it("Property 62: four distinct labels, class strings, and variants with URGENT danger and DONE success", () => {
    expect(CARD_STATUSES).toEqual(["NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE"]);
    expect(new Set(CARD_STATUSES.map((s) => STATUS_STYLE[s].label)).size).toBe(4);
    expect(new Set(CARD_STATUSES.map((s) => STATUS_STYLE[s].variant)).size).toBe(4);
    expect(new Set(CARD_STATUSES.map((s) => STATUS_STYLE[s].className)).size).toBe(4);

    expect(STATUS_STYLE.URGENT.variant).toBe("red");
    expect(STATUS_STYLE.URGENT.className).toContain("bg-danger-soft");
    expect(STATUS_STYLE.URGENT.className).toContain("text-danger-ink");

    expect(STATUS_STYLE.DONE.variant).toBe("green");
    expect(STATUS_STYLE.DONE.className).toContain("bg-success-soft");
    expect(STATUS_STYLE.DONE.className).toContain("text-success");

    for (const status of CARD_STATUSES) {
      expect(isCardStatus(status)).toBe(true);
      const { unmount } = render(<StatusBadge status={status} />);
      const badge = screen.getByText(STATUS_STYLE[status].label);
      for (const token of STATUS_STYLE[status].className.split(" ")) {
        expect(badge.className).toContain(token);
      }
      unmount();
    }
  });
});
