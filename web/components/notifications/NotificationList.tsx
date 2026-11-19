"use client";

import Link from "next/link";
import { BaseButton } from "@/components/shared/BaseButton";
import type { AppNotification } from "@/lib/types";

export interface NotificationListProps {
  items: AppNotification[];
  onMarkRead: (id: string) => void;
  onClose?: () => void;
}

/** Dropdown list of notifications ordered newest first with unread styling. */
export function NotificationList({ items, onMarkRead, onClose }: NotificationListProps) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="bg-surface rounded-lg border border-line shadow-overlay p-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto"
    >
      <div className="px-2 py-1.5 border-b border-line mb-1">
        <h3 className="text-sm font-semibold text-ink">Notifications</h3>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-ink-muted px-2 py-4 text-center">
          No notifications yet.
        </p>
      ) : (
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
      )}
    </div>
  );
}
