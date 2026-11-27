"use client";

import { useCallback, useEffect, useState } from "react";
import { AddColumnForm } from "@/components/boards/AddColumnForm";
import { AnalyticsView } from "@/components/boards/AnalyticsView";
import { BoardRoleProvider } from "@/components/boards/BoardRoleContext";
import { BoardToolbar } from "@/components/boards/BoardToolbar";
import { KanbanColumn } from "@/components/boards/KanbanColumn";
import { MemberPanel } from "@/components/boards/MemberPanel";
import { AddCardForm } from "@/components/cards/AddCardForm";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { BaseButton } from "@/components/shared/BaseButton";
import { useCardDeepLink } from "@/hooks/useCardDeepLink";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { can } from "@/lib/roles";
import type { BoardCard, BoardDetail, Card, CardSearchResult, Column, Member } from "@/lib/types";

function toBoardCard(card: Card | BoardCard): BoardCard {
  return {
    checklist_done: 0,
    checklist_total: 0,
    link_count: 0,
    ...card,
  };
}

export interface BoardViewProps {
  board: BoardDetail;
  initialCardId?: string | null;
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
export function BoardView({ board, initialCardId = null }: BoardViewProps) {
  const { handleError } = useErrorHandler();
  const [columns, setColumns] = useState<Column[]>(() => sortColumns(board.columns));
  const [members, setMembers] = useState<Member[]>([]);
  const [searchResults, setSearchResults] = useState<CardSearchResult[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
  const [selectedCardIsNew, setSelectedCardIsNew] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const canEditCards = can(board.my_role, "edit_cards");
  const canManageColumns = can(board.my_role, "manage_columns");
  const canManageMembers = can(board.my_role, "manage_members");
  const canViewAnalytics = can(board.my_role, "view_analytics");

  const { onDragStart, onDragOver, onDrop, onTouchStart, pendingIds, touchDrag } =
    useDragAndDrop(columns, setColumns, { enabled: canEditCards });

  const openCard = useCallback((card: Card | BoardCard) => {
    setSelectedCard(toBoardCard(card));
    setSelectedCardIsNew(false);
  }, []);

  const { onModalClose } = useCardDeepLink(initialCardId, columns, openCard);

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

  const handleCardAdded = useCallback((columnId: string, card: Card | BoardCard) => {
    const boardCard = toBoardCard(card);
    setColumns((prev) =>
      prev.map((col) =>
        col.column_id === columnId
          ? { ...col, cards: [...col.cards, boardCard].sort((a, b) => a.order - b.order) }
          : col
      )
    );
    setSelectedCard(boardCard);
    setSelectedCardIsNew(true);
  }, []);

  const handleCardUpdated = useCallback((updated: Card | BoardCard) => {
    const boardCard = toBoardCard(updated);
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) => (c.card_id === boardCard.card_id ? boardCard : c)),
      }))
    );
  }, []);

  const handleCardCountsChanged = useCallback(
    (cardId: string, counts: { checklist_done: number; checklist_total: number; link_count: number }) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: col.cards.map((c) => (c.card_id === cardId ? { ...c, ...counts } : c)),
        }))
      );
      setSelectedCard((prev) =>
        prev && prev.card_id === cardId ? { ...prev, ...counts } : prev
      );
    },
    []
  );
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

  return (
    <BoardRoleProvider role={board.my_role}>
      <div className="px-4 sm:px-6 py-6 min-w-0">
        <BoardToolbar
          boardName={board.name}
          role={board.my_role}
          boardId={board.board_id}
          onSearchResults={handleSearchResults}
          onSearchClear={handleSearchClear}
          onOpenMembers={() => setMembersOpen(true)}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
        />
        <hr data-testid="board-separator" className="m-0 h-px w-full border-0 bg-line" />
        <div data-testid="board-content" className="pt-6 min-w-0">
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
                      onClick={() => openCard(card)}
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
                  onSelectCard={openCard}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onTouchStart={onTouchStart}
                  onRenameColumn={canManageColumns ? handleRenameColumn : undefined}
                  onDeleteColumn={canManageColumns ? handleDeleteColumn : undefined}
                  footer={
                    canEditCards ? (
                      <AddCardForm
                        columnId={column.column_id}
                        onAdded={(card) => handleCardAdded(column.column_id, card)}
                      />
                    ) : null
                  }
                />
              ))}
              {canManageColumns ? (
                <AddColumnForm
                  boardId={board.board_id}
                  onAdded={(col) => setColumns((prev) => sortColumns([...prev, col]))}
                />
              ) : null}
            </div>
          )}
        </div>

      {selectedCard ? (
        <CardDetailModal
          key={selectedCard.card_id}
          card={selectedCard}
          members={members}
          isNew={selectedCardIsNew}
          onClose={() => {
            const closedId = selectedCard.card_id;
            setSelectedCard(null);
            setSelectedCardIsNew(false);
            onModalClose(closedId);
          }}
          onUpdated={handleCardUpdated}
          onCountsChanged={handleCardCountsChanged}
          onDeleted={handleCardDeleted}
        />
      ) : null}

      {canManageMembers ? (
        <MemberPanel
          open={membersOpen}
          onClose={() => setMembersOpen(false)}
          boardId={board.board_id}
          members={members}
          onMembersChange={setMembers}
          onMemberDemotedToGuest={(userId) => {
            setColumns((prev) =>
              prev.map((col) => ({
                ...col,
                cards: col.cards.map((c) =>
                  c.assignee?.user_id === userId ? { ...c, assignee: null } : c
                ),
              }))
            );
          }}
        />
      ) : null}
      {canViewAnalytics ? (
        <AnalyticsView
          open={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          boardId={board.board_id}
        />
      ) : null}
      </div>
    </BoardRoleProvider>
  );
}
