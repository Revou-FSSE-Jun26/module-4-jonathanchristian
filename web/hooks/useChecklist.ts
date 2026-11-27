"use client";

import { useCallback, useEffect, useState } from "react";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { ChecklistItem } from "@/lib/types";

export interface UseChecklistOptions {
  cardId: string;
  initialItems: ChecklistItem[];
  onCountsChange: (done: number, total: number) => void;
}

function countDone(items: ChecklistItem[]): number {
  return items.filter((item) => item.is_done).length;
}

/** Manage card checklist items with optimistic toggle and count synchronization. */
export function useChecklist({
  cardId,
  initialItems,
  onCountsChange,
}: UseChecklistOptions) {
  const { handleError } = useErrorHandler();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const toggleItem = useCallback(
    async (item: ChecklistItem) => {
      const nextDone = !item.is_done;
      const previous = items;
      const optimistic = items.map((entry) =>
        entry.checklist_item_id === item.checklist_item_id
          ? { ...entry, is_done: nextDone }
          : entry
      );
      setItems(optimistic);

      try {
        const updated = await apiRequest<ChecklistItem>(
          `/api/checklist/${item.checklist_item_id}`,
          { method: "PATCH", body: { is_done: nextDone } }
        );
        const synced = optimistic.map((entry) =>
          entry.checklist_item_id === item.checklist_item_id ? updated : entry
        );
        setItems(synced);
        onCountsChange(countDone(synced), synced.length);
      } catch (err) {
        setItems(previous);
        handleError(err);
      }
    },
    [items, handleError, onCountsChange]
  );

  const addItem = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        const created = await apiRequest<ChecklistItem>(
          `/api/cards/${cardId}/checklist`,
          { method: "POST", body: { text } }
        );
        const next = [...items, created];
        setItems(next);
        onCountsChange(countDone(next), next.length);
        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    },
    [cardId, items, handleError, onCountsChange]
  );

  const editItem = useCallback(
    async (item: ChecklistItem, text: string): Promise<boolean> => {
      try {
        const updated = await apiRequest<ChecklistItem>(
          `/api/checklist/${item.checklist_item_id}`,
          { method: "PATCH", body: { text } }
        );
        setItems((prev) =>
          prev.map((entry) =>
            entry.checklist_item_id === item.checklist_item_id ? updated : entry
          )
        );
        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    },
    [handleError]
  );

  const deleteItem = useCallback(
    async (item: ChecklistItem): Promise<boolean> => {
      try {
        await apiRequest<{ checklist_item_id: string }>(
          `/api/checklist/${item.checklist_item_id}`,
          { method: "DELETE" }
        );
        const next = items.filter(
          (entry) => entry.checklist_item_id !== item.checklist_item_id
        );
        setItems(next);
        onCountsChange(countDone(next), next.length);
        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    },
    [items, handleError, onCountsChange]
  );

  return { items, toggleItem, addItem, editItem, deleteItem };
}
