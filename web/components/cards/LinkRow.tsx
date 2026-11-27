"use client";

import { useState } from "react";
import {
  Cloud,
  ExternalLink,
  FileText,
  Folder,
  HardDrive,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import { LinkForm } from "@/components/cards/LinkForm";
import { BaseButton } from "@/components/shared/BaseButton";
import { providerKey, type LinkProviderKey } from "@/lib/linkProvider";
import type { CardLink } from "@/lib/types";

export interface LinkRowProps {
  link: CardLink;
  readOnly: boolean;
  onEdit: (link: CardLink, url: string, label?: string) => Promise<boolean>;
  onDelete: (link: CardLink) => Promise<boolean>;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function ProviderIcon({ provider }: { provider: LinkProviderKey }) {
  const cls = "size-4 text-ink-muted shrink-0";
  switch (provider) {
    case "gdrive":
      return <HardDrive className={cls} aria-hidden="true" />;
    case "onedrive":
      return <Cloud className={cls} aria-hidden="true" />;
    case "dropbox":
      return <Folder className={cls} aria-hidden="true" />;
    case "notion":
      return <FileText className={cls} aria-hidden="true" />;
    default:
      return <Link2 className={cls} aria-hidden="true" />;
  }
}

/** Single workspace link row showing provider icon, label link, hostname, and edit/delete actions. */
export function LinkRow({ link, readOnly, onEdit, onDelete }: LinkRowProps) {
  const [editing, setEditing] = useState(false);
  const hostname = getHostname(link.url);
  const provider = providerKey(hostname);

  if (editing && !readOnly) {
    return (
      <li className="rounded-md border border-line p-2">
        <LinkForm
          initialUrl={link.url}
          initialLabel={link.label}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (url, label) => {
            const ok = await onEdit(link, url, label);
            if (ok) {
              setEditing(false);
            }
            return ok;
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 min-h-[44px] min-w-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <ProviderIcon provider={provider} />
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline break-all"
        >
          {link.label}
        </a>
        {hostname ? (
          <span className="text-xs text-ink-muted break-all">{hostname}</span>
        ) : null}
        <ExternalLink className="size-3.5 text-ink-muted shrink-0" aria-hidden="true" />
      </div>

      {!readOnly ? (
        <div className="flex items-center gap-1 shrink-0">
          <BaseButton
            variant="ghost"
            aria-label={`Edit ${link.label}`}
            onClick={() => setEditing(true)}
            className="px-2"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </BaseButton>
          <BaseButton
            variant="ghost"
            aria-label={`Delete ${link.label}`}
            onClick={() => {
              void onDelete(link);
            }}
            className="px-2"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </BaseButton>
        </div>
      ) : null}
    </li>
  );
}
