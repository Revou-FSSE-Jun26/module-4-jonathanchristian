import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LABEL_CLASS, LABEL_KEYS } from "@/lib/labelColor";
import { CARD_STATUSES, STATUS_STYLE } from "@/lib/status";

const WEB_ROOT = path.resolve(__dirname, "..");

describe("Tailwind scanner sources and static class strings (Task 49.5)", () => {
  it("globals.css scans components, hooks, and lib, and defines label-gray tokens", () => {
    const css = fs.readFileSync(path.join(WEB_ROOT, "app", "globals.css"), "utf8");
    expect(css).toContain('@source "../components";');
    expect(css).toContain('@source "../hooks";');
    expect(css).toContain('@source "../lib";');
    expect(css).toContain("--color-label-gray-bg:");
    expect(css).toContain("--color-label-gray-fg:");
  });

  it("every class string exported from lib/status.ts and lib/labelColor.ts is a complete literal without interpolation", () => {
    for (const status of CARD_STATUSES) {
      const cls = STATUS_STYLE[status].className;
      expect(cls).not.toContain("${");
      expect(cls.trim().split(/\s+/).length).toBe(2);
    }

    for (const key of LABEL_KEYS) {
      const cls = LABEL_CLASS[key];
      expect(cls).not.toContain("${");
      expect(cls.trim().split(/\s+/).length).toBe(2);
    }
  });
});
