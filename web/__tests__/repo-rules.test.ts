import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "..");
const SKIP_DIRS = new Set(["node_modules", ".next", "playwright-report", "test-results"]);

function collectFiles(dir: string, exts: Set<string>, skipTestDirs = false): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    if (skipTestDirs && (entry.name === "__tests__" || entry.name === "e2e")) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts, skipTestDirs));
    } else if (exts.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

describe("Frontend repository rules (G-FE-03, G-FE-04, G-FE-15, G-BE-15)", () => {
  it("forbids dangerouslySetInnerHTML anywhere under web/", () => {
    const files = collectFiles(WEB_ROOT, new Set([".ts", ".tsx", ".js", ".jsx"]));
    const selfPath = path.resolve(__filename);
    const offenders = files
      .filter((f) => path.resolve(f) !== selfPath)
      .filter((f) => fs.readFileSync(f, "utf8").includes("dangerouslySetInnerHTML"));
    expect(offenders).toEqual([]);
  });

  it("forbids raw <button outside BaseButton.tsx", () => {
    const files = collectFiles(WEB_ROOT, new Set([".tsx"]), true);
    const baseButtonPath = path.join(WEB_ROOT, "components", "shared", "BaseButton.tsx");
    const offenders = files
      .filter((f) => path.resolve(f) !== path.resolve(baseButtonPath))
      .filter((f) => /<button[\s>]/.test(fs.readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("enforces one exported React component per file in components/", () => {
    const compFiles = collectFiles(path.join(WEB_ROOT, "components"), new Set([".tsx"]));
    for (const file of compFiles) {
      const content = fs.readFileSync(file, "utf8");
      const matches = Array.from(
        content.matchAll(/export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)\b/g)
      );
      expect(matches.map((m) => m[1])).toHaveLength(1);
    }
  });

  it("keeps all web/ source files at or below 300 lines via scripts/check_file_size.py", () => {
    const venvPython = path.join(REPO_ROOT, "app", "venv", "Scripts", "python.exe");
    const pythonBin = fs.existsSync(venvPython) ? venvPython : "python";
    const output = execFileSync(
      pythonBin,
      [path.join(REPO_ROOT, "scripts", "check_file_size.py"), "web"],
      { cwd: REPO_ROOT, encoding: "utf8" }
    );
    expect(output).toContain("OK:");
  });
});
