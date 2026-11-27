export const FORBIDDEN_CLAIMS = [
  "10,000",
  "trusted by",
  "uptime",
  "99.9",
  "latency",
  "100ms",
  "4.9",
  "satisfaction",
  "rating",
  "free",
  "credit card",
  "60 seconds",
  "real-time",
  "real time",
  "websocket",
  "fuzzy",
  "threaded",
  "subtask",
  "KAN-",
] as const;

const FREE_WHOLE_WORD_RE = /(^|[^\p{L}\p{N}_])free($|[^\p{L}\p{N}_])/iu;

/**
 * Returns every forbidden claim from Requirement 38 criterion 19 found in `text`.
 * Uses case-insensitive substring matching for all entries except `"free"`,
 * which is matched as a whole word.
 */
export function findForbiddenClaims(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];

  for (const claim of FORBIDDEN_CLAIMS) {
    if (claim === "free") {
      if (FREE_WHOLE_WORD_RE.test(text)) {
        hits.push(claim);
      }
    } else if (lower.includes(claim.toLowerCase())) {
      hits.push(claim);
    }
  }

  return hits;
}
