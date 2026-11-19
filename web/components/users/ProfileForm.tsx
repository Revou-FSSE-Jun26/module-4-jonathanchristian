"use client";

import { useEffect, useState } from "react";
import { BaseButton } from "@/components/shared/BaseButton";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { showSuccess } from "@/lib/toast";
import type { User } from "@/lib/types";
import { validateProfileFields } from "@/lib/validation";

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle";

/** Profile settings form for updating name and email without a password field. */
export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProfileFields({ name, email });
    if (validation.name || validation.email) {
      setErrors({
        name: validation.name ?? undefined,
        email: validation.email ?? undefined,
      });
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const updated = await apiRequest<User>("/api/users/me", {
        method: "PATCH",
        body: {
          name: name.trim(),
          email: email.trim(),
        },
      });
      updateUser(updated);
      showSuccess("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setErrors({ email: "This email is already in use." });
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
        void handleSubmit(e);
      }}
      noValidate
      className="bg-surface border border-line rounded-lg p-6 w-full max-w-xl mx-auto flex flex-col gap-4"
    >
      <div>
        <h1 className="text-xl font-semibold text-ink">Profile</h1>
        <p className="text-sm text-ink-muted mt-1">Update your name and email address.</p>
      </div>

      <div>
        <label htmlFor="profile-name" className="block text-sm font-medium text-ink mb-1">
          Name
        </label>
        <input
          id="profile-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={errors.name ? "true" : undefined}
          className={INPUT_CLASSES}
        />
        {errors.name ? (
          <p role="alert" className="text-xs text-danger-ink mt-1">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="profile-email" className="block text-sm font-medium text-ink mb-1">
          Email
        </label>
        <input
          id="profile-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email ? "true" : undefined}
          className={INPUT_CLASSES}
        />
        {errors.email ? (
          <p role="alert" className="text-xs text-danger-ink mt-1">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <BaseButton type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save profile"}
        </BaseButton>
      </div>
    </form>
  );
}
