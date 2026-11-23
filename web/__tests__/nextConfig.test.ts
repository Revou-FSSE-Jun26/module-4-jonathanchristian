import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("next.config.ts invite headers", () => {
  it("sets Referrer-Policy: no-referrer and Cache-Control: no-store on /invite/:path*", async () => {
    expect(typeof nextConfig.headers).toBe("function");
    const rules = await nextConfig.headers!();
    const inviteRule = rules.find((r) => r.source === "/invite/:path*");
    expect(inviteRule).toBeDefined();
    expect(inviteRule!.headers).toEqual(
      expect.arrayContaining([
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "no-store" },
      ])
    );
  });
});
