import { expect, test, type Locator } from "@playwright/test";
import { requireCredentials } from "./support/credentials";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function boxesIntersect(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

async function expectNoOverlap(locators: Locator[]): Promise<Box[]> {
  const boxes: Box[] = [];
  for (const loc of locators) {
    const box = await loc.boundingBox();
    expect(box).not.toBeNull();
    boxes.push(box!);
  }
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      expect(boxesIntersect(boxes[i], boxes[j])).toBe(false);
    }
  }
  return boxes;
}

test.describe("V8 responsive layout E2E (R33.16)", () => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 1920, height: 1080 },
  ]) {
    test(`/welcome has no horizontal scroll at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/welcome");

      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          )
        )
        .toBe(true);

      if (viewport.width === 375) {
        const banner = page.getByRole("banner");
        const hero = page.getByRole("region", {
          name: "Organize work smoothly, from idea to done",
        });
        const bottomCta = page.getByRole("region", {
          name: "Ready to bring calm to your project planning?",
        });

        const targets = [
          banner.getByRole("link", { name: "Kano", exact: true }),
          banner.getByRole("link", { name: "Log in" }),
          banner.getByRole("link", { name: "Register" }),
          hero.getByRole("button", { name: "Get started" }),
          bottomCta.getByRole("button", { name: "Create account" }),
          bottomCta.getByRole("button", { name: "Log in" }),
        ];

        for (const target of targets) {
          const box = await target.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test(`board toolbar and single 1px separator have no overlap at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      const { email, password } = requireCredentials();
      const boardName = `Layout Board ${viewport.width} ${Date.now()}`;

      await page.setViewportSize(viewport);
      await page.goto("/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Log in" }).click();
      await expect(page).toHaveURL(/\/$/);

      await page.getByRole("button", { name: /create board/i }).click();
      await page.getByLabel("Board name").fill(boardName);
      await page.getByRole("dialog").getByRole("button", { name: /create/i }).click();
      await page.getByRole("link", { name: boardName }).click();
      await expect(page).toHaveURL(/\/boards\//);

      for (const colTitle of ["To do", "In progress"]) {
        await page.getByRole("button", { name: /add column/i }).click();
        await page.getByLabel(/column name/i).fill(colTitle);
        await page.getByRole("button", { name: /^add column$/i }).click();
        await expect(page.getByRole("heading", { name: colTitle })).toBeVisible();
      }

      const separators = page.getByRole("separator");
      await expect(separators).toHaveCount(1);
      await expect(separators.first()).toBeVisible();

      const toolbar = page.getByTestId("board-toolbar");
      const toolbarBoxes = await expectNoOverlap([
        toolbar.getByRole("link", { name: "Boards" }),
        toolbar.getByRole("heading", { name: boardName }),
        toolbar.getByPlaceholder(/search/i),
        toolbar.getByRole("button", { name: "Members" }),
        toolbar.getByRole("button", { name: "Analytics" }),
      ]);

      const sepBox = await separators.first().boundingBox();
      expect(sepBox).not.toBeNull();
      expect(Math.abs(sepBox!.height - 1)).toBeLessThanOrEqual(0.5);

      const maxToolbarBottom = Math.max(...toolbarBoxes.map((b) => b.y + b.height));
      const firstColBox = await page.getByRole("heading", { name: "To do" }).boundingBox();
      expect(firstColBox).not.toBeNull();

      expect(sepBox!.y).toBeGreaterThanOrEqual(maxToolbarBottom - 1);
      expect(sepBox!.y).toBeLessThanOrEqual(firstColBox!.y);

      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
          )
        )
        .toBe(true);
    });
  }
});
