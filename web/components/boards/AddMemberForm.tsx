"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { BaseButton } from "@/components/shared/BaseButton";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { showSuccess } from "@/lib/toast";
import type { Member } from "@/lib/types";
import { validateEmail } from "@/lib/validation";

export interface AddMemberFormProps {
  boardId: string;
  onAdded: (member: Member) => void;
}

/** Form for board admins to add a member by email. */
export function AddMemberForm({ boardId, onAdded }: AddMemberFormProps) {
  const { handleError } = useErrorHandler();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }

    setFieldError(null);
    setBusy(true);
    try {
      const added = await apiRequest<Member>(`/api/boards/${boardId}/members`, {
        method: "POST",
        body: { email: email.trim() },
      });
      onAdded(added);
      setEmail("");
      showSuccess(`Added ${added.name}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 404) {
          setFieldError("No user found with that email.");
        } else if (err.statusCode === 409) {
          setFieldError("User is already a member of this board.");
        } else if (err.statusCode === 400) {
          setFieldError(err.message);
        } else {
          handleError(err);
        }
      } else {
        handleError(err);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleAdd(e);
      }}
      noValidate
      className="flex flex-col gap-2 mb-6"
    >
      <label htmlFor="member-email-input" className="text-sm font-medium text-ink">
        Add member by email
      </label>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          id="member-email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          className="flex-1 min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle"
        />
        <BaseButton type="submit" disabled={busy}>
          <UserPlus className="size-4" aria-hidden="true" />
          <span>Add member</span>
        </BaseButton>
      </div>
      {fieldError ? (
        <p role="alert" className="text-xs text-danger-ink">
          {fieldError}
        </p>
      ) : null}
    </form>
  );
}
