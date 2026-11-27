import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  applyBoardPatches,
  EMPTY_PATCHES,
  parsePatches,
  withDelete,
  withRename,
  type BoardPatches,
} from "@/lib/boardPatches";
import type { BoardSummary, Role } from "@/lib/types";

const isoDateArb = fc
  .integer({ min: 1_700_000_000_000, max: 1_800_000_000_000 })
  .map((ms) => new Date(ms).toISOString());

const boardSummaryArb: fc.Arbitrary<BoardSummary> = fc.record({
  board_id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  my_role: fc.constantFrom<Role>("admin", "manager", "member", "guest"),
  created_at: isoDateArb,
  updated_at: fc.option(isoDateArb, { nil: undefined }),
  member_count: fc.integer({ min: 1, max: 50 }),
  card_count: fc.integer({ min: 0, max: 200 }),
});

describe("V12 BoardPatches (Property 82)", () => {
  // Feature: kano, Property 82: Board patches merge
  it("Property 82: applyBoardPatches merges renames by updated_at, removes deleted, preserves order and counts, and is idempotent", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(boardSummaryArb, {
          selector: (b) => b.board_id,
          maxLength: 15,
        }),
        fc.array(
          fc.oneof(
            fc.record({
              op: fc.constant("rename" as const),
              idx: fc.nat(14),
              name: fc.string({ minLength: 1, maxLength: 30 }),
              updated_at: isoDateArb,
            }),
            fc.record({
              op: fc.constant("delete" as const),
              idx: fc.nat(14),
            })
          ),
          { maxLength: 20 }
        ),
        (boards, ops) => {
          let patches: BoardPatches = EMPTY_PATCHES;
          for (const op of ops) {
            if (boards.length === 0) continue;
            const target = boards[op.idx % boards.length];
            if (op.op === "rename") {
              patches = withRename(patches, target.board_id, op.name, op.updated_at);
            } else {
              patches = withDelete(patches, target.board_id);
            }
          }

          const merged = applyBoardPatches(boards, patches);
          const deletedSet = new Set(patches.deleted);

          // Order preserved and deleted boards removed
          const expectedIds = boards
            .filter((b) => !deletedSet.has(b.board_id))
            .map((b) => b.board_id);
          expect(merged.map((b) => b.board_id)).toEqual(expectedIds);

          // Counts and other fields preserved; rename applied iff listed updated_at missing or older
          for (const item of merged) {
            const orig = boards.find((b) => b.board_id === item.board_id)!;
            expect(item.member_count).toBe(orig.member_count);
            expect(item.card_count).toBe(orig.card_count);
            expect(item.my_role).toBe(orig.my_role);
            expect(item.created_at).toBe(orig.created_at);

            const rename = patches.renamed[item.board_id];
            if (!rename) {
              expect(item.name).toBe(orig.name);
            } else {
              const shouldApply =
                !orig.updated_at || Date.parse(orig.updated_at) < Date.parse(rename.updated_at);
              expect(item.name).toBe(shouldApply ? rename.name : orig.name);
            }
          }

          // Idempotence and fixed point
          const mergedTwice = applyBoardPatches(merged, patches);
          expect(mergedTwice).toEqual(merged);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: kano, Property 82: Board patches merge
  it("Property 82: parsePatches round-trips valid JSON and falls back to EMPTY_PATCHES on invalid JSON", () => {
    expect(parsePatches(null)).toEqual(EMPTY_PATCHES);
    expect(parsePatches("{not json")).toEqual(EMPTY_PATCHES);
    expect(parsePatches("[]")).toEqual(EMPTY_PATCHES);
    expect(parsePatches(JSON.stringify({ renamed: [], deleted: {} }))).toEqual(EMPTY_PATCHES);

    const patchesArb: fc.Arbitrary<BoardPatches> = fc.record({
      renamed: fc.dictionary(
        fc.uuid(),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 30 }),
          updated_at: isoDateArb,
        }),
        { maxKeys: 5 }
      ),
      deleted: fc.uniqueArray(fc.uuid(), { maxLength: 5 }),
    });

    fc.assert(
      fc.property(patchesArb, (patches) => {
        expect(parsePatches(JSON.stringify(patches))).toEqual(patches);
      }),
      { numRuns: 100 }
    );
  });
});
