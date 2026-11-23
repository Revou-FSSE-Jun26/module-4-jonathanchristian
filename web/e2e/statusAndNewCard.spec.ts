import { expect, test } from "@playwright/test";
import { buildUniqueEmail, requireCredentials } from "./support/credentials";

test.describe("Card status and new-card flow E2E", () => {
  test("new card opens modal, status updates badge on board and My Tasks", async ({ page }) => {
    const { email: baseEmail, password } = requireCredentials();
    const email = buildUniqueEmail(baseEmail, "status");
    const boardName = `Status Board ${Date.now()}`;

    await page.goto("/register");
    await page.getByLabel("Name").fill("Status User");
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

    await page.getByRole("button", { name: "Add column" }).click();
    await page.getByLabel("Column name").fill("Backlog");
    await page.getByRole("button", { name: "Add column" }).click();

    const col = page.locator("section", { hasText: "Backlog" });
    await col.getByRole("button", { name: "Add a card" }).click();
    await col.getByLabel("Card title").fill("Status card");
    await col.getByRole("button", { name: "Add card" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Title")).toHaveValue("Status card");

    await dialog.getByLabel("Description").fill("Track progress");
    await dialog.getByLabel("Assignee").selectOption({ label: "Status User" });
    await dialog.getByLabel("Status").selectOption("IN_PROGRESS");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(col.getByText("In progress")).toBeVisible();

    await col.locator("[data-card-id]", { hasText: "Status card" }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Status").selectOption("DONE");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(col.getByText("Done")).toBeVisible();

    await page.goto("/my-tasks");
    await expect(page.getByText("Status card")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();
  });
});
