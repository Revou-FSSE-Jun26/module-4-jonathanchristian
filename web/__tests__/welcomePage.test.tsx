import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WelcomePage, { metadata } from "@/app/welcome/page";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthContext } from "@/lib/authContext";
import { WELCOME_COOKIE, getWelcomeSeen } from "@/lib/authCookie";
import { findForbiddenClaims } from "@/lib/forbiddenClaims";
import { FEATURES, PREVIEW_SAMPLE, WELCOME_COPY } from "@/lib/welcomeContent";
import type { AuthContextValue } from "@/lib/types";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/welcome",
}));

function makeAnonymousAuth(): AuthContextValue {
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    status: "anonymous",
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    setAccessToken: vi.fn(),
  };
}

describe("WelcomePage (/welcome, Task 37.2)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders sections in order, Header anchors, BaseButtons, decorative preview, single shadow-overlay, and no fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    const { container } = render(
      <AuthContext.Provider value={makeAnonymousAuth()}>
        <Header />
        <main>
          <WelcomePage />
        </main>
        <Footer />
      </AuthContext.Provider>
    );

    // Header actions are anchors, not BaseButtons
    const banner = screen.getByRole("banner");
    const headerLogin = within(banner).getByRole("link", { name: "Log in" });
    const headerRegister = within(banner).getByRole("link", { name: "Register" });
    expect(headerLogin.tagName).toBe("A");
    expect(headerLogin).toHaveAttribute("href", "/login");
    expect(headerRegister.tagName).toBe("A");
    expect(headerRegister).toHaveAttribute("href", "/register");
    expect(within(banner).queryByRole("button", { name: "Log in" })).not.toBeInTheDocument();
    expect(within(banner).queryByRole("button", { name: "Register" })).not.toBeInTheDocument();

    // Hero section
    const heroRegion = screen.getByRole("region", { name: WELCOME_COPY.heroHeadline });
    expect(within(heroRegion).getByText(WELCOME_COPY.heroEyebrow)).toBeInTheDocument();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(WELCOME_COPY.heroHeadline);
    expect(within(heroRegion).getByText(WELCOME_COPY.heroSubheadline)).toBeInTheDocument();
    const getStartedBtn = within(heroRegion).getByRole("button", {
      name: WELCOME_COPY.heroCtaLabel,
    });

    // Features section
    const featuresRegion = screen.getByRole("region", { name: WELCOME_COPY.featuresHeading });
    for (const feature of FEATURES) {
      expect(within(featuresRegion).getByText(feature.title)).toBeInTheDocument();
      expect(within(featuresRegion).getByText(feature.description)).toBeInTheDocument();
    }

    // Bottom CTA section
    const ctaRegion = screen.getByRole("region", { name: WELCOME_COPY.ctaHeading });
    const createAccountBtn = within(ctaRegion).getByRole("button", {
      name: WELCOME_COPY.ctaPrimaryLabel,
    });
    const ctaLoginBtn = within(ctaRegion).getByRole("button", {
      name: WELCOME_COPY.ctaSecondaryLabel,
    });

    // Preview container: aria-hidden, no focusables inside, parent scroller has tabindex="-1"
    const hiddenPreview = container.querySelector('[aria-hidden="true"] .w-72')?.closest('[aria-hidden="true"]') as HTMLElement;
    expect(hiddenPreview).toBeTruthy();
    expect(
      hiddenPreview.querySelectorAll(
        "a[href], button, input, select, textarea, summary, [tabindex]"
      )
    ).toHaveLength(0);
    const scroller = hiddenPreview.parentElement as HTMLElement;
    expect(scroller).toHaveAttribute("tabindex", "-1");

    // Section order: hero -> preview -> features -> bottom CTA
    expect(
      heroRegion.compareDocumentPosition(scroller) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      scroller.compareDocumentPosition(featuresRegion) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      featuresRegion.compareDocumentPosition(ctaRegion) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // Only one shadow-overlay and no other shadow-* class on the page
    const shadowElements = Array.from(container.querySelectorAll("*")).filter((el) =>
      /\bshadow-/.test(el.className?.toString() ?? "")
    );
    expect(shadowElements).toHaveLength(1);
    expect(shadowElements[0].className).toContain("shadow-overlay");

    // No testimonials, quotes, or star ratings
    expect(container.querySelectorAll("blockquote, q, cite")).toHaveLength(0);
    expect(container.textContent ?? "").not.toMatch(/[★☆]/);
    expect(screen.queryByRole("img", { name: /rating|star/i })).not.toBeInTheDocument();

    // Button clicks set cookie and navigate
    await user.click(getStartedBtn);
    expect(getWelcomeSeen()).toBe(true);
    expect(pushMock).toHaveBeenCalledWith("/register");

    document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
    await user.click(createAccountBtn);
    expect(getWelcomeSeen()).toBe(true);
    expect(pushMock).toHaveBeenCalledWith("/register");

    document.cookie = `${WELCOME_COOKIE}=; Path=/; Max-Age=0`;
    await user.click(ctaLoginBtn);
    expect(getWelcomeSeen()).toBe(true);
    expect(pushMock).toHaveBeenCalledWith("/login");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Feature: kano, Property 60: Forbidden-claims scan (DOM and source)
  it("Property 60 (DOM and source): contains zero forbidden claims in rendered DOM, attributes, metadata, and welcome sources", () => {
    const { container } = render(<WelcomePage />);

    const texts: string[] = [
      container.textContent ?? "",
      String(metadata.title ?? ""),
      String(metadata.description ?? ""),
      ...Object.values(WELCOME_COPY),
      ...FEATURES.flatMap((f) => [f.title, f.description]),
      ...PREVIEW_SAMPLE.flatMap((c) => [
        c.title,
        ...c.cards.flatMap((card) => [card.title, card.status, ...card.labels.map((l) => l.text)]),
      ]),
    ];

    for (const el of container.querySelectorAll("[aria-label], [alt], [title]")) {
      for (const attr of ["aria-label", "alt", "title"]) {
        const val = el.getAttribute(attr);
        if (val) texts.push(val);
      }
    }

    for (const text of texts) {
      expect(findForbiddenClaims(text)).toEqual([]);
    }

    const webRoot = path.resolve(__dirname, "..");
    const welcomeDir = path.join(webRoot, "components", "welcome");
    const sourceFiles = [
      path.join(webRoot, "app", "welcome", "page.tsx"),
      path.join(webRoot, "lib", "welcomeContent.ts"),
      ...fs.readdirSync(welcomeDir).map((f) => path.join(welcomeDir, f)),
    ];

    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, "utf8");
      expect(findForbiddenClaims(source)).toEqual([]);
    }
  });
});
