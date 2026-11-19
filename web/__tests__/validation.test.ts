import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  validateBoardName,
  validateCardTitle,
  validateColumnName,
  validateCommentText,
  validateEmail,
  validateName,
  validatePassword,
  validateProfileFields,
} from "@/lib/validation";

function serverAcceptsTrimmed(value: string, max: number): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= max;
}

function serverAcceptsEmail(value: string): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

function serverAcceptsPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 128;
}

describe("lib/validation", () => {
  it("validates boundary cases for all fields", () => {
    expect(validateName("   ")).not.toBeNull();
    expect(validateName("Ada")).toBeNull();
    expect(validateName("a".repeat(100))).toBeNull();
    expect(validateName("a".repeat(101))).not.toBeNull();

    expect(validateEmail("bad")).not.toBeNull();
    expect(validateEmail("ada@example.com")).toBeNull();
    expect(validateEmail("a".repeat(243) + "@example.com")).not.toBeNull();

    expect(validatePassword("1234567")).not.toBeNull();
    expect(validatePassword("12345678")).toBeNull();
    expect(validatePassword("a".repeat(128))).toBeNull();
    expect(validatePassword("a".repeat(129))).not.toBeNull();

    expect(validateBoardName("Roadmap")).toBeNull();
    expect(validateColumnName("To Do")).toBeNull();
    expect(validateCardTitle("a".repeat(200))).toBeNull();
    expect(validateCardTitle("a".repeat(201))).not.toBeNull();
    expect(validateCommentText("   \n\t  ")).not.toBeNull();
    expect(validateCommentText("a".repeat(2000))).toBeNull();
    expect(validateCommentText("a".repeat(2001))).not.toBeNull();

    expect(validateProfileFields({ name: "Ada", email: "ada@example.com" })).toEqual({
      name: null,
      email: null,
    });
  });

  // Feature: kano, Property 29: Client validators mirror server rules
  it("Property 29: client validators mirror server rules for any string", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 2100 }), (input) => {
        expect(validateName(input) === null).toBe(serverAcceptsTrimmed(input, 100));
        expect(validateBoardName(input) === null).toBe(serverAcceptsTrimmed(input, 100));
        expect(validateColumnName(input) === null).toBe(serverAcceptsTrimmed(input, 100));
        expect(validateCardTitle(input) === null).toBe(serverAcceptsTrimmed(input, 200));
        expect(validateCommentText(input) === null).toBe(serverAcceptsTrimmed(input, 2000));
        expect(validateEmail(input) === null).toBe(serverAcceptsEmail(input));
        expect(validatePassword(input) === null).toBe(serverAcceptsPassword(input));
      }),
      { numRuns: 200 }
    );
  });
});
