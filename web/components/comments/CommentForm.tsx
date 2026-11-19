"use client";

import { useState } from "react";
import { BaseButton } from "@/components/shared/BaseButton";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { Comment } from "@/lib/types";
import { validateCommentText } from "@/lib/validation";

export interface CommentFormProps {
  cardId: string;
  onAdded: (comment: Comment) => void;
}

/** Form for adding a comment to a card. */
export function CommentForm({ cardId, onAdded }: CommentFormProps) {
  const { handleError } = useErrorHandler();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateCommentText(content);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const created = await apiRequest<Comment>(`/api/cards/${cardId}/comments`, {
        method: "POST",
        body: { content: content.trim() },
      });
      onAdded(created);
      setContent("");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      noValidate
      className="flex flex-col gap-2 mt-4"
    >
      <label htmlFor="new-comment-input" className="text-sm font-medium text-ink">
        Add a comment
      </label>
      <textarea
        id="new-comment-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={3}
        aria-invalid={error ? "true" : undefined}
        className="w-full min-h-[80px] rounded-md border border-field bg-surface p-3 text-sm text-ink placeholder:text-ink-subtle"
      />
      {error ? (
        <p role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <BaseButton type="submit" disabled={busy}>
          {busy ? "Posting..." : "Post comment"}
        </BaseButton>
      </div>
    </form>
  );
}
