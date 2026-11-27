import { expect, test, type Page } from "@playwright/test";
import { requireCredentials } from "./support/credentials";

test.describe.configure({ mode: "serial" });

async function loginWithCredentials(page: Page) {
  const { email, password } = requireCredentials();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function createBoard(page: Page, boardName: string) {
  await page.getByRole("button", { name: "Create board" }).first().click();
  await page.getByLabel("Board name").fill(boardName);
  await page.getByRole("dialog").getByRole("button", { name: "Create board" }).click();
  await expect(page.getByRole("link", { name: new RegExp(boardName) })).toBeVisible();
}

async function deleteCurrentBoard(page: Page) {
  await page.getByRole("button", { name: "Delete board" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete board" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("V12 board management, deep link, and counts E2E", () => {
  test("1. renames a board from the toolbar and persists across Dashboard, back, and forward", async ({
    page,
  }) => {
    const boardName = `V12 rename ${Date.now()}`;
    const renamedName = `V12 renamed ${Date.now()}`;

    await loginWithCredentials(page);
    await createBoard(page, boardName);
    await page.getByRole("link", { name: new RegExp(boardName) }).click();
    await expect(page).toHaveURL(/\/boards\//);

    await page.getByRole("button", { name: "Rename board" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Board name").fill(renamedName);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(renamedName);

    await page.getByRole("link", { name: "Boards" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: new RegExp(renamedName) })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(renamedName);

    await page.goForward();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: new RegExp(renamedName) })).toBeVisible();

    await page.getByRole("link", { name: new RegExp(renamedName) }).click();
    await deleteCurrentBoard(page);
  });

  test("2. deletes a board via ConfirmDialog and keeps it absent after back navigation", async ({
    page,
  }) => {
    const boardName = `V12 delete ${Date.now()}`;

    await loginWithCredentials(page);
    await createBoard(page, boardName);
    await page.getByRole("link", { name: new RegExp(boardName) }).click();
    await expect(page).toHaveURL(/\/boards\//);

    await deleteCurrentBoard(page);
    await expect(page.getByRole("link", { name: new RegExp(boardName) })).toHaveCount(0);

    await page.goBack();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: new RegExp(boardName) })).toHaveCount(0);
  });

  test("3. opens CardDetailModal from My Tasks deep link and strips card param on close", async ({
    page,
  }) => {
    const boardName = `V12 deeplink ${Date.now()}`;
    const cardTitle = `V12 Task ${Date.now()}`;

    await loginWithCredentials(page);
    await createBoard(page, boardName);
    await page.getByRole("link", { name: new RegExp(boardName) }).click();

    await page.getByRole("button", { name: "Add column" }).click();
    await page.getByLabel("Column name").fill("To Do");
    await page.getByRole("button", { name: "Add column" }).click();

    const col = page.locator("section", { hasText: "To Do" });
    await col.getByRole("button", { name: "Add a card" }).click();
    await col.getByLabel("Card title").fill(cardTitle);
    await col.getByRole("button", { name: "Add card" }).click();

    const createDialog = page.getByRole("dialog");
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("Assignee").selectOption({ index: 1 });
    await createDialog.getByRole("button", { name: "Save changes" }).click();
    await expect(createDialog).not.toBeVisible();

    await page.goto("/my-tasks");
    await page.getByRole("link", { name: cardTitle }).click();
    await expect(page).toHaveURL(/\/boards\/[^?]+\?card=/);

    const deepLinkDialog = page.getByRole("dialog");
    await expect(deepLinkDialog).toBeVisible();
    await expect(deepLinkDialog.getByLabel("Title")).toHaveValue(cardTitle);

    await deepLinkDialog.getByRole("button", { name: "Close" }).click();
    await expect(deepLinkDialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/boards\/[^?]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(boardName);

    await deleteCurrentBoard(page);
  });

  test("4. shows Dashboard member and card counts on create and after adding a card", async ({
    page,
  }) => {
    const boardName = `V12 counts ${Date.now()}`;

    await loginWithCredentials(page);
    await createBoard(page, boardName);

    const boardCard = page.getByRole("link", { name: new RegExp(boardName) });
    await expect(boardCard.getByText("1 member")).toBeVisible();
    await expect(boardCard.getByText("0 cards")).toBeVisible();

    await boardCard.click();
    await page.getByRole("button", { name: "Add column" }).click();
    await page.getByLabel("Column name").fill("To Do");
    await page.getByRole("button", { name: "Add column" }).click();

    const col = page.locator("section", { hasText: "To Do" });
    await col.getByRole("button", { name: "Add a card" }).click();
    await col.getByLabel("Card title").fill("Counted card");
    await col.getByRole("button", { name: "Add card" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();

    await page.getByRole("link", { name: "Boards" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(boardCard.getByText("1 card")).toBeVisible();

    await boardCard.click();
    await deleteCurrentBoard(page);
  });
});
