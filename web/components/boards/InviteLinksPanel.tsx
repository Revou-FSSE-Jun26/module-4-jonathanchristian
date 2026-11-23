"use client";

import { useEffect, useState } from "react";
import { InviteLinkRow } from "@/components/boards/InviteLinkRow";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { showSuccess } from "@/lib/toast";
import type { InviteLink, InviteLinks } from "@/lib/types";

export interface InviteLinksPanelProps {
  boardId: string;
}

/** Admin-only panel for viewing, copying, and regenerating member and guest invite links. */
export function InviteLinksPanel({ boardId }: InviteLinksPanelProps) {
  const { handleError } = useErrorHandler();
  const [links, setLinks] = useState<InviteLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmRole, setConfirmRole] = useState<"member" | "guest" | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest<InviteLinks>(`/api/boards/${boardId}/invite-links`)
      .then((data) => {
        if (!cancelled) {
          setLinks(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          handleError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [boardId, handleError]);

  const handleRegenerate = async () => {
    if (!confirmRole) {
      return;
    }
    setBusy(true);
    try {
      const updated = await apiRequest<InviteLink>(
        `/api/boards/${boardId}/invite-links/${confirmRole}/regenerate`,
        { method: "POST" }
      );
      setLinks((prev) => (prev ? { ...prev, [confirmRole]: updated } : prev));
      showSuccess("Invite link regenerated.");
      setConfirmRole(null);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Invitation links" className="border-t border-line pt-4 mt-6">
      <h3 className="text-base font-semibold text-ink mb-3">Invitation links</h3>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading invite links...</p>
      ) : links ? (
        <div className="flex flex-col gap-3">
          <InviteLinkRow
            link={links.member}
            busy={busy}
            onRequestRegenerate={(role) => setConfirmRole(role)}
          />
          <InviteLinkRow
            link={links.guest}
            busy={busy}
            onRequestRegenerate={(role) => setConfirmRole(role)}
          />
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmRole !== null}
        title="Regenerate invite link"
        message={
          confirmRole
            ? `Regenerate the ${confirmRole} invite link? The old link stops working immediately.`
            : ""
        }
        confirmLabel="Regenerate"
        busy={busy}
        onCancel={() => setConfirmRole(null)}
        onConfirm={() => {
          void handleRegenerate();
        }}
      />
    </section>
  );
}
