export const LABEL_KEYS = [
  "gray",
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "pink",
] as const;

export type LabelKey = (typeof LABEL_KEYS)[number];

/** Normalize label text by trimming, NFC-normalizing, and lowercasing. */
export function normalizeLabel(text: string): string {
  return text.trim().normalize("NFC").toLowerCase();
}

/**
 * Deterministically map label text to one of the 8 palette keys using
 * FNV-1a 32-bit hashing over the normalized text.
 */
export function labelColor(text: string): LabelKey {
  let h = 0x811c9dc5;
  for (const ch of normalizeLabel(text)) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return LABEL_KEYS[h % LABEL_KEYS.length];
}

export const LABEL_CLASS: Record<LabelKey, string> = {
  gray: "bg-label-gray-bg text-label-gray-fg",
  blue: "bg-label-blue-bg text-label-blue-fg",
  green: "bg-label-green-bg text-label-green-fg",
  yellow: "bg-label-yellow-bg text-label-yellow-fg",
  orange: "bg-label-orange-bg text-label-orange-fg",
  red: "bg-label-red-bg text-label-red-fg",
  purple: "bg-label-purple-bg text-label-purple-fg",
  pink: "bg-label-pink-bg text-label-pink-fg",
};
