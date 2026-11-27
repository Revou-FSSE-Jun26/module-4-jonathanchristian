import { expect, test } from "@playwright/test";
import { buildUniqueEmail, requireCredentials } from "./support/credentials";

test.describe("Board invitation links and V11 roles E2E", () => {
  test("member sees no column controls, admin promotes to manager, manager sees columns/members without analytics, guest is read-only", async ({
    browser,
    page,
  }) => {
    const { email: adminEmail, password } = requireCredentials();
    const boardName = `Invite Board ${Date.now()}`;

    await page.goto("/login");
    await page.getByLabel("Email").fill(adminEmail);
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

    await page.getByRole("button", { name: "Members" }).click();
    const memberLink = await page.getByLabel("Member link: can edit").inputValue();
    const guestLink = await page.getByLabel("Guest link: view only").inputValue();

    // Member joins in second browser context
    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    const memberEmail = buildUniqueEmail(adminEmail, "inv-member");
    await memberPage.goto("/register");
    await memberPage.getByLabel("Name").fill("Invited Member");
    await memberPage.getByLabel("Email").fill(memberEmail);
    await memberPage.getByLabel("Password").fill(password);
    await memberPage.getByRole("button", { name: "Create account" }).click();
    await expect(memberPage).toHaveURL(/\/login/);

    await memberPage.goto(memberLink);
    await expect(memberPage).toHaveURL(/\/login\?next=/);
    await memberPage.getByLabel("Email").fill(memberEmail);
    await memberPage.getByLabel("Password").fill(password);
    await memberPage.getByRole("button", { name: "Log in" }).click();
    await expect(memberPage).toHaveURL(new RegExp(new URL(memberLink).pathname));

    await memberPage.getByRole("button", { name: "Join" }).click();
    await expect(memberPage).toHaveURL(/\/boards\//);
    await expect(memberPage.getByRole("button", { name: "Add a card" })).toBeVisible();
    await expect(memberPage.getByRole("button", { name: "Add column" })).toHaveCount(0);

    // Creator promotes Invited Member to manager
    await page.getByLabel("Role for Invited Member").selectOption("manager");
    await expect(page.getByText(/Updated Invited Member/)).toBeVisible();

    // Reload as manager: sees column controls and Members, but no Analytics
    await memberPage.reload();
    await expect(memberPage.getByRole("button", { name: "Add column" })).toBeVisible();
    await expect(memberPage.getByRole("button", { name: "Members" })).toBeVisible();
    await expect(memberPage.getByRole("button", { name: "Analytics" })).toHaveCount(0);
    await memberCtx.close();

    // Guest joins in third browser context
    const guestCtx = await browser.newContext();
    const guestPage = await guestCtx.newPage();
    const guestEmail = buildUniqueEmail(adminEmail, "inv-guest");
    await guestPage.goto("/register");
    await guestPage.getByLabel("Name").fill("Invited Guest");
    await guestPage.getByLabel("Email").fill(guestEmail);
    await guestPage.getByLabel("Password").fill(password);
    await guestPage.getByRole("button", { name: "Create account" }).click();
    await expect(guestPage).toHaveURL(/\/login/);

    await guestPage.goto(guestLink);
    await expect(guestPage).toHaveURL(/\/login\?next=/);
    await guestPage.getByLabel("Email").fill(guestEmail);
    await guestPage.getByLabel("Password").fill(password);
    await guestPage.getByRole("button", { name: "Log in" }).click();
    await expect(guestPage).toHaveURL(new RegExp(new URL(guestLink).pathname));

    await guestPage.getByRole("button", { name: "Join" }).click();
    await expect(guestPage).toHaveURL(/\/boards\//);
    await expect(guestPage.getByText("Guest")).toBeVisible();
    await expect(guestPage.getByRole("button", { name: "Add column" })).toHaveCount(0);
    await expect(guestPage.getByRole("button", { name: "Add a card" })).toHaveCount(0);
    await guestCtx.close();
  });
});
