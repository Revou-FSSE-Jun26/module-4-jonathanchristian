"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Users } from "lucide-react";
import { AddColumnForm } from "@/components/boards/AddColumnForm";
import { AnalyticsView } from "@/components/boards/AnalyticsView";
import { CardSearchInput } from "@/components/boards/CardSearchInput";
import { KanbanColumn } from "@/components/boards/KanbanColumn";
import { MemberPanel } from "@/components/boards/MemberPanel";
import { AddCardForm } from "@/components/cards/AddCardForm";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { BoardDetail, Card, CardSearchResult, Column, Member } from "@/lib/types";

export interface BoardViewProps {
  board: BoardDetail;
}

function sortColumns(cols: Column[]): Column[] {
  return [...cols]
    .sort((a, b) => a.order - b.order)
    .map((col) => ({
      ...col,
      cards: [...col.cards].sort((a, b) => a.order - b.order),
    }));
}

/** Interactive Kanban board workspace with search, drag-and-drop, members, analytics, and card details. */
export function BoardView({ board }: BoardViewProps) {
  const { handleError } = useErrorHandler();
  const [columns, setColumns] = useState<Column[]>(() => sortColumns(board.columns));
  const [members, setMembers] = useState<Member[]>([]);
  const [searchResults, setSearchResults] = useState<CardSearchResult[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const { onDragStart, onDragOver, onDrop, onTouchStart, pendingIds, touchDrag } =
    useDragAndDrop(columns, setColumns);

  useEffect(() => {
    let cancelled = false;
    apiRequest<Member[]>(`/api/boards/${board.board_id}/members`)
      .then((list) => {
        if (!cancelled) {
          setMembers(list);
        }
      })
      .catch(() => {
        // Non-blocking: assignee list falls back to empty if offline
      });
    return () => {
      cancelled = true;
    };
  }, [board.board_id]);

  const handleRenameColumn = useCallback(
    async (columnId: string, newName: string): Promise<boolean> => {
      try {
        const updated = await apiRequest<Column>(`/api/columns/${columnId}`, {
          method: "PATCH",
          body: { name: newName },
        });
        setColumns((prev) =>
          prev.map((col) =>
            col.column_id === columnId ? { ...col, name: updated.name } : col
          )
        );
        return true;
      } catch (err) {
        handleError(err);
        return false;
      }
    },
    [handleError]
  );

  const handleDeleteColumn = useCallback(
    async (columnId: string): Promise<void> => {
      try {
        await apiRequest<{ column_id: string }>(`/api/columns/${columnId}`, {
          method: "DELETE",
        });
        setColumns((prev) => prev.filter((col) => col.column_id !== columnId));
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleCardAdded = useCallback((columnId: string, card: Card) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.column_id === columnId
          ? { ...col, cards: [...col.cards, card].sort((a, b) => a.order - b.order) }
          : col
      )
    );
  }, []);

  const handleCardUpdated = useCallback((updated: Card) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.card_id === updated.card_id ? updated : c)),
      }))
    );
  }, []);

  const handleCardDeleted = useCallback((cardId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.card_id !== cardId),
      }))
    );
  }, []);

  const handleSearchResults = useCallback((results: CardSearchResult[]) => {
    setSearchResults(results);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchResults(null);
  }, []);

  const isAdmin = board.my_role === "admin";

  return (
    <div className="px-4 sm:px-6 py-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-2 rounded-md text-sm text-ink-muted hover:bg-sunken hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Boards</span>
          </Link>
          <h1 className="text-xl font-semibold text-ink break-words">{board.name}</h1>
          <BaseBadge variant={isAdmin ? "blue" : "gray"}>{board.my_role}</BaseBadge>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
          <CardSearchInput
            boardId={board.board_id}
            onResults={handleSearchResults}
            onClear={handleSearchClear}
          />
          {isAdmin ? (
            <>
              <BaseButton variant="secondary" onClick={() => setMembersOpen(true)}>
                <Users className="size-4" aria-hidden="true" />
                <span>Members</span>
              </BaseButton>
              <BaseButton variant="secondary" onClick={() => setAnalyticsOpen(true)}>
                <BarChart3 className="size-4" aria-hidden="true" />
                <span>Analytics</span>
              </BaseButton>
            </>
          ) : null}
        </div>
      </div>

      {searchResults !== null ? (
        searchResults.length === 0 ? (
          <div className="bg-surface border border-line rounded-lg p-8 text-center text-sm text-ink-muted">
            No matching cards found.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((card) => (
              <li
                key={card.card_id}
                className="bg-surface border border-line rounded-md p-4 flex flex-col gap-2"
              >
                <p className="text-xs text-ink-muted">{card.column_name}</p>
                <p className="text-sm font-medium text-ink">{card.title}</p>
                <BaseButton
                  variant="secondary"
                  onClick={() => setSelectedCard(card)}
                  className="self-start"
                >
                  Open card
                </BaseButton>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {columns.map((column) => (
            <KanbanColumn
              key={column.column_id}
              column={column}
              isDragTarget={touchDrag?.targetColumnId === column.column_id}
              touchDraggingCardId={touchDrag?.cardId ?? null}
              pendingIds={pendingIds}
              onSelectCard={(card) => setSelectedCard(card)}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onTouchStart={onTouchStart}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              footer={
                <AddCardForm
                  columnId={column.column_id}
                  onAdded={(card) => handleCardAdded(column.column_id, card)}
                />
              }
            />
          ))}
          <AddColumnForm
            boardId={board.board_id}
            onAdded={(col) => setColumns((prev) => sortColumns([...prev, col]))}
          />
        </div>
      )}

      {selectedCard ? (
        <CardDetailModal
          key={selectedCard.card_id}
          card={selectedCard}
          members={members}
          onClose={() => setSelectedCard(null)}
          onUpdated={handleCardUpdated}
          onDeleted={handleCardDeleted}
        />
      ) : null}

      {isAdmin ? (
        <>
          <MemberPanel
            open={membersOpen}
            onClose={() => setMembersOpen(false)}
            boardId={board.board_id}
            members={members}
            onMembersChange={setMembers}
          />
          <AnalyticsView
            open={analyticsOpen}
            onClose={() => setAnalyticsOpen(false)}
            boardId={board.board_id}
          />
        </>
      ) : null}
    </div>
  );
}
