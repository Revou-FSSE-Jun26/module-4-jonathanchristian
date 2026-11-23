import { expect, test } from "@playwright/test";
import { buildUniqueEmail, requireCredentials } from "./support/credentials";

test.describe.configure({ mode: "serial" });

test("Kanban full journey (8 steps)", async ({ page }) => {
  const { email: baseEmail, password } = requireCredentials();
  const email = buildUniqueEmail(baseEmail, "kanban");
  const boardName = `Board ${Date.now()}`;
  const cardTitle = "Launch checklist";

  await test.step("1. Register a unique user", async () => {
    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  await test.step("2. Log in", async () => {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  await test.step("3. Create a board", async () => {
    await page.getByRole("button", { name: "Create board" }).first().click();
    await page.getByLabel("Board name").fill(boardName);
    await page.getByRole("dialog").getByRole("button", { name: "Create board" }).click();
    await expect(page.getByRole("link", { name: new RegExp(boardName) })).toBeVisible();
    await page.getByRole("link", { name: new RegExp(boardName) }).click();
    await expect(page).toHaveURL(/\/boards\//);
  });

  await test.step("4. Add 2 columns", async () => {
    await page.getByRole("button", { name: "Add column" }).click();
    await page.getByLabel("Column name").fill("To Do");
    await page.getByRole("button", { name: "Add column" }).click();
    await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();

    await page.getByRole("button", { name: "Add column" }).click();
    await page.getByLabel("Column name").fill("Done");
    await page.getByRole("button", { name: "Add column" }).click();
    await expect(page.getByRole("heading", { name: "Done" })).toBeVisible();
  });

  await test.step("5. Create a card in the first column", async () => {
    const todoColumn = page.locator("section", { hasText: "To Do" });
    await todoColumn.getByRole("button", { name: "Add a card" }).click();
    await todoColumn.getByLabel("Card title").fill(cardTitle);
    await todoColumn.getByRole("button", { name: "Add card" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(todoColumn.getByText(cardTitle)).toBeVisible();
  });

  await test.step("6. Drag the card to the second column", async () => {
    const todoColumn = page.locator("section", { hasText: "To Do" });
    const doneColumn = page.locator("section", { hasText: "Done" });
    const card = todoColumn.locator("[data-card-id]", { hasText: cardTitle });
    await card.dragTo(doneColumn);
    await expect(doneColumn.getByText(cardTitle)).toBeVisible();
  });

  await test.step("7. Reload and confirm the card persists in the second column", async () => {
    await page.reload();
    const doneColumn = page.locator("section", { hasText: "Done" });
    await expect(doneColumn.getByText(cardTitle)).toBeVisible();
  });

  await test.step("8. Add a comment then edit it and confirm the new text", async () => {
    const doneColumn = page.locator("section", { hasText: "Done" });
    await doneColumn.locator("[data-card-id]", { hasText: cardTitle }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByLabel("Add a comment").fill("Initial comment");
    await page.getByRole("button", { name: "Post comment" }).click();
    await expect(page.getByText("Initial comment")).toBeVisible();

    await page.getByRole("button", { name: "Edit comment" }).click();
    await page.getByLabel("Edit comment text").fill("Edited comment");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Edited comment")).toBeVisible();
  });
});
