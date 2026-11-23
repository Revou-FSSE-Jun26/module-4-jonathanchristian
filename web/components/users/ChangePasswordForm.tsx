"use client";

export interface ChangePasswordFormProps {
  currentPassword: string;
  newPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  currentPasswordError?: string;
  newPasswordError?: string;
}

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle";

/** Optional change-password section with masked inputs and autocomplete attributes. */
export function ChangePasswordForm({
  currentPassword,
  newPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  currentPasswordError,
  newPasswordError,
}: ChangePasswordFormProps) {
  return (
    <div className="border-t border-line pt-4 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-ink">Change password</h2>

      <div>
        <label
          htmlFor="profile-current-password"
          className="block text-sm font-medium text-ink mb-1"
        >
          Current password
        </label>
        <input
          id="profile-current-password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => onCurrentPasswordChange(e.target.value)}
          aria-invalid={currentPasswordError ? "true" : undefined}
          className={INPUT_CLASSES}
        />
        {currentPasswordError ? (
          <p role="alert" className="text-xs text-danger-ink mt-1">
            {currentPasswordError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="profile-new-password"
          className="block text-sm font-medium text-ink mb-1"
        >
          New password
        </label>
        <input
          id="profile-new-password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          aria-invalid={newPasswordError ? "true" : undefined}
          className={INPUT_CLASSES}
        />
        {newPasswordError ? (
          <p role="alert" className="text-xs text-danger-ink mt-1">
            {newPasswordError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
