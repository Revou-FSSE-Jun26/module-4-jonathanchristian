import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WelcomePage from "@/app/welcome/page";
import { InviteJoinCard } from "@/components/boards/InviteJoinCard";
import { InviteLinkRow } from "@/components/boards/InviteLinkRow";
import { KanbanColumn } from "@/components/boards/KanbanColumn";
import { BaseButton } from "@/components/shared/BaseButton";
import { BaseModal } from "@/components/shared/BaseModal";
import { RoleSelect } from "@/components/boards/RoleSelect";
import { CardMetaRow } from "@/components/cards/CardMetaRow";
import { ChecklistItemRow } from "@/components/cards/ChecklistItemRow";
import { LinkRow } from "@/components/cards/LinkRow";
import { OverdueItemRow } from "@/components/notifications/OverdueItemRow";

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

  it("enforces V8 responsive classes on /welcome and V6 responsive classes on InviteJoinCard and InviteLinkRow", () => {
    const { container, unmount } = render(<WelcomePage />);
    const getStartedBtn = screen.getByRole("button", { name: "Get started" });
    const createAccountBtn = screen.getByRole("button", { name: "Create account" });
    const loginBtn = screen.getByRole("button", { name: "Log in" });
    expect(getStartedBtn.className).toContain("min-h-[44px]");
    expect(getStartedBtn.className).toContain("w-full");
    expect(getStartedBtn.className).toContain("md:w-auto");
    expect(createAccountBtn.className).toContain("min-h-[44px]");
    expect(loginBtn.className).toContain("min-h-[44px]");
    expect(loginBtn.parentElement?.className).toContain("flex-col");
    expect(loginBtn.parentElement?.className).toContain("md:flex-row");
    expect(container.querySelector(".overflow-x-auto")).toBeTruthy();
    expect(container.querySelector(".w-72")).toBeTruthy();
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

  it("enforces V11 responsive classes and 44px tap targets on RoleSelect, CardMetaRow, ChecklistItemRow, LinkRow, and OverdueItemRow", () => {
    const { container } = render(
      <div>
        <RoleSelect
          memberName="Alice"
          value="member"
          allowedRoles={["guest", "member", "manager"]}
          onChange={vi.fn()}
        />
        <CardMetaRow
          today="2026-11-27"
          card={{
            card_id: "c1",
            board_id: "b1",
            column_id: "col-1",
            title: "Task",
            description: null,
            due_date: "2026-11-20",
            labels: ["Design"],
            assignee: null,
            status: "URGENT",
            completed_at: null,
            order: 1,
            checklist_done: 1,
            checklist_total: 2,
            link_count: 1,
            created_at: "2026-11-18T00:00:00Z",
            updated_at: "2026-11-18T00:00:00Z",
          }}
        />
        <ul>
          <ChecklistItemRow
            item={{
              checklist_item_id: "ci-1",
              card_id: "c1",
              text: "Step one",
              is_done: false,
              order: 1,
            }}
            readOnly={false}
            onToggle={vi.fn()}
            onEdit={vi.fn(async () => true)}
            onDelete={vi.fn(async () => true)}
          />
          <LinkRow
            link={{
              card_link_id: "cl-1",
              card_id: "c1",
              url: "https://docs.google.com/document/d/very-long-id",
              label: "Spec doc",
              created_by: "u1",
              created_at: "2026-11-18T00:00:00Z",
            }}
            readOnly={false}
            onEdit={vi.fn(async () => true)}
            onDelete={vi.fn(async () => true)}
          />
          <OverdueItemRow
            item={{
              card_id: "c1",
              title: "Overdue task",
              due_date: "2026-11-20",
              status: "URGENT",
              column_name: "To Do",
              board_id: "b1",
              board_name: "Roadmap",
              days_overdue: 7,
            }}
          />
        </ul>
      </div>
    );

    const roleSelect = screen.getByLabelText("Role for Alice");
    expect(roleSelect.className).toContain("min-h-[44px]");

    const checkbox = screen.getByLabelText("Toggle Step one");
    expect(checkbox.parentElement?.className).toContain("min-h-[44px]");
    expect(checkbox.parentElement?.className).toContain("min-w-[44px]");

    const specLink = screen.getByRole("link", { name: "Spec doc" });
    expect(specLink.className).toContain("break-all");

    const overdueLink = screen.getByRole("link", { name: /Overdue task/ });
    expect(overdueLink.className).toContain("min-h-[44px]");

    expect(container.querySelector(".flex-wrap")).toBeTruthy();
  });
});
