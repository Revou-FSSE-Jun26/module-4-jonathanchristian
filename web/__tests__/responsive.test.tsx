import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KanbanColumn } from "@/components/boards/KanbanColumn";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";

describe("Responsive classes at 375 px (design B9)", () => {
  it("enforces 44px tap target on BaseButton, 240px min width on KanbanColumn, and viewport bounds on BaseModal", () => {
    render(
      <div>
        <BaseButton>Tap</BaseButton>
        <KanbanColumn
          column={{
            column_id: "col-1",
            board_id: "b1",
            name: "To Do",
            order: 1,
            cards: [],
          }}
        />
        <BaseModal open={true} onClose={() => {}} title="Responsive">
          <p>Body</p>
        </BaseModal>
      </div>
    );

    const btn = screen.getByRole("button", { name: "Tap" });
    expect(btn.className).toContain("min-h-[44px]");
    expect(btn.className).toContain("min-w-[44px]");

    const col = screen.getByRole("region", { name: "To Do" });
    expect(col.className).toContain("min-w-[240px]");

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("max-h-[100dvh]");
    expect(dialog.className).toContain("overflow-y-auto");
  });
});
