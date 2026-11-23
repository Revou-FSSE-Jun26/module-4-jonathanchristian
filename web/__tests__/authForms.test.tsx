import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { LoginForm } from "@/components/auth/LoginForm";

const pushMock = vi.fn();
const loginMock = vi.fn();
const handleErrorMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock("@/hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({ handleError: handleErrorMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

describe("RegisterForm and LoginForm", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    pushMock.mockReset();
    loginMock.mockReset();
    handleErrorMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("RegisterForm blocks invalid inputs and submits valid 8-char password", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            user_id: "u1",
            name: "Ada",
            email: "ada@example.com",
            created_at: "2026-11-18T00:00:00Z",
          },
        }),
        { status: 201 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<RegisterForm />);

    // Empty name, malformed email, 7-char password -> no request
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "1234567");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("RegisterForm shows email-in-use error on 409", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 })
      )
    );

    render(<RegisterForm />);
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("This email is already registered.")).toBeInTheDocument();
  });

  it("LoginForm blocks empty fields, submits valid form, and clears password on 401", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              access_token: "acc",
              refresh_token: "ref",
              token_type: "Bearer",
              expires_in: 3600,
              refresh_expires_in: 604800,
              user: {
                user_id: "u1",
                name: "Ada",
                email: "ada@example.com",
                created_at: "2026-11-18T00:00:00Z",
              },
            },
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveValue("");

    await user.type(screen.getByLabelText("Password"), "correctpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("LoginForm and RegisterForm honor valid invite `next` and ignore invalid `next`", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.endsWith("/register")) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  user_id: "u1",
                  name: "Ada",
                  email: "ada@example.com",
                  created_at: "2026-11-18T00:00:00Z",
                },
              }),
              { status: 201 }
            )
          );
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                access_token: "acc",
                refresh_token: "ref",
                token_type: "Bearer",
                expires_in: 3600,
                refresh_expires_in: 604800,
                user: {
                  user_id: "u1",
                  name: "Ada",
                  email: "ada@example.com",
                  created_at: "2026-11-18T00:00:00Z",
                },
              },
            }),
            { status: 200 }
          )
        );
      })
    );

    const { rerender } = render(<RegisterForm next="/invite/tok_abc" />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?next=%2Finvite%2Ftok_abc"
    );
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "12345678");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login?next=%2Finvite%2Ftok_abc");
    });

    pushMock.mockReset();
    rerender(<LoginForm next="/invite/tok_abc" />);
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register?next=%2Finvite%2Ftok_abc"
    );
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "correctpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/invite/tok_abc");
    });

    // Invalid next (absolute URL and non-invite path) falls back to /
    pushMock.mockReset();
    rerender(<LoginForm next="https://evil.test/steal" />);
    await user.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });
});
