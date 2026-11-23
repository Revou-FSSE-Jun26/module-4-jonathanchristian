"use client";

import { createContext, useContext, useMemo } from "react";
import { canEdit as roleCanEdit, isAdmin as roleIsAdmin } from "@/lib/roles";
import type { Role } from "@/lib/types";

export interface BoardRoleContextValue {
  role: Role;
  canEdit: boolean;
  isAdmin: boolean;
}

const BoardRoleContext = createContext<BoardRoleContextValue>({
  role: "member",
  canEdit: true,
  isAdmin: false,
});

export interface BoardRoleProviderProps {
  role: Role;
  children: React.ReactNode;
}

/** Provides the current user's board role and derived permissions to the board component tree. */
export function BoardRoleProvider({ role, children }: BoardRoleProviderProps) {
  const value = useMemo<BoardRoleContextValue>(
    () => ({
      role,
      canEdit: roleCanEdit(role),
      isAdmin: roleIsAdmin(role),
    }),
    [role]
  );

  return <BoardRoleContext.Provider value={value}>{children}</BoardRoleContext.Provider>;
}

/** Read the current board role and derived capabilities (`canEdit`, `isAdmin`). */
export function useBoardRole(): BoardRoleContextValue {
  return useContext(BoardRoleContext);
}
