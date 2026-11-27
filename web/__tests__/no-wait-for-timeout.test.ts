import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { findCredentialLiterals } from "@/scripts/scanCredentials";

const E2E_DIR = path.resolve(__dirname, "..", "e2e");

function collectE2EFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectE2EFiles(full));
    } else if (/\.(ts|js)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe("Playwright E2E conventions (G-FE-22, Property 58)", () => {
  it("forbids waitForTimeout in all web/e2e/ files", () => {
    const files = collectE2EFiles(E2E_DIR);
    const offenders = files.filter((file) =>
      fs.readFileSync(file, "utf8").includes("waitForTimeout")
    );
    expect(offenders).toEqual([]);
  });

  it("Property 58: E2E sources contain no literal credentials", () => {
    const files = collectE2EFiles(E2E_DIR);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      expect(findCredentialLiterals(source)).toEqual([]);
    }

    const tokenArb = fc
      .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789".split("")), {
        minLength: 3,
        maxLength: 10,
      })
      .map((c) => c.join(""));

    fc.assert(
      fc.property(tokenArb, tokenArb, (local, domain) => {
        const emailSrc = `const email = "${local}@${domain}.example";`;
        expect(findCredentialLiterals(emailSrc).length).toBeGreaterThan(0);

        const pwSrc = `await page.getByLabel("Password").fill("${local}");`;
        expect(findCredentialLiterals(pwSrc).length).toBeGreaterThan(0);

        const cleanSrc = `const { email, password } = requireCredentials();\nawait page.getByLabel("Password").fill(password);`;
        expect(findCredentialLiterals(cleanSrc)).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });

  it("ensures V8 spec files either import requireCredentials or use no credentials", () => {
    const v8Specs = ["welcome.spec.ts", "logo.spec.ts", "layout.spec.ts"];
    for (const specName of v8Specs) {
      const fullPath = path.join(E2E_DIR, specName);
      expect(fs.existsSync(fullPath)).toBe(true);
      const source = fs.readFileSync(fullPath, "utf8");
      expect(findCredentialLiterals(source)).toEqual([]);
      if (specName === "logo.spec.ts" || specName === "layout.spec.ts") {
        expect(source).toContain("requireCredentials");
      }
    }
  });

  it("ensures V11 spec files import requireCredentials and contain no literal credentials", () => {
    const v11Specs = [
      "inviteJoin.spec.ts",
      "checklistLinksUrgent.spec.ts",
      "overdue.spec.ts",
    ];
    for (const specName of v11Specs) {
      const fullPath = path.join(E2E_DIR, specName);
      expect(fs.existsSync(fullPath)).toBe(true);
      const source = fs.readFileSync(fullPath, "utf8");
      expect(findCredentialLiterals(source)).toEqual([]);
      expect(source).toContain("requireCredentials");
    }
  });
});
