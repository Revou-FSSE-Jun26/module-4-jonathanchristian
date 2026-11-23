import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildUniqueEmail,
  buildWrongPassword,
  requireCredentials,
} from "@/e2e/support/credentials";

describe("E2E credential & env support (Task 31.1)", () => {
  const origEmail = process.env.E2E_USER_EMAIL;
  const origPassword = process.env.E2E_USER_PASSWORD;

  afterEach(() => {
    if (origEmail === undefined) delete process.env.E2E_USER_EMAIL;
    else process.env.E2E_USER_EMAIL = origEmail;

    if (origPassword === undefined) delete process.env.E2E_USER_PASSWORD;
    else process.env.E2E_USER_PASSWORD = origPassword;
  });

  it("throws naming the missing variable without printing any value", () => {
    delete process.env.E2E_USER_EMAIL;
    process.env.E2E_USER_PASSWORD = "secret-value-not-printed";

    expect(() => requireCredentials()).toThrowError(
      "Missing required environment variable: E2E_USER_EMAIL"
    );

    process.env.E2E_USER_EMAIL = "e2e-test@example.com";
    delete process.env.E2E_USER_PASSWORD;
    try {
      requireCredentials();
      expect.unreachable("Should have thrown");
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toBe("Missing required environment variable: E2E_USER_PASSWORD");
      expect(msg).not.toContain("e2e-test@example.com");
    }
  });

  it("dotenv with override: false does not override existing process.env variables", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kano-env-"));
    const envPath = path.join(tmpDir, ".env.test");
    fs.writeFileSync(envPath, "E2E_USER_EMAIL=from-file@example.com\n", "utf8");

    process.env.E2E_USER_EMAIL = "from-process@example.com";
    dotenv.config({ path: envPath, override: false });
    expect(process.env.E2E_USER_EMAIL).toBe("from-process@example.com");

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("builds unique plus-addressed emails and runtime wrong passwords", () => {
    process.env.E2E_USER_EMAIL = "qa+old@example.com";
    process.env.E2E_USER_PASSWORD = "base-password";
    const creds = requireCredentials();

    const unique = buildUniqueEmail(creds.email, "run");
    expect(unique).toMatch(/^qa\+run-[^@]+@example\.com$/);
    expect(buildWrongPassword(creds.password)).toMatch(/^base-password-wrong-\d+$/);
  });
});
