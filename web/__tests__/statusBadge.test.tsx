import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CARD_STATUSES, STATUS_LABEL } from "@/lib/status";

describe("StatusBadge", () => {
  it("renders the exact label and a distinct variant class for each status", () => {
    const classSets = new Set<string>();

    for (const status of CARD_STATUSES) {
      const { unmount } = render(<StatusBadge status={status} />);
      const badge = screen.getByText(STATUS_LABEL[status]);
      expect(badge).toBeInTheDocument();
      classSets.add(badge.className);
      unmount();
    }

    expect(classSets.size).toBe(3);
  });
});
