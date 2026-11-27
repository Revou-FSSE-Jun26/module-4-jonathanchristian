import { expect, test } from "@playwright/test";
import { buildUniqueEmail, requireCredentials } from "./support/credentials";

test.describe("Checklist, workspace links, and Urgent status E2E", () => {
  test("adds checklist item and link, sees 1/1 and link chip, sets Urgent status on board and My Tasks", async ({
    page,
  }) => {
    const { email: baseEmail, password } = requireCredentials();
    const email = buildUniqueEmail(baseEmail, "v11-card");
    const boardName = `V11 Card Board ${Date.now()}`;

    await page.goto("/register");
    await page.getByLabel("Name").fill("V11 User");
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
    await page.getByLabel("Column name").fill("To Do");
    await page.getByRole("button", { name: "Add column" }).click();

    const col = page.locator("section", { hasText: "To Do" });
    await col.getByRole("button", { name: "Add a card" }).click();
    await col.getByLabel("Card title").fill("Urgent task");
    await col.getByRole("button", { name: "Add card" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Add checklist item").fill("Verify spec");
    await dialog.getByRole("button", { name: "Add item" }).click();
    await dialog.getByLabel("Toggle Verify spec").click();

    await dialog.getByLabel("Link URL").fill("https://docs.google.com/document/d/123");
    await dialog.getByLabel("Link label (optional)").fill("Spec doc");
    await dialog.getByRole("button", { name: "Add link" }).click();
    await expect(dialog.getByRole("link", { name: "Spec doc" })).toBeVisible();

    await dialog.getByLabel("Assignee").selectOption({ label: "V11 User" });
    await dialog.getByLabel("Status").selectOption("URGENT");
    await dialog.getByRole("button", { name: "Save changes" }).click();

    const card = col.locator("[data-card-id]", { hasText: "Urgent task" });
    await expect(card.getByText("1/1")).toBeVisible();
    await expect(card.getByLabel("1 links")).toBeVisible();
    await expect(card.getByText("Urgent", { exact: true })).toBeVisible();

    await page.goto("/my-tasks");
    await expect(page.getByText("Urgent task")).toBeVisible();
    await expect(page.getByText("Urgent", { exact: true })).toBeVisible();
  });
});
