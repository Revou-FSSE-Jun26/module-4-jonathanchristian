import type { BoardCard, Column } from "./types";

/**
 * Resolve the `card` query parameter from Next.js `searchParams`.
 * Uses the first value when repeated, and treats an empty string as absent.
 */
export function resolveCardParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value.length > 0 ? value : null;
}

/** Find a non-deleted card in the board's columns by `card_id`, or return `null`. */
export function findCardById(columns: Column[], id: string | null): BoardCard | null {
  if (!id) {
    return null;
  }
  for (const column of columns) {
    const found = column.cards.find((card) => card.card_id === id);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Remove the `card` query parameter from an absolute URL while preserving
 * the pathname, all other query parameters in order, and the hash.
 */
export function stripCardParam(href: string): string {
  const url = new URL(href);
  url.searchParams.delete("card");
  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}
