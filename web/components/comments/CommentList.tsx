"use client";

import { useCallback, useEffect, useState } from "react";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentItem } from "@/components/comments/CommentItem";
import { ErrorPanel } from "@/components/shared/ErrorPanel";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import type { Comment } from "@/lib/types";

export interface CommentListProps {
  cardId: string;
}

/** Loads and manages comments for a card in the CardDetailModal. */
export function CommentList({ cardId }: CommentListProps) {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiRequest<Comment[]>(`/api/cards/${cardId}/comments`);
      setComments(list);
    } catch (err) {
      setError("Could not load comments.");
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [cardId, handleError]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  return (
    <section aria-label="Comments" className="border-t border-line pt-4 mt-4">
      <h3 className="text-base font-semibold text-ink mb-3">Comments</h3>

      {loading ? (
        <p className="text-sm text-ink-muted py-2">Loading comments...</p>
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => void loadComments()} />
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-muted py-2">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              isOwner={Boolean(user && user.user_id === comment.author.user_id)}
              onUpdated={(updated) =>
                setComments((prev) =>
                  prev.map((c) => (c.comment_id === updated.comment_id ? updated : c))
                )
              }
              onDeleted={(commentId) =>
                setComments((prev) => prev.filter((c) => c.comment_id !== commentId))
              }
            />
          ))}
        </ul>
      )}

      <CommentForm
        cardId={cardId}
        onAdded={(created) => setComments((prev) => [...prev, created])}
      />
    </section>
  );
}
