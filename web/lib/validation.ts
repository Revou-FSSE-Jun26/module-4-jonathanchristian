export type ValidationResult = string | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateTrimmedLength(
  value: string,
  label: string,
  min: number,
  max: number
): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${label} is required`;
  }
  if (trimmed.length > max) {
    return `${label} must be at most ${max} characters`;
  }
  return null;
}

/** Validate a user's display name (1 to 100 chars after trim). */
export function validateName(name: string): ValidationResult {
  return validateTrimmedLength(name, "Name", 1, 100);
}

/** Validate an email address (`local@domain.tld`, at most 254 chars). */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return "Email is required";
  }
  if (trimmed.length > 254 || !EMAIL_REGEX.test(trimmed)) {
    return "Enter a valid email address";
  }
  return null;
}

/** Validate a password (8 to 128 characters). */
export function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (password.length > 128) {
    return "Password must be at most 128 characters";
  }
  return null;
}

/** Validate a new password for profile change (8 to 128 characters). */
export function validateNewPassword(password: string): ValidationResult {
  return validatePassword(password);
}

/** Validate current password (non-empty). */
export function validateCurrentPassword(password: string): ValidationResult {
  if (password.length === 0) {
    return "Current password is required";
  }
  return null;
}

/**
 * Validate the optional change-password section on the profile page.
 * Both empty is valid (section unused); one filled errors on the empty one;
 * both filled validates each field.
 */
export function validatePasswordSection(
  currentPassword: string,
  newPassword: string
): { currentPassword: ValidationResult; newPassword: ValidationResult } {
  if (currentPassword.length === 0 && newPassword.length === 0) {
    return { currentPassword: null, newPassword: null };
  }
  if (currentPassword.length === 0) {
    return {
      currentPassword: "Current password is required",
      newPassword: validateNewPassword(newPassword),
    };
  }
  if (newPassword.length === 0) {
    return {
      currentPassword: validateCurrentPassword(currentPassword),
      newPassword: "New password is required",
    };
  }
  return {
    currentPassword: validateCurrentPassword(currentPassword),
    newPassword: validateNewPassword(newPassword),
  };
}

/** Validate a board name (1 to 100 chars after trim). */
export function validateBoardName(name: string): ValidationResult {
  return validateTrimmedLength(name, "Board name", 1, 100);
}

/** Validate a column name (1 to 100 chars after trim). */
export function validateColumnName(name: string): ValidationResult {
  return validateTrimmedLength(name, "Column name", 1, 100);
}

/** Validate a card title (1 to 200 chars after trim). */
export function validateCardTitle(title: string): ValidationResult {
  return validateTrimmedLength(title, "Title", 1, 200);
}

/** Validate comment text (non-whitespace, at most 2000 chars). */
export function validateCommentText(content: string): ValidationResult {
  return validateTrimmedLength(content, "Comment", 1, 2000);
}

/** Validate profile update fields (name and email). */
export function validateProfileFields(fields: {
  name: string;
  email: string;
}): { name: ValidationResult; email: ValidationResult } {
  return {
    name: validateName(fields.name),
    email: validateEmail(fields.email),
  };
}
