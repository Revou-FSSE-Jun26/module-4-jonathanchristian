"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { CardSearchResult } from "@/lib/types";

export interface CardSearchInputProps {
  boardId: string;
  onResults: (results: CardSearchResult[]) => void;
  onClear: () => void;
}

/** Debounced board card search input with AbortController cancellation. */
export function CardSearchInput({ boardId, onResults, onClear }: CardSearchInputProps) {
  const { handleError } = useErrorHandler();
  const [text, setText] = useState("");
  const debounced = useDebouncedValue(text, 300);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (!trimmed) {
      onClear();
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    apiRequest<CardSearchResult[]>("/api/cards", {
      query: { q: trimmed, board_id: boardId },
      signal: controller.signal,
    })
      .then((results) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        onResults(results);
      })
      .catch((err) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        handleError(err);
      });

    return () => {
      controller.abort();
    };
  }, [boardId, debounced, handleError, onClear, onResults]);

  return (
    <div className="flex items-center gap-2 w-full sm:w-72 min-w-0">
      <div className="relative flex-1 min-w-0">
        <Search
          className="size-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Search cards"
          value={text}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (!next.trim()) {
              requestIdRef.current += 1;
              onClear();
            }
          }}
          placeholder="Search cards..."
          className="w-full min-h-[44px] rounded-md border border-field bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle"
        />
      </div>
      {text ? (
        <BaseButton
          variant="ghost"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            requestIdRef.current += 1;
            onClear();
          }}
          className="px-2"
        >
          <X className="size-4" aria-hidden="true" />
        </BaseButton>
      ) : null}
    </div>
  );
}
