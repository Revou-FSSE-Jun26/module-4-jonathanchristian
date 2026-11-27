import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { resolveCardParam, stripCardParam } from "@/lib/deepLink";

describe("V12 DeepLink (Property 81)", () => {
  // Feature: kano, Property 81: Deep-link parameter parsing and URL rebuild
  it("Property 81: resolveCardParam handles absent, empty, strings, and arrays", () => {
    expect(resolveCardParam(undefined)).toBeNull();
    expect(resolveCardParam("")).toBeNull();
    expect(resolveCardParam([])).toBeNull();
    expect(resolveCardParam(["", "c1"])).toBeNull();

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }),
        fc.array(fc.string({ maxLength: 40 }), { maxLength: 5 }),
        (first, rest) => {
          expect(resolveCardParam(first)).toBe(first);
          expect(resolveCardParam([first, ...rest])).toBe(first);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: kano, Property 81: Deep-link parameter parsing and URL rebuild
  it("Property 81: My Tasks target round-trips card_id through URLSearchParams and resolveCardParam", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (boardId, cardId) => {
        const href = `/boards/${boardId}?card=${encodeURIComponent(cardId)}`;
        const url = new URL(`https://kano.example${href}`);
        expect(url.pathname).toBe(`/boards/${boardId}`);
        const raw = url.searchParams.getAll("card");
        expect(resolveCardParam(raw)).toBe(cardId);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: kano, Property 81: Deep-link parameter parsing and URL rebuild
  it("Property 81: stripCardParam removes only card, preserves other params in order and hash, and is idempotent", () => {
    const paramNameArb = fc
      .stringMatching(/^[a-z]{1,8}$/)
      .filter((k) => k !== "card");
    const paramValueArb = fc.stringMatching(/^[a-z0-9_-]{0,12}$/);
    const paramsArb = fc.array(fc.tuple(paramNameArb, paramValueArb), { maxLength: 5 });

    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        paramsArb,
        fc.integer({ min: 0, max: 5 }),
        fc.stringMatching(/^[a-z0-9_-]{0,10}$/),
        (boardId, cardId, otherParams, insertPos, hashText) => {
          const search = new URLSearchParams();
          const idx = Math.min(insertPos, otherParams.length);
          otherParams.forEach(([k, v], i) => {
            if (i === idx) {
              search.append("card", cardId);
            }
            search.append(k, v);
          });
          if (idx === otherParams.length) {
            search.append("card", cardId);
          }

          const hash = hashText ? `#${hashText}` : "";
          const fullUrl = `https://kano.example/boards/${boardId}?${search.toString()}${hash}`;
          const stripped = stripCardParam(fullUrl);

          const expectedParams = new URLSearchParams();
          for (const [k, v] of otherParams) {
            expectedParams.append(k, v);
          }
          const expectedSearch = expectedParams.toString();
          const expected = `/boards/${boardId}${expectedSearch ? `?${expectedSearch}` : ""}${hash}`;

          expect(stripped).toBe(expected);
          expect(stripCardParam(`https://kano.example${stripped}`)).toBe(stripped);
        }
      ),
      { numRuns: 100 }
    );
  });
});
