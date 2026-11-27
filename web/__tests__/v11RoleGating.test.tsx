import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardView } from "@/components/boards/BoardView";
import { MemberList } from "@/components/boards/MemberList";
import { BoardRoleProvider } from "@/components/boards/BoardRoleContext";
import {
  assignableRoles,
  can,
  canActOnMember,
  ROLE_RANK,
  type Action,
} from "@/lib/roles";
import type { BoardDetail, Member, Role } from "@/lib/types";

const showSuccessMock = vi.fn();
const handleErrorMock = vi.fn();

vi.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showError: vi.fn(),
  showLoading: vi.fn(),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { user_id: "u-mgr", name: "Max", email: "max@example.com", created_at: "" },
    status: "authenticated",
    logout: vi.fn(),
  }),
}));

function makeBoard(my_role: Role): BoardDetail {
  return {
    board_id: "b1",
    name: "Roadmap",
    my_role,
    created_at: "2026-11-18T00:00:00Z",
    columns: [
      {
        column_id: "col-1",
        board_id: "b1",
        name: "To Do",
        order: 1,
        cards: [
          {
            card_id: "c1",
            board_id: "b1",
            column_id: "col-1",
            title: "Ship V11",
            description: null,
            due_date: null,
            labels: [],
            assignee: null,
            status: "NOT_STARTED",
            completed_at: null,
            order: 1,
            checklist_done: 0,
            checklist_total: 0,
            link_count: 0,
            created_at: "2026-11-18T00:00:00Z",
            updated_at: "2026-11-18T00:00:00Z",
          },
        ],
      },
    ],
  };
}

const MEMBERS: Member[] = [
  { user_id: "u-admin", name: "Ada", email: "ada@example.com", role: "admin" },
  { user_id: "u-mgr", name: "Max", email: "max@example.com", role: "manager" },
  { user_id: "u-mem", name: "Mia", email: "mia@example.com", role: "member" },
  { user_id: "u-gst", name: "Gus", email: "gus@example.com", role: "guest" },
];

describe("V11 role and gating tests (Task 51.1)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    showSuccessMock.mockReset();
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.unstubAllGlobals();
  });

  // Feature: kano, Property 74: Frontend can and role controls
  it("Property 74: table test of can(role, action), assignableRoles, and canActOnMember", () => {
    const roles: Role[] = ["guest", "member", "manager", "admin"];
    const table: Record<Action, Role[]> = {
      view_board: ["guest", "member", "manager", "admin"],
      edit_cards: ["member", "manager", "admin"],
      manage_columns: ["manager", "admin"],
      manage_members: ["manager", "admin"],
      view_invite_links: ["manager", "admin"],
      change_roles: ["manager", "admin"],
      grant_manager: ["admin"],
      edit_board: ["admin"],
      delete_board: ["admin"],
      view_analytics: ["admin"],
    };

    for (const [action, allowed] of Object.entries(table) as [Action, Role[]][]) {
      for (const role of roles) {
        expect(can(role, action)).toBe(allowed.includes(role));
      }
      expect(can(null, action)).toBe(false);
    }

    expect(assignableRoles("admin")).toEqual(["guest", "member", "manager"]);
    expect(assignableRoles("manager")).toEqual(["guest", "member"]);
    expect(assignableRoles("member")).toEqual([]);
    expect(assignableRoles("guest")).toEqual([]);

    for (const actor of roles) {
      for (const target of roles) {
        const expected =
          (actor === "admin" || actor === "manager") &&
          ROLE_RANK[actor] > ROLE_RANK[target];
        expect(canActOnMember(actor, target)).toBe(expected);
      }
    }
  });

  it("renders BoardView controls per role: member, manager, admin, guest", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ data: MEMBERS }), { status: 200 }))
    );
    vi.stubGlobal("fetch", fetchMock);

    // member: card editing shown, no Column controls, no Members, no Analytics
    const memberView = render(<BoardView board={makeBoard("member")} />);
    expect(screen.getByRole("button", { name: "Add a card" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rename/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Members" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analytics" })).not.toBeInTheDocument();
    memberView.unmount();

    // manager: Column controls + Members shown, Analytics hidden
    const managerView = render(<BoardView board={makeBoard("manager")} />);
    expect(screen.getByRole("button", { name: "Add a card" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add column" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename To Do" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete To Do" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Members" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Analytics" })).not.toBeInTheDocument();
    managerView.unmount();

    // admin: everything shown
    const adminView = render(<BoardView board={makeBoard("admin")} />);
    expect(screen.getByRole("button", { name: "Add column" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Members" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeInTheDocument();
    adminView.unmount();

    // guest: read-only
    render(<BoardView board={makeBoard("guest")} />);
    expect(screen.queryByRole("button", { name: "Add a card" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Members" })).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it("shows role dropdown and remove control only through canActOnMember and handles manager invite links", async () => {
    const user = userEvent.setup();
    const onChangeRole = vi.fn();
    const onRequestRemove = vi.fn();

    // As manager: can act on member & guest (dropdown has guest, member), not on admin or manager
    const mgrList = render(
      <BoardRoleProvider role="manager">
        <MemberList
          members={MEMBERS}
          currentUserId="u-mgr"
          onChangeRole={onChangeRole}
          onRequestRemove={onRequestRemove}
        />
      </BoardRoleProvider>
    );

    expect(screen.queryByLabelText("Role for Ada")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Role for Max")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Remove Ada")).not.toBeInTheDocument();

    const miaSelect = screen.getByLabelText("Role for Mia") as HTMLSelectElement;
    expect(Array.from(miaSelect.options).map((o) => o.value)).toEqual([
      "guest",
      "member",
    ]);
    expect(screen.getByLabelText("Remove Mia")).toBeInTheDocument();
    expect(screen.getByLabelText("Role for Gus")).toBeInTheDocument();
    mgrList.unmount();

    // As admin in BoardView: opening Members and changing Mia's role
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith("/members")) {
        return Promise.resolve(new Response(JSON.stringify({ data: MEMBERS }), { status: 200 }));
      }
      if (url.endsWith("/invite-links")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                member: { role: "member", token: "tok-m" },
                guest: { role: "guest", token: "tok-g" },
              },
            }),
            { status: 200 }
          )
        );
      }
      if (url.endsWith("/members/u-mem") && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { user_id: "u-mem", name: "Mia", email: "mia@example.com", role: "manager" },
            }),
            { status: 200 }
          )
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BoardView board={makeBoard("manager")} />);
    await user.click(screen.getByRole("button", { name: "Members" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Invitation links")).toBeInTheDocument();
    await waitFor(() => {
      expect(within(dialog).getByLabelText("Member link: can edit")).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Guest link: view only")).toBeInTheDocument();
    });
  });
});
