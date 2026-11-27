"use client";

import { useEffect, useState } from "react";
import { LinkForm } from "@/components/cards/LinkForm";
import { LinkRow } from "@/components/cards/LinkRow";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { CardLink } from "@/lib/types";

export interface LinksSectionProps {
  cardId: string;
  initialLinks: CardLink[];
  loading: boolean;
  readOnly: boolean;
  onCountChange: (count: number) => void;
}

const MAX_LINKS = 10;

/** Card detail workspace links section with list, add form, edit, and delete. */
export function LinksSection({
  cardId,
  initialLinks,
  loading,
  readOnly,
  onCountChange,
}: LinksSectionProps) {
  const { handleError } = useErrorHandler();
  const [links, setLinks] = useState<CardLink[]>(initialLinks);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const atLimit = links.length >= MAX_LINKS;

  const handleAdd = async (url: string, label?: string): Promise<boolean> => {
    try {
      const created = await apiRequest<CardLink>(`/api/cards/${cardId}/links`, {
        method: "POST",
        body: label ? { url, label } : { url },
      });
      const next = [...links, created];
      setLinks(next);
      onCountChange(next.length);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  const handleEdit = async (
    link: CardLink,
    url: string,
    label?: string
  ): Promise<boolean> => {
    try {
      const updated = await apiRequest<CardLink>(`/api/links/${link.card_link_id}`, {
        method: "PATCH",
        body: label ? { url, label } : { url },
      });
      setLinks((prev) =>
        prev.map((entry) =>
          entry.card_link_id === link.card_link_id ? updated : entry
        )
      );
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  const handleDelete = async (link: CardLink): Promise<boolean> => {
    try {
      await apiRequest<{ card_link_id: string }>(`/api/links/${link.card_link_id}`, {
        method: "DELETE",
      });
      const next = links.filter((entry) => entry.card_link_id !== link.card_link_id);
      setLinks(next);
      onCountChange(next.length);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  return (
    <section aria-label="Workspace links" className="border-t border-line pt-4 mt-6">
      <h3 className="text-base font-semibold text-ink mb-3">Workspace links</h3>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading workspace links...</p>
      ) : (
        <>
          {links.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <LinkRow
                  key={link.card_link_id}
                  link={link}
                  readOnly={readOnly}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          ) : null}

          {!readOnly ? (
            <LinkForm
              disabled={atLimit}
              limitMessage={atLimit ? "Limit of 10 links reached" : null}
              onSubmit={handleAdd}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
