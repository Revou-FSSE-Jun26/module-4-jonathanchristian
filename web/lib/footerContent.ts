export interface FooterLinkItem {
  readonly id: "github" | "linkedin";
  readonly href: string;
  readonly label: string;
}

export interface FooterContent {
  readonly wordmark: string;
  readonly portfolioPrefix: string;
  readonly author: string;
  readonly links: readonly FooterLinkItem[];
}

/** Static copy, placeholder URLs, and accessible labels for the shared Footer. */
export const FOOTER_CONTENT: FooterContent = {
  wordmark: "Kano",
  portfolioPrefix: "Built in 2026 by ",
  author: "Jonathan Christian",
  links: [
    {
      id: "github",
      href: "https://github.com/jonathanch12",
      label: "Kano on GitHub",
    },
    {
      id: "linkedin",
      href: "https://www.linkedin.com/in/jonathan-christian-ba3233311",
      label: "Kano on LinkedIn",
    },
  ],
};
