import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { LABEL_CLASS, LABEL_KEYS, labelColor, normalizeLabel } from "@/lib/labelColor";

describe("lib/labelColor (Task 49.3)", () => {
  // Feature: kano, Property 63: Label color
  it("Property 63: labelColor is deterministic, case/whitespace invariant, and maps to 8 valid static classes", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 40 }), (text) => {
        const key = labelColor(text);
        expect(LABEL_KEYS).toContain(key);
        expect(labelColor(text)).toBe(key);
        expect(labelColor(`  ${text.toUpperCase()} \t`)).toBe(key);
        expect(labelColor(` ${text.toLowerCase()} `)).toBe(key);

        const cls = LABEL_CLASS[key];
        expect(cls).toBeTruthy();
        expect(cls).not.toContain("${");
        expect(cls).toContain(`bg-label-${key}-bg`);
        expect(cls).toContain(`text-label-${key}-fg`);
      }),
      { numRuns: 100 }
    );
  });

  it("handles non-ASCII and NFC/NFD normalization consistently", () => {
    const nfc = "caf\u00e9";
    const nfd = "cafe\u0301";
    expect(normalizeLabel(nfc)).toBe(normalizeLabel(nfd));
    expect(labelColor(nfc)).toBe(labelColor(nfd));
    expect(labelColor(" 设计 ")).toBe(labelColor("设计"));
  });
});
