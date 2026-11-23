import type { CardSearchResult, CardStatus } from "./types";

export interface BoardCardGroup {
  board_id: string;
  board_name: string;
  cards: CardSearchResult[];
}

export interface CardEditableFields {
  title: string;
  description: string | null;
  due_date: string | null;
  labels: string[];
  assignee_id: string | null;
  status: CardStatus;
}

/**
 * Format an unread notification count for badge display.
 * Returns "" for 0 (or negative), decimal string for 1..99, and "99+" above 99.
 */
export function formatBadge(count: number): string {
  if (!Number.isFinite(count) || count <= 0) {
    return "";
  }
  const normalized = Math.floor(count);
  if (normalized > 99) {
    return "99+";
  }
  return String(normalized);
}

/** Group search/my-tasks cards by `board_id`, preserving first-seen board order. */
export function groupByBoard(cards: CardSearchResult[]): BoardCardGroup[] {
  const groups = new Map<string, BoardCardGroup>();
  for (const card of cards) {
    const existing = groups.get(card.board_id);
    if (existing) {
      existing.cards.push(card);
    } else {
      groups.set(card.board_id, {
        board_id: card.board_id,
        board_name: card.board_name,
        cards: [card],
      });
    }
  }
  return Array.from(groups.values());
}

function labelsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, index) => val === b[index]);
}

/** Return only the card fields whose values differ between `original` and `edited`. */
export function diffCardFields(
  original: CardEditableFields,
  edited: CardEditableFields
): Partial<CardEditableFields> {
  const diff: Partial<CardEditableFields> = {};
  if (edited.title !== original.title) {
    diff.title = edited.title;
  }
  if (edited.description !== original.description) {
    diff.description = edited.description;
  }
  if (edited.due_date !== original.due_date) {
    diff.due_date = edited.due_date;
  }
  if (!labelsEqual(edited.labels, original.labels)) {
    diff.labels = [...edited.labels];
  }
  if (edited.assignee_id !== original.assignee_id) {
    diff.assignee_id = edited.assignee_id;
  }
  if (edited.status !== original.status) {
    diff.status = edited.status;
  }
  return diff;
}
