"use client";

import { useCallback, useEffect, useRef } from "react";
import { findCardById, stripCardParam } from "@/lib/deepLink";
import type { BoardCard, Column } from "@/lib/types";

/**
 * Open a card modal at most once on initial mount when `initialCardId` matches
 * a card in `columns`, and strip the `card` query parameter when that card closes.
 */
export function useCardDeepLink(
  initialCardId: string | null,
  columns: Column[],
  open: (card: BoardCard) => void
): { onModalClose: (closedId: string) => void } {
  const handled = useRef(false);
  const openedId = useRef<string | null>(null);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;
    const card = findCardById(columns, initialCardId);
    if (card) {
      openedId.current = card.card_id;
      open(card);
    }
  }, [initialCardId, columns, open]);

  const onModalClose = useCallback((closedId: string) => {
    if (openedId.current !== closedId) {
      return;
    }
    openedId.current = null;
    window.history.replaceState(
      window.history.state,
      "",
      stripCardParam(window.location.href)
    );
  }, []);

  return { onModalClose };
}
