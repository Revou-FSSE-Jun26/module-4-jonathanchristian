"use client";

import Link from "next/link";
import { OverdueItemRow } from "@/components/notifications/OverdueItemRow";
import { BaseButton } from "@/components/shared/BaseButton";
import type { AppNotification, OverdueItem } from "@/lib/types";

export interface NotificationListProps {
  items: AppNotification[];
  overdueItems?: OverdueItem[];
  onMarkRead: (id: string) => void;
  onClose?: () => void;
}

/** Dropdown list of overdue items and stored notifications ordered newest first. */
export function NotificationList({
  items,
  overdueItems = [],
  onMarkRead,
  onClose,
}: NotificationListProps) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const isEmpty = sorted.length === 0 && overdueItems.length === 0;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="bg-surface rounded-lg border border-line shadow-overlay p-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto"
    >
      <div className="px-2 py-1.5 border-b border-line mb-1">
        <h3 className="text-sm font-semibold text-ink">Notifications</h3>
      </div>

      {isEmpty ? (
        <p className="text-sm text-ink-muted px-2 py-4 text-center">
          No notifications yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {overdueItems.length > 0 ? (
            <section aria-label="Overdue">
              <p className="px-2 py-1 text-xs font-semibold text-ink-muted">Overdue</p>
              <ul className="flex flex-col gap-1">
                {overdueItems.map((item) => (
                  <OverdueItemRow
                    key={item.card_id}
                    item={item}
                    onSelect={onClose}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {sorted.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {sorted.map((item) => (
                <li
                  key={item.notification_id}
                  data-unread={item.is_read ? "false" : "true"}
                  className={`rounded-md p-2 border border-line text-sm transition-colors duration-150 ${
                    item.is_read ? "bg-surface text-ink-muted" : "bg-primary-50 text-ink"
                  }`}
                >
                  <Link
                    href={`/boards/${item.board_id}`}
                    onClick={() => {
                      if (!item.is_read) {
                        onMarkRead(item.notification_id);
                      }
                      onClose?.();
                    }}
                    className="block hover:underline"
                  >
                    <p className="font-medium text-ink">{item.message}</p>
                    <p className="text-xs text-ink-muted mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </Link>
                  {!item.is_read ? (
                    <div className="mt-1">
                      <BaseButton
                        variant="ghost"
                        onClick={() => onMarkRead(item.notification_id)}
                        className="px-2 py-1 text-xs"
                      >
                        Mark as read
                      </BaseButton>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
