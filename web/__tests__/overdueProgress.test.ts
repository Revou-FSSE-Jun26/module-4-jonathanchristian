import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatOverdue, isOverdue, todayUtc } from "@/lib/overdue";
import { progressPercent } from "@/lib/progress";
import { CARD_STATUSES } from "@/lib/status";

describe("lib/overdue and lib/progress (Task 49.6)", () => {
  // Feature: kano, Property 65: Overdue chip and text (pure part)
  it("Property 65 (pure): isOverdue is true iff due < today and status !== DONE, and formatOverdue pluralizes", () => {
    expect(todayUtc(new Date("2026-11-27T23:59:59Z"))).toBe("2026-11-27");
    expect(formatOverdue(1)).toBe("1 day overdue");
    expect(formatOverdue(2)).toBe("2 days overdue");

    const dateArb = fc.constantFrom("2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28");
    fc.assert(
      fc.property(
        fc.option(dateArb, { nil: null }),
        fc.constantFrom(...CARD_STATUSES),
        (due, status) => {
          const today = "2026-11-27";
          const expected = due !== null && due < today && status !== "DONE";
          expect(isOverdue(due, status, today)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 3650 }), (days) => {
        const text = formatOverdue(days);
        if (days === 1) {
          expect(text).toBe("1 day overdue");
        } else {
          expect(text).toBe(`${days} days overdue`);
        }
      }),
      { numRuns: 50 }
    );
  });

  // Feature: kano, Property 66: Checklist rules (progress part)
  it("Property 66 (progress): progressPercent returns 0 for total 0 and round(done/total*100) otherwise", () => {
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(3, 5)).toBe(60);
    expect(progressPercent(5, 5)).toBe(100);

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), fc.integer({ min: 0, max: 50 }), (total, rawDone) => {
        const done = Math.min(rawDone, total);
        expect(progressPercent(done, total)).toBe(Math.round((done / total) * 100));
      }),
      { numRuns: 100 }
    );
  });
});
