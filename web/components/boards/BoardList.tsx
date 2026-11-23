"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Plus } from "lucide-react";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { ErrorPanel } from "@/components/shared/ErrorPanel";
import { CreateBoardModal } from "@/components/boards/CreateBoardModal";
import { ROLE_VARIANT } from "@/lib/roles";
import type { BoardSummary } from "@/lib/types";

export interface BoardListProps {
  initialBoards: BoardSummary[];
  initialError?: string | null;
}

/** Dashboard board list with role badges, empty state, error retry, and create modal. */
export function BoardList({ initialBoards, initialError = null }: BoardListProps) {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardSummary[]>(initialBoards);
  const [createOpen, setCreateOpen] = useState(false);

  if (initialError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-ink mb-4">Your boards</h1>
        <ErrorPanel message={initialError} onRetry={() => router.refresh()} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold text-ink">Your boards</h1>
        <BaseButton onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          <span>Create board</span>
        </BaseButton>
      </div>

      {boards.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg p-12 text-center flex flex-col items-center gap-3">
          <LayoutGrid className="size-12 text-ink-subtle" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">No boards yet</h2>
          <p className="text-sm text-ink-muted">
            Create your first board to start organizing tasks.
          </p>
          <BaseButton onClick={() => setCreateOpen(true)}>Create board</BaseButton>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <li key={board.board_id} className="min-w-0">
              <Link
                href={`/boards/${board.board_id}`}
                className="block bg-surface border border-line rounded-md p-4 hover:border-line-strong transition-colors duration-150 min-h-[44px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-base font-semibold text-ink break-words min-w-0">
                    {board.name}
                  </span>
                  <BaseBadge variant={ROLE_VARIANT[board.my_role]}>
                    {board.my_role}
                  </BaseBadge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateBoardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newBoard) => setBoards((prev) => [newBoard, ...prev])}
      />
    </div>
  );
}
