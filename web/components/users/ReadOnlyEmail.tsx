export interface ReadOnlyEmailProps {
  email: string;
}

/** Displays the user's fixed email as read-only text (no input control). */
export function ReadOnlyEmail({ email }: ReadOnlyEmailProps) {
  return (
    <dl className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-ink">Email</dt>
      <dd className="text-sm text-ink-muted break-all">{email}</dd>
    </dl>
  );
}
