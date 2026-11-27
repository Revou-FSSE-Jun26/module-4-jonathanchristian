import type { BoardSummary } from "./types";

export interface BoardRenamePatch {
  name: string;
  updated_at: string;
}

export interface BoardPatches {
  renamed: Record<string, BoardRenamePatch>;
  deleted: string[];
}

export const EMPTY_PATCHES: BoardPatches = { renamed: {}, deleted: [] };
export const BOARD_PATCHES_KEY = "kano_board_patches";

/** Parse stored JSON into `BoardPatches`, returning `EMPTY_PATCHES` on invalid input. */
export function parsePatches(raw: string | null): BoardPatches {
  if (!raw) {
    return EMPTY_PATCHES;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return EMPTY_PATCHES;
    }
    const record = parsed as Record<string, unknown>;
    const rawRenamed = record.renamed;
    const rawDeleted = record.deleted;
    if (
      !rawRenamed ||
      typeof rawRenamed !== "object" ||
      Array.isArray(rawRenamed) ||
      !Array.isArray(rawDeleted)
    ) {
      return EMPTY_PATCHES;
    }

    const renamed: Record<string, BoardRenamePatch> = {};
    for (const [id, entry] of Object.entries(rawRenamed as Record<string, unknown>)) {
      if (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof (entry as Record<string, unknown>).name === "string" &&
        typeof (entry as Record<string, unknown>).updated_at === "string"
      ) {
        renamed[id] = {
          name: (entry as Record<string, unknown>).name as string,
          updated_at: (entry as Record<string, unknown>).updated_at as string,
        };
      }
    }

    const deleted = rawDeleted.filter((item): item is string => typeof item === "string");
    return { renamed, deleted };
  } catch {
    return EMPTY_PATCHES;
  }
}

/** Return a new `BoardPatches` with a rename recorded for `id`. */
export function withRename(
  patches: BoardPatches,
  id: string,
  name: string,
  updatedAt: string
): BoardPatches {
  return {
    renamed: {
      ...patches.renamed,
      [id]: { name, updated_at: updatedAt },
    },
    deleted: patches.deleted.filter((deletedId) => deletedId !== id),
  };
}

/** Return a new `BoardPatches` with `id` marked deleted and any rename for `id` removed. */
export function withDelete(patches: BoardPatches, id: string): BoardPatches {
  const restRenamed = { ...patches.renamed };
  delete restRenamed[id];
  const deleted = patches.deleted.includes(id)
    ? patches.deleted
    : [...patches.deleted, id];
  return { renamed: restRenamed, deleted };
}

function isPatchNewer(boardUpdatedAt: string | undefined, patchUpdatedAt: string): boolean {
  if (!boardUpdatedAt) {
    return true;
  }
  const boardTime = Date.parse(boardUpdatedAt);
  const patchTime = Date.parse(patchUpdatedAt);
  if (Number.isNaN(boardTime)) {
    return !Number.isNaN(patchTime);
  }
  if (Number.isNaN(patchTime)) {
    return false;
  }
  return boardTime < patchTime;
}

/**
 * Merge session patches into a server-provided board list without changing
 * item order or client-side counts.
 */
export function applyBoardPatches(
  boards: BoardSummary[],
  patches: BoardPatches
): BoardSummary[] {
  const deletedSet = new Set(patches.deleted);
  const result: BoardSummary[] = [];

  for (const board of boards) {
    if (deletedSet.has(board.board_id)) {
      continue;
    }
    const rename = patches.renamed[board.board_id];
    if (
      rename &&
      isPatchNewer(board.updated_at, rename.updated_at) &&
      (board.name !== rename.name || board.updated_at !== rename.updated_at)
    ) {
      result.push({
        ...board,
        name: rename.name,
        updated_at: rename.updated_at,
      });
    } else {
      result.push(board);
    }
  }

  return result;
}
