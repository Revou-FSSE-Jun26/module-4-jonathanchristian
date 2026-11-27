"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, Users } from "lucide-react";
import { CardSearchInput } from "@/components/boards/CardSearchInput";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { can, ROLE_VARIANT } from "@/lib/roles";
import type { CardSearchResult, Role } from "@/lib/types";

export interface BoardToolbarProps {
  boardName: string;
  role: Role;
  boardId: string;
  onSearchResults: (results: CardSearchResult[]) => void;
  onSearchClear: () => void;
  onOpenMembers: () => void;
  onOpenAnalytics: () => void;
}

/** Board page toolbar with back link, title, role badge, search, and role-gated actions. */
export function BoardToolbar({
  boardName,
  role,
  boardId,
  onSearchResults,
  onSearchClear,
  onOpenMembers,
  onOpenAnalytics,
}: BoardToolbarProps) {
  const showMembers = can(role, "manage_members");
  const showAnalytics = can(role, "view_analytics");
  const roleLabel = role === "guest" ? "Guest" : role;

  return (
    <div
      data-testid="board-toolbar"
      className="flex flex-wrap items-center justify-between gap-3 pb-4 min-w-0"
    >
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-2 rounded-md text-sm text-ink-muted hover:bg-sunken hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Boards</span>
        </Link>
        <h1 className="text-xl font-semibold text-ink break-words">{boardName}</h1>
        <BaseBadge variant={ROLE_VARIANT[role]}>{roleLabel}</BaseBadge>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
        <CardSearchInput
          boardId={boardId}
          onResults={onSearchResults}
          onClear={onSearchClear}
        />
        {showMembers ? (
          <BaseButton variant="secondary" onClick={onOpenMembers}>
            <Users className="size-4" aria-hidden="true" />
            <span>Members</span>
          </BaseButton>
        ) : null}
        {showAnalytics ? (
          <BaseButton variant="secondary" onClick={onOpenAnalytics}>
            <BarChart3 className="size-4" aria-hidden="true" />
            <span>Analytics</span>
          </BaseButton>
        ) : null}
      </div>
    </div>
  );
}
