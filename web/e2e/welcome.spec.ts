import { expect, test } from "@playwright/test";

test.describe("Welcome page E2E", () => {
  test("first visit to / lands on /welcome, sets cookie on action, and second visit goes to /login", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/welcome/);
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();

    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/login/);

    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === "kano_welcome_seen" && c.value === "1")).toBe(true);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Create account button on /welcome sets cookie and navigates to /register", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/welcome/);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
