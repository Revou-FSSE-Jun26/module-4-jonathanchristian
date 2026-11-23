import { expect, test } from "@playwright/test";

test.describe("Welcome page E2E (R33.13)", () => {
  test("first visit to / lands on /welcome, Header Log in sets cookie, and second visit goes to /login", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/welcome$/);

    const banner = page.getByRole("banner");
    const hero = page.getByRole("region", {
      name: "Organize work smoothly, from idea to done",
    });
    const bottomCta = page.getByRole("region", {
      name: "Ready to bring calm to your project planning?",
    });

    await expect(banner.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Register" })).toBeVisible();
    await expect(hero.getByRole("button", { name: "Get started" })).toBeVisible();
    await expect(bottomCta.getByRole("button", { name: "Create account" })).toBeVisible();
    await expect(bottomCta.getByRole("button", { name: "Log in" })).toBeVisible();

    await banner.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login$/);

    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === "kano_welcome_seen" && c.value === "1")).toBe(true);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("bottom Create account button on /welcome navigates to /register", async ({
    page,
  }) => {
    await page.goto("/welcome");
    await expect(page).toHaveURL(/\/welcome$/);

    const bottomCta = page.getByRole("region", {
      name: "Ready to bring calm to your project planning?",
    });
    await bottomCta.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/register$/);
  });
});
