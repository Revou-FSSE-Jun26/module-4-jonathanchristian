import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WelcomePage from "@/app/welcome/page";
import { InviteJoinCard } from "@/components/boards/InviteJoinCard";
import { InviteLinkRow } from "@/components/boards/InviteLinkRow";
import { KanbanColumn } from "@/components/boards/KanbanColumn";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

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

  it("enforces V6 responsive classes on /welcome, InviteJoinCard, and InviteLinkRow", () => {
    const { container, unmount } = render(<WelcomePage />);
    expect(container.firstElementChild?.className).toContain("max-w-xl");
    const loginBtn = screen.getByRole("button", { name: "Log in" });
    const registerBtn = screen.getByRole("button", { name: "Create account" });
    expect(loginBtn.className).toContain("min-h-[44px]");
    expect(registerBtn.className).toContain("min-h-[44px]");
    expect(loginBtn.parentElement?.className).toContain("flex-col");
    expect(loginBtn.parentElement?.className).toContain("sm:flex-row");
    unmount();

    const invite = render(
      <InviteJoinCard
        token="tok-1"
        info={{ board_id: "b1", board_name: "Roadmap", role: "member", current_role: null }}
      />
    );
    expect(invite.container.firstElementChild?.className).toContain("max-w-xl");
    const joinBtn = screen.getByRole("button", { name: "Join" });
    expect(joinBtn.className).toContain("min-h-[44px]");
    invite.unmount();

    render(
      <InviteLinkRow
        link={{ role: "member", token: "tok-1" }}
        onRequestRegenerate={vi.fn()}
      />
    );
    const urlInput = screen.getByLabelText("Member link: can edit");
    expect(urlInput.className).toContain("break-all");
    expect(urlInput.parentElement?.className).toContain("flex-col");
    expect(urlInput.parentElement?.className).toContain("md:flex-row");
  });
});
