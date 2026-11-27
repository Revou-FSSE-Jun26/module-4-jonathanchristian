import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAccessCookie,
  setRefreshCookie,
} from "@/lib/authCookie";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

function TestConsumer() {
  const { user, status, login, logout, updateUser } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user ? `${user.name}:${user.email}` : "none"}</span>
      <button
        type="button"
        onClick={() =>
          login({
            access_token: "acc-custom",
            refresh_token: "ref-custom",
            token_type: "Bearer",
            expires_in: 900,
            refresh_expires_in: 172800,
            user: {
              user_id: "u1",
              name: "Ada",
              email: "ada@example.com",
              created_at: "2026-11-18T00:00:00Z",
            },
          })
        }
      >
        DoLogin
      </button>
      <button
        type="button"
        onClick={() =>
          updateUser({
            user_id: "u1",
            name: "Ada King",
            email: "ada@example.com",
            created_at: "2026-11-18T00:00:00Z",
          })
        }
      >
        DoUpdate
      </button>
      <button type="button" onClick={logout}>
        DoLogout
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    clearAuthCookies();
    pushMock.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("login sets cookie lifetimes from expires_in and refresh_expires_in and logout clears both without API call", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cookieSetter = vi.spyOn(document, "cookie", "set");

    render(
      <AuthProvider initialAccessToken={null} initialRefreshToken={null}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");

    await user.click(screen.getByText("DoLogin"));

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("user")).toHaveTextContent("Ada:ada@example.com");
    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${ACCESS_COOKIE}=acc-custom; Path=/; Max-Age=900;`)
    );
    expect(cookieSetter).toHaveBeenCalledWith(
      expect.stringContaining(`${REFRESH_COOKIE}=ref-custom; Path=/; Max-Age=172800;`)
    );

    await user.click(screen.getByText("DoUpdate"));
    expect(screen.getByTestId("user")).toHaveTextContent("Ada King:ada@example.com");

    await user.click(screen.getByText("DoLogout"));
    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(fetchMock).not.toHaveBeenCalled();

    cookieSetter.mockRestore();
  });

  it("restores session on mount via GET /api/users/me", async () => {
    setAccessCookie("acc-1", 600);
    setRefreshCookie("ref-1", 3600);
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
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider initialAccessToken="acc-1" initialRefreshToken="ref-1">
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
      expect(screen.getByTestId("user")).toHaveTextContent("Ada:ada@example.com");
    });
  });

  it("clears cookies and redirects to /login on 401 restore failure", async () => {
    setAccessCookie("bad-acc", 600);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider initialAccessToken="bad-acc" initialRefreshToken={null}>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    });
    expect(getAccessToken()).toBeNull();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("keeps cookies on 500 restore failure", async () => {
    setAccessCookie("acc-1", 600);
    setRefreshCookie("ref-1", 3600);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider initialAccessToken="acc-1" initialRefreshToken="ref-1">
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    });
    expect(getAccessToken()).toBe("acc-1");
    expect(getRefreshToken()).toBe("ref-1");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("sets status to anonymous and keeps cookies on network restore failure", async () => {
    setAccessCookie("acc-net", 600);
    setRefreshCookie("ref-net", 3600);
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider initialAccessToken="acc-net" initialRefreshToken="ref-net">
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(getAccessToken()).toBe("acc-net");
    expect(getRefreshToken()).toBe("ref-net");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("sets status to anonymous on session expiry", async () => {
    setAccessCookie("acc-exp", 600);
    setRefreshCookie("ref-exp", 3600);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              user_id: "u1",
              name: "Ada",
              email: "ada@example.com",
              created_at: "2026-11-18T00:00:00Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      // Subsequent refresh or API 401 triggers session expiry
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "Expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider initialAccessToken="acc-exp" initialRefreshToken="ref-exp">
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });

    const { sessionExpired } = await import("@/lib/refreshSession");
    act(() => {
      sessionExpired();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
