import { expect, test } from "@playwright/test";

test.describe("Authentication E2E", () => {
  test("unauthenticated visit to / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("invalid credentials show error and stay on /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(`unknown+${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("wrongpass1");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid login redirects to / and logout redirects back to /login", async ({ page }) => {
    const email = `e2e+auth-${Date.now()}@example.com`;
    const password = "password123";

    await page.goto("/register");
    await page.getByLabel("Name").fill("Auth User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Your boards" })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
