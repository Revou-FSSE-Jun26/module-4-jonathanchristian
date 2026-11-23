import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fc from "fast-check";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AuthContext } from "@/lib/authContext";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  WELCOME_COOKIE,
  clearAuthCookies,
  setRefreshCookie,
  setWelcomeCookie,
} from "@/lib/authCookie";
import { isVisitorAuthenticated, logoTarget, type AuthStatus } from "@/lib/logoTarget";
import type { AuthContextValue } from "@/lib/types";

let currentPathname = "/";
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    user: null, accessToken: null, refreshToken: null, status: "anonymous",
    login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), setAccessToken: vi.fn(),
    ...overrides,
  };
}

const AUTH_USER = {
  user_id: "u1", name: "Ada Lovelace", email: "ada@example.com", created_at: "2026-11-18T00:00:00Z",
};

describe("Header logo, navigation, and layout (Task 37.1)", () => {
  const originalPublicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    currentPathname = "/";
    pushMock.mockReset();
    clearAuthCookies();
    document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalPublicUrl;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("points logo to /welcome when anonymous regardless of welcome cookie or /login and /register paths", () => {
    for (const pathname of ["/", "/login", "/register"]) {
      for (const hasWelcome of [false, true]) {
        currentPathname = pathname;
        if (hasWelcome) {
          setWelcomeCookie();
        } else {
          document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
        }

        const { unmount } = render(
          <AuthContext.Provider value={makeAuthValue({ status: "anonymous" })}>
            <Header />
          </AuthContext.Provider>
        );

        const logo = screen.getByRole("link", { name: "Kano" });
        expect(logo).toHaveAttribute("href", "/welcome");
        expect(logo.getAttribute("href")).not.toBe("/login");
        expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
        expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
        expect(screen.queryByRole("link", { name: "My Tasks" })).not.toBeInTheDocument();
        unmount();
      }
    }
  });

  it("points logo to / when authenticated and switches to /welcome after logout()", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cookieSetter = vi.spyOn(document, "cookie", "set");

    let rerenderFn: (ui: React.ReactElement) => void;
    const authVal = makeAuthValue({
      status: "authenticated",
      user: AUTH_USER,
      accessToken: "acc",
      refreshToken: "ref",
      logout: () => {
        rerenderFn(
          <AuthContext.Provider value={makeAuthValue({ status: "anonymous" })}>
            <Header />
          </AuthContext.Provider>
        );
      },
    });

    const rendered = render(
      <AuthContext.Provider value={authVal}>
        <Header />
      </AuthContext.Provider>
    );
    rerenderFn = rendered.rerender;

    const logo = screen.getByRole("link", { name: "Kano" });
    expect(logo).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "My Tasks" })).toHaveAttribute("href", "/my-tasks");
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();

    fetchMock.mockClear();
    await user.click(logo);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cookieSetter).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(screen.getByRole("link", { name: "Kano" })).toHaveAttribute("href", "/welcome");
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Tasks" })).not.toBeInTheDocument();
  });

  it("gives /welcome with only a refresh cookie while loading or on 5xx restore failure, and / once restore succeeds", async () => {
    setRefreshCookie("ref-only", 3600);

    let resolveUserFetch!: (value: Response) => void;
    const pendingFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.endsWith("/api/auth/refresh")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: { access_token: "acc-new", token_type: "Bearer", expires_in: 3600 },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url.endsWith("/api/users/me")) {
        return new Promise<Response>((resolve) => {
          resolveUserFetch = resolve;
        });
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: { items: [], total: 0, unread_count: 0 } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });
    vi.stubGlobal("fetch", pendingFetch);

    const { unmount } = render(
      <AuthProvider initialAccessToken={null} initialRefreshToken="ref-only">
        <Header />
      </AuthProvider>
    );

    expect(screen.getByRole("link", { name: "Kano" })).toHaveAttribute("href", "/welcome");
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();

    await waitFor(() => {
      expect(resolveUserFetch).toBeDefined();
    });

    resolveUserFetch(
      new Response(JSON.stringify({ data: AUTH_USER }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Kano" })).toHaveAttribute("href", "/");
    });
    expect(screen.getByRole("link", { name: "My Tasks" })).toBeInTheDocument();
    unmount();

    // 5xx restore failure keeps cookies and leaves logo at /welcome
    clearAuthCookies();
    setRefreshCookie("ref-only", 3600);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    render(
      <AuthProvider initialAccessToken={null} initialRefreshToken="ref-only">
        <Header />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Kano" })).toHaveAttribute("href", "/welcome");
    });
    expect(document.cookie).toContain(`${REFRESH_COOKIE}=ref-only`);
    expect(document.cookie).not.toContain(`${ACCESS_COOKIE}=expired`);
  });

  // Feature: kano, Property 59: Logo target depends only on authentication
  it("Property 59 (component): Header logo target and navigation always agree across all statuses", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AuthStatus>("loading", "authenticated", "anonymous"),
        (status) => {
          const isAuth = isVisitorAuthenticated(status);
          const { unmount } = render(
            <AuthContext.Provider
              value={makeAuthValue({
                status,
                user: isAuth ? AUTH_USER : null,
              })}
            >
              <Header />
            </AuthContext.Provider>
          );

          const logo = screen.getByRole("link", { name: "Kano" });
          expect(logo).toHaveAttribute("href", logoTarget(isAuth));
          expect(logo.getAttribute("href")).not.toBe("/login");

          if (isAuth) {
            expect(screen.getByRole("link", { name: "My Tasks" })).toBeInTheDocument();
            expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
          } else {
            expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
            expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
            expect(screen.queryByRole("link", { name: "My Tasks" })).not.toBeInTheDocument();
          }
          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  it("renders exactly one banner and one contentinfo around stand-in pages and forbids <Header/<Footer outside layout.tsx", () => {
    for (const pageName of [
      "welcome",
      "login",
      "register",
      "dashboard",
      "board",
      "my-tasks",
      "profile",
    ]) {
      const { unmount } = render(
        <AuthContext.Provider value={makeAuthValue({ status: "anonymous" })}>
          <Header />
          <main>{pageName}</main>
          <Footer />
        </AuthContext.Provider>
      );
      expect(screen.getAllByRole("banner")).toHaveLength(1);
      expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
      unmount();
    }

    const webRoot = path.resolve(__dirname, "..");
    const filesToCheck: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(tsx|ts)$/.test(entry.name)) {
          filesToCheck.push(full);
        }
      }
    };
    walk(path.join(webRoot, "app"));
    walk(path.join(webRoot, "components"));

    const layoutPath = path.resolve(webRoot, "app", "layout.tsx");
    const offenders = filesToCheck
      .filter((f) => path.resolve(f) !== layoutPath)
      .filter((f) => /<(Header|Footer)[\s/>]/.test(fs.readFileSync(f, "utf8")));

    expect(offenders).toEqual([]);
  });
});
