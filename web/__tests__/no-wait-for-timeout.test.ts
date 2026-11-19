import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const E2E_DIR = path.resolve(__dirname, "..", "e2e");

describe("Playwright E2E conventions (G-FE-17)", () => {
  it("forbids waitForTimeout in all web/e2e/ specs", () => {
    const entries = fs.readdirSync(E2E_DIR, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && /\.(ts|js)$/.test(e.name))
      .map((e) => path.join(E2E_DIR, e.name));

    const offenders = files.filter((file) =>
      fs.readFileSync(file, "utf8").includes("waitForTimeout")
    );
    expect(offenders).toEqual([]);
  });
});
