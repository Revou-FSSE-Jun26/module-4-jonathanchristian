import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { diffCardFields, type CardEditableFields } from "@/lib/format";
import { CARD_STATUSES } from "@/lib/status";

const statusArb = fc.constantFrom(...CARD_STATUSES);

const editableCardArb: fc.Arbitrary<CardEditableFields> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 40 }),
  description: fc.option(fc.string({ maxLength: 60 }), { nil: null }),
  due_date: fc.option(fc.constant("2026-12-01"), { nil: null }),
  labels: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
  assignee_id: fc.option(fc.uuid(), { nil: null }),
  status: statusArb,
});

describe("diffCardFields (Property 35)", () => {
  it("Property 35: returns only fields that changed, including status-only changes", () => {
    fc.assert(
      fc.property(editableCardArb, editableCardArb, (original, edited) => {
        const diff = diffCardFields(original, edited);
        if (edited.title !== original.title) expect(diff.title).toBe(edited.title);
        else expect("title" in diff).toBe(false);

        if (edited.description !== original.description)
          expect(diff.description).toBe(edited.description);
        else expect("description" in diff).toBe(false);

        if (edited.due_date !== original.due_date) expect(diff.due_date).toBe(edited.due_date);
        else expect("due_date" in diff).toBe(false);

        if (edited.assignee_id !== original.assignee_id)
          expect(diff.assignee_id).toBe(edited.assignee_id);
        else expect("assignee_id" in diff).toBe(false);

        if (edited.status !== original.status) expect(diff.status).toBe(edited.status);
        else expect("status" in diff).toBe(false);
      }),
      { numRuns: 150 }
    );
  });

  it("produces exactly { status } when only status changes", () => {
    const base: CardEditableFields = {
      title: "Task",
      description: null,
      due_date: null,
      labels: ["docs"],
      assignee_id: null,
      status: "NOT_STARTED",
    };
    expect(diffCardFields(base, { ...base, status: "IN_PROGRESS" })).toEqual({
      status: "IN_PROGRESS",
    });
    expect(diffCardFields(base, { ...base })).toEqual({});
  });
});
