"use client";

import { useSyncExternalStore } from "react";
import {
  BOARD_PATCHES_KEY,
  EMPTY_PATCHES,
  parsePatches,
  withDelete,
  withRename,
  type BoardPatches,
} from "@/lib/boardPatches";

const BOARD_PATCHES_EVENT = "kano:board-patches";

let cachedRaw: string | null = null;
let cachedPatches: BoardPatches = EMPTY_PATCHES;

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(BOARD_PATCHES_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): BoardPatches {
  const raw = readRaw();
  if (raw === cachedRaw) {
    return cachedPatches;
  }
  cachedRaw = raw;
  cachedPatches = parsePatches(raw);
  return cachedPatches;
}

function getServerSnapshot(): BoardPatches {
  return EMPTY_PATCHES;
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(BOARD_PATCHES_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(BOARD_PATCHES_EVENT, onStoreChange);
  };
}

function writePatches(update: (current: BoardPatches) => BoardPatches): void {
  try {
    const current = parsePatches(window.sessionStorage.getItem(BOARD_PATCHES_KEY));
    const next = update(current);
    const serialized = JSON.stringify(next);
    window.sessionStorage.setItem(BOARD_PATCHES_KEY, serialized);
    cachedRaw = serialized;
    cachedPatches = next;
    window.dispatchEvent(new Event(BOARD_PATCHES_EVENT));
  } catch {
    // Ignore sessionStorage unavailability or quota errors.
  }
}

/** Subscribe to per-tab board rename/delete patches stored in sessionStorage. */
export function useBoardPatches(): BoardPatches {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Record a successful board rename so cached Dashboard entries stay current. */
export function recordRename(id: string, name: string, updatedAt: string): void {
  writePatches((current) => withRename(current, id, name, updatedAt));
}

/** Record a successful board deletion so cached Dashboard entries omit it. */
export function recordDelete(id: string): void {
  writePatches((current) => withDelete(current, id));
}
