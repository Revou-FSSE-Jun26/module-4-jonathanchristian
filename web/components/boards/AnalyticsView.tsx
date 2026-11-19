"use client";

import { useEffect, useState } from "react";
import { BaseModal } from "@/components/shared/BaseModal";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { Analytics } from "@/lib/types";

export interface AnalyticsViewProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
}

/** Admin-only board analytics modal displaying column counts, weekly completions, and member activity. */
export function AnalyticsView({ open, onClose, boardId }: AnalyticsViewProps) {
  const { handleError } = useErrorHandler();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiRequest<Analytics>(`/api/boards/${boardId}/analytics`)
      .then((res) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Could not load analytics.");
          handleError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [boardId, handleError, open]);

  return (
    <BaseModal open={open} onClose={onClose} title="Board analytics" className="max-w-2xl">
      {loading ? (
        <p className="text-sm text-ink-muted py-4">Loading analytics...</p>
      ) : error ? (
        <div role="alert" className="rounded-md bg-danger-soft text-danger-ink p-3 text-sm">
          {error}
        </div>
      ) : data ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-line bg-sunken p-4">
            <p className="text-xs font-medium text-ink-muted">Completed this week</p>
            <p className="text-2xl font-semibold text-ink mt-1">{data.completed_this_week}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Cards per column</h3>
            <ul className="flex flex-col gap-2">
              {data.cards_per_column.map((col) => (
                <li
                  key={col.column_id}
                  className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm"
                >
                  <span className="text-ink">{col.name}</span>
                  <span className="font-semibold text-ink">{col.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Member activity</h3>
            <ul className="flex flex-col gap-2">
              {data.member_activity.map((member) => (
                <li
                  key={member.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-sm"
                >
                  <span className="font-medium text-ink">{member.name}</span>
                  <span className="text-xs text-ink-muted">
                    {member.assigned_cards} assigned · {member.comments} comments
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </BaseModal>
  );
}
