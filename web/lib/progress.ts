/** Compute rounded integer percentage (0 to 100) for checklist progress; 0 when total <= 0. */
export function progressPercent(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((done / total) * 100);
}
