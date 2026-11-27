"use client";

import { AddChecklistForm } from "@/components/cards/AddChecklistForm";
import { ChecklistItemRow } from "@/components/cards/ChecklistItemRow";
import { useChecklist } from "@/hooks/useChecklist";
import { cn } from "@/lib/cn";
import { progressPercent } from "@/lib/progress";
import type { ChecklistItem } from "@/lib/types";

export interface ChecklistSectionProps {
  cardId: string;
  initialItems: ChecklistItem[];
  loading: boolean;
  readOnly: boolean;
  onCountsChange: (done: number, total: number) => void;
}

/** Card detail checklist section with progress bar, item rows, and inline add form. */
export function ChecklistSection({
  cardId,
  initialItems,
  loading,
  readOnly,
  onCountsChange,
}: ChecklistSectionProps) {
  const { items, toggleItem, addItem, editItem, deleteItem } = useChecklist({
    cardId,
    initialItems,
    onCountsChange,
  });

  const doneCount = items.filter((item) => item.is_done).length;
  const totalCount = items.length;
  const pct = progressPercent(doneCount, totalCount);

  return (
    <section aria-label="Checklist" className="border-t border-line pt-4 mt-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-semibold text-ink">Checklist</h3>
        {totalCount > 0 ? (
          <span className="text-xs text-ink-muted">{`${doneCount}/${totalCount}`}</span>
        ) : null}
      </div>

      {totalCount > 0 ? (
        <div className="h-2 rounded-full bg-sunken overflow-hidden mb-3">
          <div
            className={cn(
              "h-2 rounded-full",
              pct === 100 ? "bg-success" : "bg-primary-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading checklist...</p>
      ) : (
        <>
          {items.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <ChecklistItemRow
                  key={item.checklist_item_id}
                  item={item}
                  readOnly={readOnly}
                  onToggle={(entry) => {
                    void toggleItem(entry);
                  }}
                  onEdit={editItem}
                  onDelete={deleteItem}
                />
              ))}
            </ul>
          ) : null}

          {!readOnly ? (
            <AddChecklistForm itemCount={items.length} onAdd={addItem} />
          ) : null}
        </>
      )}
    </section>
  );
}
