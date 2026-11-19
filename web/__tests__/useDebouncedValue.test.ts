import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import fc from "fast-check";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

describe("hooks/useDebouncedValue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // Feature: kano, Property 33: Search debounce
  it("Property 33: keystroke gaps under 300 ms emit only the final value after 300 ms", () => {
    vi.useFakeTimers();

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 20 }),
            gapMs: fc.integer({ min: 10, max: 290 }),
          }),
          { minLength: 1, maxLength: 8 }
        ),
        (keystrokes) => {
          const observedRequests: string[] = [];
          const { result, rerender, unmount } = renderHook(
            ({ q }: { q: string }) => useDebouncedValue(q, 300),
            { initialProps: { q: "" } }
          );

          for (const ks of keystrokes) {
            rerender({ q: ks.text });
            act(() => {
              vi.advanceTimersByTime(ks.gapMs);
            });
            if (result.current !== "") {
              observedRequests.push(result.current);
            }
          }

          expect(observedRequests).toHaveLength(0);

          act(() => {
            vi.advanceTimersByTime(300);
          });
          const finalText = keystrokes[keystrokes.length - 1].text;
          expect(result.current).toBe(finalText);

          // Clearing sends no request (debounced becomes "")
          rerender({ q: "" });
          act(() => {
            vi.advanceTimersByTime(300);
          });
          expect(result.current).toBe("");
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
