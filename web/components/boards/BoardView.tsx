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
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { canEdit, isAdmin as roleIsAdmin } from "@/lib/roles";
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
  const [selectedCardIsNew, setSelectedCardIsNew] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const userCanEdit = canEdit(board.my_role);
  const isAdmin = roleIsAdmin(board.my_role);

  const { onDragStart, onDragOver, onDrop, onTouchStart, pendingIds, touchDrag } =
    useDragAndDrop(columns, setColumns, { enabled: userCanEdit });

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
    setSelectedCard(card);
    setSelectedCardIsNew(true);
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
                      onClick={() => {
                        setSelectedCard(card);
                        setSelectedCardIsNew(false);
                      }}
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
                  onSelectCard={(card) => {
                    setSelectedCard(card);
                    setSelectedCardIsNew(false);
                  }}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onTouchStart={onTouchStart}
                  onRenameColumn={userCanEdit ? handleRenameColumn : undefined}
                  onDeleteColumn={userCanEdit ? handleDeleteColumn : undefined}
                  footer={
                    userCanEdit ? (
                      <AddCardForm
                        columnId={column.column_id}
                        onAdded={(card) => handleCardAdded(column.column_id, card)}
                      />
                    ) : null
                  }
                />
              ))}
              {userCanEdit ? (
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
            setSelectedCard(null);
            setSelectedCardIsNew(false);
          }}
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
    </BoardRoleProvider>
  );
}
