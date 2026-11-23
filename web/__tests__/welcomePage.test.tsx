import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WelcomePage from "@/app/welcome/page";
import { WELCOME_COOKIE, getWelcomeSeen } from "@/lib/authCookie";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("WelcomePage (/welcome)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
  });

  it("renders Log in and Create account buttons, sets welcome cookie on click, and navigates", async () => {
    const user = userEvent.setup();
    render(<WelcomePage />);

    expect(screen.getByRole("heading", { name: "Welcome to Kano" })).toBeInTheDocument();
    const loginBtn = screen.getByRole("button", { name: "Log in" });
    const registerBtn = screen.getByRole("button", { name: "Create account" });

    await user.click(loginBtn);
    expect(getWelcomeSeen()).toBe(true);
    expect(pushMock).toHaveBeenCalledWith("/login");

    document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
    await user.click(registerBtn);
    expect(getWelcomeSeen()).toBe(true);
    expect(pushMock).toHaveBeenCalledWith("/register");
  });
});
