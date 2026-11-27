"use client";

import { createContext, useContext, useMemo } from "react";
import { can as roleCan, type Action } from "@/lib/roles";
import type { Role } from "@/lib/types";

export interface BoardRoleContextValue {
  role: Role;
  can: (action: Action) => boolean;
}

const BoardRoleContext = createContext<BoardRoleContextValue>({
  role: "member",
  can: (action) => roleCan("member", action),
});

export interface BoardRoleProviderProps {
  role: Role;
  children: React.ReactNode;
}

/** Provides the current user's board role and `can(action)` helper to the board component tree. */
export function BoardRoleProvider({ role, children }: BoardRoleProviderProps) {
  const value = useMemo<BoardRoleContextValue>(
    () => ({
      role,
      can: (action: Action) => roleCan(role, action),
    }),
    [role]
  );

  return <BoardRoleContext.Provider value={value}>{children}</BoardRoleContext.Provider>;
}

/** Read the current board role and `can(action)` capability helper. */
export function useBoardRole(): BoardRoleContextValue {
  return useContext(BoardRoleContext);
}
