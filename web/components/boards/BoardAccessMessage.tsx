import Link from "next/link";
import { ShieldAlert, SearchX } from "lucide-react";

export interface BoardAccessMessageProps {
  statusCode: 403 | 404;
}

/** Friendly access-denied (403) or not-found (404) panel with a link back to `/`. */
export function BoardAccessMessage({ statusCode }: BoardAccessMessageProps) {
  const isForbidden = statusCode === 403;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div
        role="alert"
        className="bg-surface border border-line rounded-lg p-8 text-center flex flex-col items-center gap-3"
      >
        {isForbidden ? (
          <ShieldAlert className="size-12 text-danger" aria-hidden="true" />
        ) : (
          <SearchX className="size-12 text-ink-subtle" aria-hidden="true" />
        )}
        <h1 className="text-lg font-semibold text-ink">
          {isForbidden ? "Access denied" : "Board not found"}
        </h1>
        <p className="text-sm text-ink-muted">
          {isForbidden
            ? "You are not a member of this board."
            : "This board does not exist or has been deleted."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-md text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-150 mt-2"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
