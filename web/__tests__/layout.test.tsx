import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("Header and Footer", () => {
  it("renders exactly one header and one footer with anonymous links", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: "anonymous",
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      setAccessToken: vi.fn(),
    });

    render(
      <div>
        <Header />
        <Footer />
      </div>
    );

    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("link", { name: "My Tasks" })).not.toBeInTheDocument();
  });

  it("renders authenticated links and triggers logout", async () => {
    const user = userEvent.setup();
    const logoutMock = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        user_id: "u1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        created_at: "2026-11-18T00:00:00Z",
      },
      accessToken: "acc",
      refreshToken: "ref",
      status: "authenticated",
      login: vi.fn(),
      logout: logoutMock,
      updateUser: vi.fn(),
      setAccessToken: vi.fn(),
    });

    render(
      <div>
        <Header />
        <Footer />
      </div>
    );

    expect(screen.getByRole("link", { name: "My Tasks" })).toHaveAttribute("href", "/my-tasks");
    expect(screen.getByRole("link", { name: /Ada Lovelace/i })).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
