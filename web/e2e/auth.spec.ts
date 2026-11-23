import { expect, test } from "@playwright/test";
import { buildWrongPassword, requireCredentials } from "./support/credentials";
import { setWelcomeSeen } from "./support/welcome";

test.describe("Authentication E2E", () => {
  test("unauthenticated visit to / after welcome cookie redirects to /login", async ({
    page,
    context,
    baseURL,
  }) => {
    await setWelcomeSeen(context, baseURL!);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("wrong password built at runtime shows error and stays on /login", async ({ page }) => {
    const { email, password } = requireCredentials();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(buildWrongPassword(password));
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid login redirects to / and logout redirects back to /login", async ({ page }) => {
    const { email, password } = requireCredentials();

    await page.goto("/login");
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
