import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { FORBIDDEN_CLAIMS, findForbiddenClaims } from "@/lib/forbiddenClaims";
import { FEATURES, PREVIEW_SAMPLE, WELCOME_COPY } from "@/lib/welcomeContent";

const SUBSTRING_CLAIMS = FORBIDDEN_CLAIMS.filter((c) => c !== "free");

const safeWordArb = fc
  .stringMatching(/^[a-z]{2,8}$/)
  .filter((w) => findForbiddenClaims(w).length === 0);

describe("forbiddenClaims (Task 35.1)", () => {
  it("reports 'rating' inside longer words and matches 'free' only as a whole word", () => {
    expect(findForbiddenClaims("operating")).toContain("rating");
    expect(findForbiddenClaims("integrating")).toContain("rating");
    expect(findForbiddenClaims("generating")).toContain("rating");

    expect(findForbiddenClaims("freedom")).not.toContain("free");
    expect(findForbiddenClaims("FREE!")).toContain("free");
    expect(findForbiddenClaims("Sign up (free).")).toContain("free");
  });

  it("returns no forbidden claims for WELCOME_COPY, FEATURES, and PREVIEW_SAMPLE", () => {
    const copyTexts = Object.values(WELCOME_COPY);
    const featureTexts = FEATURES.flatMap((f) => [f.title, f.description]);
    const previewTexts = PREVIEW_SAMPLE.flatMap((col) => [
      col.title,
      ...col.cards.flatMap((card) => [
        card.title,
        card.status,
        card.initials,
        ...card.labels.map((l) => l.text),
      ]),
    ]);

    for (const text of [...copyTexts, ...featureTexts, ...previewTexts]) {
      expect(findForbiddenClaims(text)).toEqual([]);
    }
  });

  // Feature: kano, Property 60: Forbidden-claims scan
  it("Property 60: detects injected forbidden claims case-insensitively and returns [] on clean text", () => {
    fc.assert(
      fc.property(
        fc.array(safeWordArb, { minLength: 1, maxLength: 6 }),
        fc.constantFrom(...SUBSTRING_CLAIMS),
        fc.boolean(),
        (words, claim, upper) => {
          const clean = words.join(" ");
          expect(findForbiddenClaims(clean)).toEqual([]);

          const injectedClaim = upper ? claim.toUpperCase() : claim.toLowerCase();
          const dirty = `${words[0]}${injectedClaim}${words.slice(1).join(" ")}`;
          expect(findForbiddenClaims(dirty)).toContain(claim);
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(
        safeWordArb,
        safeWordArb,
        fc.boolean(),
        fc.constantFrom(" ", ", ", ".", "!", " (", ")"),
        (before, after, upper, sep) => {
          const freeWord = upper ? "FREE" : "free";
          const asWholeWord = `${before}${sep}${freeWord}${sep}${after}`;
          expect(findForbiddenClaims(asWholeWord)).toContain("free");

          const insideWord = `${before}free${after}`;
          expect(findForbiddenClaims(insideWord)).not.toContain("free");
        }
      ),
      { numRuns: 100 }
    );
  });
});
