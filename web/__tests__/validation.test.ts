import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  validateBoardName,
  validateCardTitle,
  validateColumnName,
  validateCommentText,
  validateCurrentPassword,
  validateEmail,
  validateName,
  validateNewPassword,
  validatePassword,
  validatePasswordSection,
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

    expect(validateCurrentPassword("")).not.toBeNull();
    expect(validateCurrentPassword("x")).toBeNull();
    expect(validateNewPassword("1234567")).not.toBeNull();
    expect(validateNewPassword("12345678")).toBeNull();
    expect(validateNewPassword("a".repeat(128))).toBeNull();
    expect(validateNewPassword("a".repeat(129))).not.toBeNull();

    expect(validatePasswordSection("", "")).toEqual({
      currentPassword: null,
      newPassword: null,
    });
    expect(validatePasswordSection("oldpass1", "").newPassword).not.toBeNull();
    expect(validatePasswordSection("", "newpass1").currentPassword).not.toBeNull();
    expect(validatePasswordSection("oldpass1", "newpass1")).toEqual({
      currentPassword: null,
      newPassword: null,
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
        expect(validateNewPassword(input) === null).toBe(serverAcceptsPassword(input));
        expect(validateCurrentPassword(input) === null).toBe(input.length > 0);
      }),
      { numRuns: 200 }
    );
  });

  it("Property 29 (password section): mirrors server rules over arbitrary pairs", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 140 }), fc.string({ maxLength: 140 }), (cur, next) => {
        const res = validatePasswordSection(cur, next);
        const accepted = res.currentPassword === null && res.newPassword === null;
        const serverAccepts =
          (cur.length === 0 && next.length === 0) ||
          (cur.length > 0 && serverAcceptsPassword(next));
        expect(accepted).toBe(serverAccepts);
      }),
      { numRuns: 200 }
    );
  });
});
