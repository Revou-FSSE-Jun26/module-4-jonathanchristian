"use client";

import { useEffect, useState } from "react";
import { BaseButton } from "@/components/shared/BaseButton";
import { ChangePasswordForm } from "@/components/users/ChangePasswordForm";
import { ReadOnlyEmail } from "@/components/users/ReadOnlyEmail";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { showSuccess } from "@/lib/toast";
import type { ProfileUpdate, User } from "@/lib/types";
import { validateName, validatePasswordSection } from "@/lib/validation";

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle";

/** Profile settings form for updating name and optionally changing password (fixed email). */
export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [name, setName] = useState(user?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateName(name);
    const pwErrs = validatePasswordSection(currentPassword, newPassword);

    if (nameErr || pwErrs.currentPassword || pwErrs.newPassword) {
      setErrors({
        name: nameErr ?? undefined,
        currentPassword: pwErrs.currentPassword ?? undefined,
        newPassword: pwErrs.newPassword ?? undefined,
      });
      return;
    }

    const body: ProfileUpdate = { name: name.trim() };
    const changingPassword = currentPassword.length > 0 && newPassword.length > 0;
    if (changingPassword) {
      body.password = newPassword;
      body.current_password = currentPassword;
    }

    setErrors({});
    setBusy(true);
    try {
      const updated = await apiRequest<User>("/api/users/me", {
        method: "PATCH",
        body,
      });
      updateUser(updated);
      if (changingPassword) {
        setCurrentPassword("");
        setNewPassword("");
      }
      showSuccess("Profile updated.");
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.statusCode === 400 &&
        err.message.includes("current_password")
      ) {
        setErrors({ currentPassword: err.message });
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
        <p className="text-sm text-ink-muted mt-1">
          Update your display name or change your password.
        </p>
      </div>

      <ReadOnlyEmail email={user?.email ?? ""} />

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

      <ChangePasswordForm
        currentPassword={currentPassword}
        newPassword={newPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        currentPasswordError={errors.currentPassword}
        newPasswordError={errors.newPassword}
      />

      <div className="flex justify-end">
        <BaseButton type="submit" disabled={busy}>
          {busy ? "Saving..." : "Save profile"}
        </BaseButton>
      </div>
    </form>
  );
}
