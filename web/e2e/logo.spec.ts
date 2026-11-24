import { expect, test } from "@playwright/test";
import { requireCredentials } from "./support/credentials";

test.describe("Header logo link E2E (R33.15)", () => {
  test("anonymous visitor clicking logo on /login goes to /welcome", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("banner").getByRole("link", { name: "Kano", exact: true }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("anonymous visitor clicking logo on /register goes to /welcome", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("banner").getByRole("link", { name: "Kano", exact: true }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test("authenticated user clicking logo on a board page goes to Dashboard /", async ({
    page,
  }) => {
    const { email, password } = requireCredentials();
    const boardName = `Logo Board ${Date.now()}`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: /create board/i }).click();
    await page.getByLabel("Board name").fill(boardName);
    await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
    await page.getByRole("link", { name: boardName }).click();
    await expect(page).toHaveURL(/\/boards\//);

    await page.getByRole("banner").getByRole("link", { name: "Kano", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page).not.toHaveURL(/\/(welcome|login)/);
    await expect(page.getByRole("heading", { name: /boards/i })).toBeVisible();
  });
});
