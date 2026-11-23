import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({ path: path.resolve(__dirname, ".env.test"), override: false });

function resolveE2EBaseUrl(): string {
  const raw = process.env.E2E_BASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "Missing required environment variable: E2E_BASE_URL (must be an absolute http or https URL)."
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      `E2E_BASE_URL must be an absolute http or https URL, received "${raw}".`
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `E2E_BASE_URL must use http or https protocol, received "${parsed.protocol}".`
    );
  }
  return raw.replace(/\/+$/, "");
}

const baseURL = resolveE2EBaseUrl();

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: 2,
  reporter: [["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["iPhone SE"] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
});
