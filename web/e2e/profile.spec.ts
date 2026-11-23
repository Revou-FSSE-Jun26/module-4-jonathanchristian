import { expect, test } from "@playwright/test";
import { requireCredentials } from "./support/credentials";

test.describe("Profile page E2E", () => {
  test("displays user email as read-only text with no email input", async ({ page }) => {
    const { email, password } = requireCredentials();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  });
});
