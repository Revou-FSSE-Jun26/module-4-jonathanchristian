const NEXT_RE = /^\/invite\/[A-Za-z0-9_-]{1,128}$/;

/**
 * Validate a decoded `next` query parameter.
 * Accepts only relative `/invite/<token>` paths (1 to 128 URL-safe chars).
 */
export function safeNext(raw: unknown): string | null {
  return typeof raw === "string" && NEXT_RE.test(raw) ? raw : null;
}

/** Build `/login` or `/register` URL preserving a validated `next` target when present. */
export function withNext(href: "/login" | "/register", next: string | null): string {
  return next ? `${href}?next=${encodeURIComponent(next)}` : href;
}
