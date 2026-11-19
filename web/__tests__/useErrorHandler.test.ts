import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import fc from "fast-check";
import toast from "react-hot-toast";
import {
  GENERIC_ERROR_MESSAGE,
  STATUS_ERROR_MESSAGES,
  useErrorHandler,
} from "@/hooks/useErrorHandler";
import { ApiError } from "@/lib/errors";

const logoutMock = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ logout: logoutMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
  },
}));

describe("hooks/useErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: kano, Property 27: Error handler mapping
  it("Property 27: maps known statuses to pairwise-distinct messages and others to generic", () => {
    const knownStatuses = [400, 401, 403, 404, 409, 500];
    const messages = knownStatuses.map((s) => STATUS_ERROR_MESSAGES[s]);
    expect(new Set(messages).size).toBe(knownStatuses.length);

    const { result } = renderHook(() => useErrorHandler());

    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 0, max: 599 }).map((status) => new ApiError(status, "api err")),
          fc.string().map((msg) => new Error(msg)),
          fc.anything()
        ),
        (err) => {
          vi.mocked(toast.error).mockClear();
          logoutMock.mockClear();

          result.current.handleError(err);

          expect(toast.error).toHaveBeenCalledTimes(1);
          const shown = vi.mocked(toast.error).mock.calls[0][0];

          if (err instanceof ApiError && knownStatuses.includes(err.statusCode)) {
            expect(shown).toBe(STATUS_ERROR_MESSAGES[err.statusCode]);
            if (err.statusCode === 401) {
              expect(logoutMock).toHaveBeenCalledTimes(1);
            } else {
              expect(logoutMock).not.toHaveBeenCalled();
            }
          } else {
            expect(shown).toBe(GENERIC_ERROR_MESSAGE);
            expect(logoutMock).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
