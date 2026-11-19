import { expect, test, type Page } from "@playwright/test";

async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasOverflow).toBe(false);
}

async function assertTapTargets(page: Page) {
  const smallTargets = await page.evaluate(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea")
    );
    return els
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
      })
      .map((el) => el.outerHTML.slice(0, 80));
  });
  expect(smallTargets).toEqual([]);
}

test.describe("Mobile viewport (375 px) checks", () => {
  test("Register and Login have no horizontal overflow and meet 44px tap targets", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertTapTargets(page);

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in to Kano" })).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertTapTargets(page);
  });

  test("Authenticated pages have no page-level overflow and modals fit viewport", async ({
    page,
  }) => {
    const email = `e2e+mobile-${Date.now()}@example.com`;
    const password = "password123";

    await page.goto("/register");
    await page.getByLabel("Name").fill("Mobile User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/$/);

    // Dashboard
    await assertNoHorizontalOverflow(page);
    await assertTapTargets(page);

    // Create Board Modal fits within viewport
    await page.getByRole("button", { name: "Create board" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);

    await page.getByLabel("Board name").fill("Mobile Board");
    await dialog.getByRole("button", { name: "Create board" }).click();
    await page.getByRole("link", { name: /Mobile Board/ }).click();
    await expect(page).toHaveURL(/\/boards\//);
    await assertNoHorizontalOverflow(page);

    // My Tasks
    await page.goto("/my-tasks");
    await expect(page.getByRole("heading", { name: "My Tasks" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Profile
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
    await assertNoHorizontalOverflow(page);
    await assertTapTargets(page);
  });
});
