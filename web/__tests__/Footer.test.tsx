import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WelcomeContent } from "@/components/welcome/WelcomeContent";
import { AuthContext } from "@/lib/authContext";
import { findForbiddenClaims } from "@/lib/forbiddenClaims";
import { FOOTER_CONTENT } from "@/lib/footerContent";
import { logoTarget } from "@/lib/logoTarget";
import type { AuthContextValue } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/welcome",
}));

function makeAuthValue(
  status: AuthContextValue["status"] = "anonymous"
): AuthContextValue {
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    status,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    setAccessToken: vi.fn(),
  };
}

describe("Footer (Task 40.5)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the brand mark, wordmark, separator dot, and portfolio attribution", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const scoped = within(footer);

    const mark = scoped.getByText("K");
    expect(mark).toHaveAttribute("aria-hidden", "true");

    const wordmark = scoped.getByText("Kano");
    expect(wordmark.closest("a")).toBeNull();

    const dot = scoped.getByText("·");
    expect(dot).toHaveAttribute("aria-hidden", "true");

    const paragraph = footer.querySelector("p");
    expect(paragraph).not.toBeNull();
    expect(paragraph?.textContent).toBe("Built in 2026 by Jonathan Christian");

    const author = scoped.getByText("Jonathan Christian");
    expect(author.tagName).toBe("SPAN");
    expect(author.className).toContain("font-medium");
    expect(author.className).toContain("text-ink");
  });

  it("renders two external icon links with security attributes, accessible labels, and token classes", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const scoped = within(footer);

    const links = scoped.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(scoped.queryByRole("link", { name: "Kano" })).not.toBeInTheDocument();

    const github = scoped.getByRole("link", { name: "Kano on GitHub" });
    const linkedin = scoped.getByRole("link", { name: "Kano on LinkedIn" });

    expect(github).toHaveAttribute("href", "https://github.com/jonathanch12");
    expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/jonathan-christian-ba3233311");

    for (const link of [github, linkedin]) {
      expect(link).toHaveAttribute("target", "_blank");
      const relTokens = (link.getAttribute("rel") ?? "").split(/\s+/);
      expect(relTokens).toContain("noopener");
      expect(relTokens).toContain("noreferrer");
      expect(link.textContent).toBe("");

      const svg = link.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");

      for (const cls of [
        "hover:text-ink",
        "hover:bg-sunken",
        "transition-colors",
        "duration-150",
        "focus-visible:outline-2",
        "focus-visible:outline-primary-500",
        "size-11",
        "text-ink-muted",
      ]) {
        expect(link.className).toContain(cls);
      }
    }
  });

  it("uses only design-system tokens without shadows, gradients, arbitrary values, or font-bold", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const allElements = [footer, ...Array.from(footer.querySelectorAll("*"))];

    for (const el of allElements) {
      const classAttr = el.getAttribute("class") ?? "";
      for (const token of classAttr.split(/\s+/).filter(Boolean)) {
        expect(token.startsWith("shadow-")).toBe(false);
        expect(token.startsWith("bg-[")).toBe(false);
        expect(token.startsWith("text-[")).toBe(false);
        expect(token.startsWith("p-[")).toBe(false);
        expect(token.startsWith("bg-gradient")).toBe(false);
        expect(token).not.toBe("font-bold");
      }
    }
  });

  it("performs no fetch or cookie writes on render, hover, or focus", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cookieSetter = vi.spyOn(document, "cookie", "set");

    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const github = within(footer).getByRole("link", { name: "Kano on GitHub" });
    const linkedin = within(footer).getByRole("link", { name: "Kano on LinkedIn" });

    await user.hover(github);
    await user.tab();
    expect(github).toHaveFocus();
    await user.hover(linkedin);
    await user.tab();
    expect(linkedin).toHaveFocus();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(cookieSetter).not.toHaveBeenCalled();
  });

  it("contains no forbidden marketing claims in FOOTER_CONTENT or rendered attributes", () => {
    const contentStrings = [
      FOOTER_CONTENT.wordmark,
      FOOTER_CONTENT.portfolioPrefix,
      FOOTER_CONTENT.author,
      ...FOOTER_CONTENT.links.flatMap((l) => [l.href, l.label]),
    ];
    for (const value of contentStrings) {
      expect(findForbiddenClaims(value)).toEqual([]);
    }

    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(findForbiddenClaims(footer.textContent ?? "")).toEqual([]);

    for (const el of [footer, ...Array.from(footer.querySelectorAll("*"))]) {
      for (const attr of ["aria-label", "alt", "title"]) {
        const val = el.getAttribute(attr);
        if (val) {
          expect(findForbiddenClaims(val)).toEqual([]);
        }
      }
    }
  });

  it("keeps Header logo as the only 'Kano' link, shares KanoMark classes, and renders one contentinfo per page", () => {
    for (const status of ["anonymous", "authenticated"] as const) {
      const { unmount } = render(
        <AuthContext.Provider value={makeAuthValue(status)}>
          <Header />
          <main>page</main>
          <Footer />
        </AuthContext.Provider>
      );

      const kanoLinks = screen.getAllByRole("link", { name: "Kano" });
      expect(kanoLinks).toHaveLength(1);
      expect(kanoLinks[0]).toHaveAttribute(
        "href",
        logoTarget(status === "authenticated")
      );

      const marks = screen.getAllByText("K");
      expect(marks).toHaveLength(2);
      expect(marks[0].className).toBe(marks[1].className);
      unmount();
    }

    const headerPath = path.resolve(__dirname, "..", "components", "Header.tsx");
    const headerSource = fs.readFileSync(headerPath, "utf8");
    expect(headerSource).toContain("<KanoMark");
    expect(headerSource).not.toMatch(/>\s*K\s*<\/span>/);

    for (const pageName of [
      "dashboard",
      "board",
      "my-tasks",
      "profile",
      "login",
      "register",
      "invite",
    ]) {
      const { unmount } = render(
        <AuthContext.Provider value={makeAuthValue("anonymous")}>
          <Header />
          <main>{pageName}</main>
          <Footer />
        </AuthContext.Provider>
      );
      expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
      unmount();
    }

    render(
      <AuthContext.Provider value={makeAuthValue("anonymous")}>
        <Header />
        <main>
          <WelcomeContent />
        </main>
        <Footer />
      </AuthContext.Provider>
    );
    expect(screen.getAllByRole("contentinfo")).toHaveLength(1);
    const bottomCta = screen.getByRole("region", {
      name: "Ready to bring calm to your project planning?",
    });
    const welcomeFooter = screen.getByRole("contentinfo");
    expect(
      bottomCta.compareDocumentPosition(welcomeFooter) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
