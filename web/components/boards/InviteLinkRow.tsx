"use client";

import { Copy, RefreshCw } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { showError, showSuccess } from "@/lib/toast";
import type { InviteLink } from "@/lib/types";

export interface InviteLinkRowProps {
  link: InviteLink;
  busy?: boolean;
  onRequestRegenerate: (role: "member" | "guest") => void;
}

/** Single invitation link row with selectable URL, copy button, and regenerate button. */
export function InviteLinkRow({
  link,
  busy = false,
  onRequestRegenerate,
}: InviteLinkRowProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${origin}/invite/${link.token}`;
  const label =
    link.role === "member" ? "Member link: can edit" : "Guest link: view only";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      showSuccess("Invite link copied.");
    } catch {
      showError("Could not copy link. Select and copy it manually.");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-line p-3 min-w-0">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-col md:flex-row md:items-center gap-2 min-w-0">
        <input
          type="text"
          readOnly
          aria-label={label}
          value={fullUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 min-h-[44px] rounded-md border border-field bg-surface px-3 text-xs text-ink select-all break-all"
        />
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <BaseButton
            variant="secondary"
            disabled={busy}
            aria-label={`Copy ${link.role} link`}
            onClick={() => {
              void handleCopy();
            }}
          >
            <Copy className="size-4" aria-hidden="true" />
            <span>Copy</span>
          </BaseButton>
          <BaseButton
            variant="secondary"
            disabled={busy}
            aria-label={`Regenerate ${link.role} link`}
            onClick={() => onRequestRegenerate(link.role)}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Regenerate</span>
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
