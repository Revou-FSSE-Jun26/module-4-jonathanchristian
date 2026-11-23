"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BaseBadge } from "@/components/shared/BaseBadge";
import { BaseButton } from "@/components/shared/BaseButton";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { acceptOutcome } from "@/lib/inviteRoles";
import { ROLE_VARIANT } from "@/lib/roles";
import { showSuccess } from "@/lib/toast";
import type { AcceptResult, InviteInfo } from "@/lib/types";

export interface InviteJoinCardProps {
  token: string;
  info: InviteInfo | null;
  notFound?: boolean;
}

/** Invitation landing card showing board name, role, and join/open-board action. */
export function InviteJoinCard({
  token,
  info,
  notFound: initialNotFound = false,
}: InviteJoinCardProps) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(initialNotFound || !info);

  if (notFound || !info) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12 min-w-0">
        <div className="bg-surface border border-line rounded-lg p-6 flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-ink">Invitation not found</h1>
          <p className="text-sm text-ink-muted">
            This invitation link is invalid, expired, or has been replaced.
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center min-h-[44px] text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const outcome = acceptOutcome(info.current_role, info.role);
  const roleDescription = info.role === "member" ? "Member: can edit" : "Guest: view only";

  const handleJoin = async () => {
    setBusy(true);
    try {
      const result = await apiRequest<AcceptResult>(`/api/invites/${token}/accept`, {
        method: "POST",
      });
      showSuccess(`Joined ${info.board_name}.`);
      router.push(`/boards/${result.board_id}`);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setNotFound(true);
      } else {
        handleError(err);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12 min-w-0">
      <div className="bg-surface border border-line rounded-lg p-6 flex flex-col gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-muted">Board invitation</p>
          <h1 className="text-xl font-semibold text-ink break-words mt-1">{info.board_name}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BaseBadge variant={ROLE_VARIANT[info.role]}>{roleDescription}</BaseBadge>
        </div>

        {outcome.action === "none" && info.current_role !== null ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-muted">
              You are already on this board as{" "}
              <span className="font-medium text-ink">{info.current_role}</span>.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/boards/${info.board_id}`}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600"
              >
                Open board
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <BaseButton
              disabled={busy}
              onClick={() => {
                void handleJoin();
              }}
            >
              {busy ? "Joining..." : "Join"}
            </BaseButton>
          </div>
        )}
      </div>
    </div>
  );
}
