import type { CardStatus } from "./types";

/** Return today's UTC date as an ISO YYYY-MM-DD string. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Return true iff `due` is before `today` (UTC) and `status` is not `DONE`. */
export function isOverdue(
  due: string | null,
  status: CardStatus,
  today: string = todayUtc()
): boolean {
  return due !== null && due < today && status !== "DONE";
}

/** Format an integer number of overdue days as human-readable text. */
export function formatOverdue(days: number): string {
  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}
