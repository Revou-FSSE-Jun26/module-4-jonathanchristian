"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckSquare } from "lucide-react";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { ErrorPanel } from "@/components/shared/ErrorPanel";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { groupByBoard } from "@/lib/format";
import { showError } from "@/lib/toast";
import type { CardSearchResult } from "@/lib/types";

export interface MyTasksListProps {
  initialCards: CardSearchResult[];
  initialError?: string | null;
}

/** Displays assigned cards grouped by board with due dates, columns, and board links. */
export function MyTasksList({ initialCards, initialError = null }: MyTasksListProps) {
  const router = useRouter();

  useEffect(() => {
    if (initialError) {
      showError(initialError);
    }
  }, [initialError]);

  if (initialError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-ink mb-4">My Tasks</h1>
        <ErrorPanel message={initialError} onRetry={() => router.refresh()} />
      </div>
    );
  }

  const groups = groupByBoard(initialCards);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-w-0">
      <h1 className="text-xl font-semibold text-ink mb-6">My Tasks</h1>

      {groups.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg p-12 text-center flex flex-col items-center gap-3">
          <CheckSquare className="size-12 text-ink-subtle" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">No tasks assigned</h2>
          <p className="text-sm text-ink-muted">
            Cards assigned to you across your boards will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section
              key={group.board_id}
              aria-label={group.board_name}
              className="bg-surface border border-line rounded-lg p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line mb-3">
                <h2 className="text-base font-semibold text-ink">{group.board_name}</h2>
                <Link
                  href={`/boards/${group.board_id}`}
                  className="inline-flex items-center min-h-[44px] px-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Open board
                </Link>
              </div>

              <ul className="flex flex-col gap-2">
                {group.cards.map((card) => (
                  <li
                    key={card.card_id}
                    className="rounded-md border border-line p-3 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/boards/${card.board_id}?card=${encodeURIComponent(card.card_id)}`}
                        className="text-sm font-medium text-ink hover:text-primary-600 hover:underline break-words"
                      >
                        {card.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink-muted">
                        <BaseBadge variant="gray">{card.column_name}</BaseBadge>
                        <StatusBadge status={card.status} />
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" aria-hidden="true" />
                          <span>
                            {card.due_date
                              ? new Date(`${card.due_date}T00:00:00`).toLocaleDateString()
                              : "No due date"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
