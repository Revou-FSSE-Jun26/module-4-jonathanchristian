import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const IMPROVEMENTS_DIR = path.join(REPO_ROOT, "improvements");
const SPECS_DIR = path.join(REPO_ROOT, ".kiro", "specs", "kano");
const README_PATH = path.join(REPO_ROOT, "README.md");

function listExampleHtmlFiles(): string[] {
  if (!fs.existsSync(IMPROVEMENTS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(IMPROVEMENTS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".html"));
}

function collectSpecMarkdownFiles(): string[] {
  if (!fs.existsSync(SPECS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(SPECS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .map((name) => path.join(SPECS_DIR, name));
}

describe("Documentation does not reference example HTML files (R36.14)", () => {
  it("forbids naming, linking, or embedding improvements/*.html in README.md or .kiro/specs/kano/", () => {
    const htmlFiles = listExampleHtmlFiles();
    if (htmlFiles.length === 0) {
      return;
    }

    const docFiles = [
      ...(fs.existsSync(README_PATH) ? [README_PATH] : []),
      ...collectSpecMarkdownFiles(),
    ];

    const violations: string[] = [];
    for (const docFile of docFiles) {
      const content = fs.readFileSync(docFile, "utf8");
      for (const htmlName of htmlFiles) {
        if (content.includes(htmlName)) {
          violations.push(`${path.relative(REPO_ROOT, docFile)} mentions ${htmlName}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
