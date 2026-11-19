"use client";

import Link from "next/link";
import { LogOut, User as UserIcon } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { useAuth } from "@/hooks/useAuth";

/** Authenticated user menu with profile link and logout action. */
export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] px-3 rounded-md text-sm font-medium text-ink hover:bg-sunken transition-colors duration-150"
      >
        <UserIcon className="size-4 text-ink-muted shrink-0" aria-hidden="true" />
        <span className="truncate max-w-[140px]">{user.name}</span>
      </Link>
      <BaseButton variant="ghost" onClick={logout} aria-label="Log out">
        <LogOut className="size-4" aria-hidden="true" />
        <span>Log out</span>
      </BaseButton>
    </div>
  );
}
