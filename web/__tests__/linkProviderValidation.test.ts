import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { providerKey } from "@/lib/linkProvider";
import {
  validateChecklistText,
  validateLinkLabel,
  validateLinkUrl,
} from "@/lib/validation";

describe("lib/linkProvider and V11 validators (Task 49.7)", () => {
  // Feature: kano, Property 68: Workspace link validation (client mirror)
  it("Property 68: validateLinkUrl accepts valid http/https URLs and rejects invalid ones", () => {
    const validCases = [
      "https://example.com",
      "  http://localhost:3000/path?a=1#b  ",
      "HTTPS://DOCS.GOOGLE.COM/document/d/123",
      "https://sub.notion.so/page",
    ];
    for (const url of validCases) {
      expect(validateLinkUrl(url)).toBeNull();
    }

    const invalidCases = [
      "",
      "   ",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
      "ftp://example.com/file",
      "not-a-url",
      "https://example.com/has space",
      "https://",
      `https://example.com/${"a".repeat(2040)}`,
    ];
    for (const url of invalidCases) {
      expect(validateLinkUrl(url)).not.toBeNull();
    }

    fc.assert(
      fc.property(
        fc.constantFrom("http", "https", "HTTP", "HTTPS"),
        fc.stringMatching(/^[a-z0-9]{1,12}$/),
        fc.constantFrom("com", "org", "io"),
        (scheme, host, tld) => {
          expect(validateLinkUrl(`${scheme}://${host}.${tld}/doc`)).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: kano, Property 69: Provider icon key
  it("Property 69: providerKey maps exact hosts and subdomains case-insensitively and falls back to generic", () => {
    expect(providerKey("drive.google.com")).toBe("gdrive");
    expect(providerKey("DOCS.GOOGLE.COM")).toBe("gdrive");
    expect(providerKey("sub.drive.google.com")).toBe("gdrive");
    expect(providerKey("onedrive.live.com")).toBe("onedrive");
    expect(providerKey("1drv.ms")).toBe("onedrive");
    expect(providerKey("www.dropbox.com")).toBe("dropbox");
    expect(providerKey("notion.so")).toBe("notion");
    expect(providerKey("team.notion.site")).toBe("notion");

    // Non-suffix lookalikes must not match
    expect(providerKey("evil-dropbox.com")).toBe("generic");
    expect(providerKey("notnotion.so")).toBe("generic");
    expect(providerKey("example.com")).toBe("generic");
    expect(providerKey("")).toBe("generic");
  });

  // Feature: kano, Property 29: Client-side validation (V11 checklist and link label)
  it("Property 29 (V11): validateChecklistText and validateLinkLabel enforce length bounds", () => {
    expect(validateChecklistText("")).not.toBeNull();
    expect(validateChecklistText("   \t\n ")).not.toBeNull();
    expect(validateChecklistText("a")).toBeNull();
    expect(validateChecklistText("a".repeat(200))).toBeNull();
    expect(validateChecklistText("a".repeat(201))).not.toBeNull();

    expect(validateLinkLabel("")).toBeNull();
    expect(validateLinkLabel("a".repeat(100))).toBeNull();
    expect(validateLinkLabel("a".repeat(101))).not.toBeNull();
  });
});
