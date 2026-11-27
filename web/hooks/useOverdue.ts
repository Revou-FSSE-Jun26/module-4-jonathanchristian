"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import type { OverdueItem, OverdueResult } from "@/lib/types";

export interface UseOverdueResult {
  items: OverdueItem[];
  total: number;
  refresh: () => Promise<void>;
}

/**
 * Load compute-on-read overdue items once when authenticated and on explicit refresh
 * (when the notification list opens). Never polls on a timer and keeps previous items on error.
 */
export function useOverdue(): UseOverdueResult {
  const { status } = useAuth();
  const [items, setItems] = useState<OverdueItem[]>([]);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") {
      return;
    }
    try {
      const res = await apiRequest<OverdueResult>("/api/notifications/overdue");
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      // Keep previous overdue items silently without showing an error toast
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setItems([]);
      setTotal(0);
      return;
    }
    void refresh();
  }, [status, refresh]);

  return { items, total, refresh };
}
