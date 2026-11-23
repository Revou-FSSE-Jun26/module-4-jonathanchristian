import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Task 33.2: the .vercelignore rules and the .env example files (Requirements 35.2, 1.14, 15.5).
const WEB_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "..");
const APP_ROOT = path.join(REPO_ROOT, "app");
const SKIP_DIRS = new Set(["node_modules", ".next", "venv", "__pycache__", "migrations", "playwright-report", "test-results", ".pytest_cache", ".hypothesis"]);
// Set by the Vercel platform, never by the user.
const PLATFORM_VARIABLES = new Set(["VERCEL"]);

function collectFiles(dir: string, exts: Set<string>): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectFiles(full, exts));
    else if (exts.has(path.extname(entry.name))) results.push(full);
  }
  return results;
}

function matchAll(files: string[], patterns: RegExp[]): Set<string> {
  const names = new Set<string>();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) names.add(match[1]);
    }
  }
  return names;
}

function exampleVariables(file: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match) vars.set(match[1], match[2].trim());
  }
  return vars;
}

function backendVariables(): Set<string> {
  const files = collectFiles(APP_ROOT, new Set([".py"]));
  const names = matchAll(files, [
    /os\.environ\.get\(\s*["']([A-Z][A-Z0-9_]*)["']/g,
    /os\.environ\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]/g,
    /os\.getenv\(\s*["']([A-Z][A-Z0-9_]*)["']/g,
  ]);
  const config = fs.readFileSync(path.join(APP_ROOT, "config.py"), "utf8");
  const required = /REQUIRED_VARIABLES\s*=\s*\(([\s\S]*?)\)/.exec(config);
  expect(required, "REQUIRED_VARIABLES not found in app/config.py").not.toBeNull();
  for (const match of required![1].matchAll(/["']([A-Z][A-Z0-9_]*)["']/g)) names.add(match[1]);
  return names;
}

const PROCESS_ENV = [/process\.env\.([A-Z][A-Z0-9_]*)/g, /process\.env\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]/g];
const REQUIRE_ENV = [/requireEnv\(\s*["']([A-Z][A-Z0-9_]*)["']\s*\)/g];

describe(".vercelignore (V6)", () => {
  it("still excludes web/, app/venv/, and .kiro/, so web/.env.test is never uploaded", () => {
    const rules = fs
      .readFileSync(path.join(REPO_ROOT, ".vercelignore"), "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim());
    for (const rule of ["web/", "app/venv/", ".kiro/"]) expect(rules).toContain(rule);
    expect(rules.filter((line) => line.startsWith("!web"))).toEqual([]);
  });
});

describe(".env example files (V6)", () => {
  it("app/.env.example lists every variable the backend reads", () => {
    const listed = exampleVariables(path.join(APP_ROOT, ".env.example"));
    const missing = [...backendVariables()].filter((n) => !PLATFORM_VARIABLES.has(n) && !listed.has(n));
    expect(missing).toEqual([]);
  });

  it("web/.env.example lists every variable the web app reads", () => {
    const files = collectFiles(WEB_ROOT, new Set([".ts", ".tsx", ".js", ".mjs"])).filter(
      (f) => !f.includes(`${path.sep}__tests__${path.sep}`) && !f.includes(`${path.sep}e2e${path.sep}`) && path.basename(f) !== "playwright.config.ts"
    );
    const listed = exampleVariables(path.join(WEB_ROOT, ".env.example"));
    const missing = [...matchAll(files, PROCESS_ENV)].filter((n) => !PLATFORM_VARIABLES.has(n) && n !== "NODE_ENV" && !listed.has(n));
    expect(missing).toEqual([]);
  });

  it("web/.env.test.example lists exactly the three E2E variables with placeholder values", () => {
    const listed = exampleVariables(path.join(WEB_ROOT, ".env.test.example"));
    expect([...listed.keys()].sort()).toEqual(["E2E_BASE_URL", "E2E_USER_EMAIL", "E2E_USER_PASSWORD"]);
    expect(listed.get("E2E_BASE_URL")).toMatch(/^http:\/\/localhost(:\d+)?$/);
    expect(listed.get("E2E_USER_EMAIL")).toMatch(/@example\.(com|org|net)$/);
    expect(listed.get("E2E_USER_PASSWORD")).toMatch(/replace|change|placeholder/i);
  });

  it("web/.env.test.example covers every variable the Playwright config and e2e/ read", () => {
    const files = [
      path.join(WEB_ROOT, "playwright.config.ts"),
      ...collectFiles(path.join(WEB_ROOT, "e2e"), new Set([".ts"])),
    ];
    const read = new Set([...matchAll(files, PROCESS_ENV), ...matchAll(files, REQUIRE_ENV)]);
    read.delete("CI");
    const listed = exampleVariables(path.join(WEB_ROOT, ".env.test.example"));
    expect([...read].filter((n) => !listed.has(n))).toEqual([]);
  });
});
