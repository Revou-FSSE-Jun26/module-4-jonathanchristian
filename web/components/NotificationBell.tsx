"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useNotifications } from "@/hooks/useNotifications";
import { formatBadge } from "@/lib/format";

/** Bell button with unread badge and toggleable notification list. */
export function NotificationBell() {
  const { items, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const badge = formatBadge(unreadCount);

  return (
    <div className="relative">
      <BaseButton
        variant="ghost"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative px-2"
      >
        <Bell className="size-5" aria-hidden="true" />
        {badge ? (
          <span
            data-testid="notification-badge"
            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-danger text-white text-xs font-medium"
          >
            {badge}
          </span>
        ) : null}
      </BaseButton>

      {open ? (
        <div className="absolute right-0 mt-2 z-40">
          <NotificationList
            items={items}
            onMarkRead={(id) => {
              void markRead(id);
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
