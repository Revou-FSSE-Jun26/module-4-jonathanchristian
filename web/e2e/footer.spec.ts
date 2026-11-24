import { expect, test, type Locator } from "@playwright/test";

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

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1920, height: 1080 },
] as const;

const ANONYMOUS_PAGES = ["/welcome", "/login"] as const;

test.describe("V9 Footer E2E (R33.17, R27.11, R27.12)", () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ANONYMOUS_PAGES) {
      test(`footer renders cleanly on ${route} at ${viewport.width}x${viewport.height}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto(route);

        const footer = page.getByRole("contentinfo");
        await expect(footer).toBeVisible();
        await expect(footer).toContainText("Kano");
        await expect(footer).toContainText("Built in 2026 by Jonathan Christian");

        const github = footer.getByRole("link", { name: "Kano on GitHub", exact: true });
        const linkedin = footer.getByRole("link", { name: "Kano on LinkedIn", exact: true });

        await expect(github).toBeVisible();
        await expect(github).toHaveAttribute("href", "https://github.com/jonathanch12");
        await expect(github).toHaveAttribute("target", "_blank");
        await expect(github).toHaveAttribute("rel", /noopener/);
        await expect(github).toHaveAttribute("rel", /noreferrer/);

        await expect(linkedin).toBeVisible();
        await expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/jonathan-christian-ba3233311");
        await expect(linkedin).toHaveAttribute("target", "_blank");
        await expect(linkedin).toHaveAttribute("rel", /noopener/);
        await expect(linkedin).toHaveAttribute("rel", /noreferrer/);

        await expect
          .poll(() =>
            page.evaluate(
              () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
            )
          )
          .toBe(true);

        if (viewport.width === 375) {
          const footerBox = await footer.boundingBox();
          expect(footerBox).not.toBeNull();
          expect(footerBox!.x).toBeGreaterThanOrEqual(0);
          expect(footerBox!.x + footerBox!.width).toBeLessThanOrEqual(viewport.width);

          const brandText = footer.getByText("Built in 2026 by Jonathan Christian");
          const [, githubBox, linkedinBox] = await expectNoOverlap([
            brandText,
            github,
            linkedin,
          ]);
          expect(githubBox.width).toBeGreaterThanOrEqual(44);
          expect(githubBox.height).toBeGreaterThanOrEqual(44);
          expect(linkedinBox.width).toBeGreaterThanOrEqual(44);
          expect(linkedinBox.height).toBeGreaterThanOrEqual(44);
        }

        if (viewport.width === 1920) {
          for (const link of [github, linkedin]) {
            const before = await link.evaluate((el) => {
              const s = getComputedStyle(el);
              return { bg: s.backgroundColor, color: s.color };
            });
            await link.hover();
            await expect
              .poll(() =>
                link.evaluate((el) => {
                  const s = getComputedStyle(el);
                  return { bg: s.backgroundColor, color: s.color };
                })
              )
              .not.toEqual(before);
          }
        }
      });
    }
  }
});
