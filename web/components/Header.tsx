"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { isVisitorAuthenticated, logoTarget } from "@/lib/logoTarget";
import { NotificationBell } from "@/components/NotificationBell";
import { KanoMark } from "@/components/shared/KanoMark";
import { UserMenu } from "@/components/users/UserMenu";

/** Global top navigation bar adapting between authenticated and anonymous visitors. */
export function Header() {
  const { status } = useAuth();
  const isAuth = isVisitorAuthenticated(status);

  return (
    <header className="bg-surface border-b border-line px-4 py-2 min-w-0">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 min-h-[44px]">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Link
            href={logoTarget(isAuth)}
            className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] px-1 rounded-md text-base font-semibold text-ink hover:text-primary-600 transition-colors duration-150"
          >
            <KanoMark />
            <span>Kano</span>
          </Link>
          {isAuth ? (
            <Link
              href="/my-tasks"
              className="inline-flex items-center min-h-[44px] min-w-[44px] px-3 rounded-md text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink transition-colors duration-150"
            >
              My Tasks
            </Link>
          ) : null}
        </div>

        <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-2 min-w-0">
          {isAuth ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-md text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink transition-colors duration-150"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 rounded-md text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-150"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
