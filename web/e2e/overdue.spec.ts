import { expect, test } from "@playwright/test";
import { buildUniqueEmail, requireCredentials } from "./support/credentials";

test.describe("Overdue card and notification list E2E", () => {
  test("past due date shows Overdue chip on card face and row in notification list without changing bell count", async ({
    page,
  }) => {
    const { email: baseEmail, password } = requireCredentials();
    const email = buildUniqueEmail(baseEmail, "overdue");
    const boardName = `Overdue Board ${Date.now()}`;

    await page.goto("/register");
    await page.getByLabel("Name").fill("Overdue User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: "Create board" }).first().click();
    await page.getByLabel("Board name").fill(boardName);
    await page.getByRole("dialog").getByRole("button", { name: "Create board" }).click();
    await page.getByRole("link", { name: new RegExp(boardName) }).click();
    const boardUrl = page.url();

    await page.getByRole("button", { name: "Add column" }).click();
    await page.getByLabel("Column name").fill("To Do");
    await page.getByRole("button", { name: "Add column" }).click();

    const col = page.locator("section", { hasText: "To Do" });
    await col.getByRole("button", { name: "Add a card" }).click();
    await col.getByLabel("Card title").fill("Past due card");
    await col.getByRole("button", { name: "Add card" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Due date").fill("2020-01-15");
    await dialog.getByLabel("Assignee").selectOption({ label: "Overdue User" });
    await dialog.getByRole("button", { name: "Save changes" }).click();

    const card = col.locator("[data-card-id]", { hasText: "Past due card" });
    await expect(card.getByText("Overdue", { exact: true })).toBeVisible();
    await expect(page.getByTestId("notification-badge")).toHaveCount(0);

    await page.goto("/");
    await page.getByRole("button", { name: "Notifications" }).click();
    const region = page.getByRole("region", { name: "Notifications" });
    await expect(region.getByText(/\d+ days? overdue/)).toBeVisible();
    await region.getByRole("link", { name: /Past due card/ }).click();
    await expect(page).toHaveURL(boardUrl);
  });
});
