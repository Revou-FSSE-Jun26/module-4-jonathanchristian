import type { BrowserContext } from "@playwright/test";

/** Set the `kano_welcome_seen` cookie in a Playwright browser context before visiting `/`. */
export async function setWelcomeSeen(context: BrowserContext, baseURL: string): Promise<void> {
  const origin = new URL(baseURL).origin;
  await context.addCookies([
    {
      name: "kano_welcome_seen",
      value: "1",
      url: origin,
      sameSite: "Lax",
    },
  ]);
}
