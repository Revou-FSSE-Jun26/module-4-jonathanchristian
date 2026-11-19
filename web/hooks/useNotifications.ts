"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import type { AppNotification, NotificationPage } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000;

export interface UseNotificationsResult {
  items: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
}

/**
 * Poll notifications on mount and every 30 seconds while authenticated.
 * Keeps previous state silently on poll errors and cleans up timers on unmount/logout.
 */
export function useNotifications(): UseNotificationsResult {
  const { status } = useAuth();
  const { handleError } = useErrorHandler();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const page = await apiRequest<NotificationPage>(
          "/api/notifications?page=1&per_page=20"
        );
        if (cancelled) {
          return;
        }
        setItems(page.items);
        setUnreadCount(page.unread_count);
      } catch {
        // Keep previous state silently on poll error
      }
    };

    void fetchNotifications();
    const timer = setInterval(() => {
      void fetchNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [status]);

  const markRead = useCallback(
    async (id: string) => {
      try {
        const updated = await apiRequest<AppNotification>(
          `/api/notifications/${id}/read`,
          { method: "PATCH" }
        );
        let wasUnread = false;
        setItems((prev) =>
          prev.map((item) => {
            if (item.notification_id === id) {
              if (!item.is_read) {
                wasUnread = true;
              }
              return { ...item, ...updated, is_read: true };
            }
            return item;
          })
        );
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  return { items, unreadCount, markRead };
}
