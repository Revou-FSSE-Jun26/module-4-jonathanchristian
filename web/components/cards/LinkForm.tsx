"use client";

import { useState } from "react";
import { BaseButton } from "@/components/shared/BaseButton";
import { validateLinkLabel, validateLinkUrl } from "@/lib/validation";

export interface LinkFormProps {
  initialUrl?: string;
  initialLabel?: string;
  submitLabel?: string;
  disabled?: boolean;
  limitMessage?: string | null;
  onCancel?: () => void;
  onSubmit: (url: string, label?: string) => Promise<boolean>;
}

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle disabled:bg-sunken disabled:text-ink-subtle disabled:cursor-not-allowed";

/** Inline form for adding or editing a workspace link with client-side URL and label validation. */
export function LinkForm({
  initialUrl = "",
  initialLabel = "",
  submitLabel = "Add link",
  disabled = false,
  limitMessage = null,
  onCancel,
  onSubmit,
}: LinkFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [label, setLabel] = useState(initialLabel);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || busy) {
      return;
    }

    const uErr = validateLinkUrl(url);
    const lErr = validateLinkLabel(label);
    setUrlError(uErr);
    setLabelError(lErr);
    if (uErr || lErr) {
      return;
    }

    setBusy(true);
    const trimmedLabel = label.trim();
    const ok = await onSubmit(url.trim(), trimmedLabel.length > 0 ? trimmedLabel : undefined);
    setBusy(false);
    if (ok && !initialUrl) {
      setUrl("");
      setLabel("");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      noValidate
      className="flex flex-col gap-2 pt-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label htmlFor={`link-url-${initialUrl ? "edit" : "add"}`} className="sr-only">
            Link URL
          </label>
          <input
            id={`link-url-${initialUrl ? "edit" : "add"}`}
            type="url"
            value={url}
            disabled={disabled || busy}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/..."
            aria-invalid={urlError ? "true" : undefined}
            className={INPUT_CLASSES}
          />
          {urlError ? (
            <p role="alert" className="text-xs text-danger-ink mt-1">
              {urlError}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={`link-label-${initialUrl ? "edit" : "add"}`} className="sr-only">
            Link label (optional)
          </label>
          <input
            id={`link-label-${initialUrl ? "edit" : "add"}`}
            type="text"
            value={label}
            disabled={disabled || busy}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            aria-invalid={labelError ? "true" : undefined}
            className={INPUT_CLASSES}
          />
          {labelError ? (
            <p role="alert" className="text-xs text-danger-ink mt-1">
              {labelError}
            </p>
          ) : null}
        </div>
      </div>

      {limitMessage ? <p className="text-xs text-ink-muted">{limitMessage}</p> : null}

      <div className="flex flex-wrap gap-2">
        <BaseButton type="submit" disabled={disabled || busy}>
          {busy ? "Saving..." : submitLabel}
        </BaseButton>
        {onCancel ? (
          <BaseButton variant="secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </BaseButton>
        ) : null}
      </div>
    </form>
  );
}
