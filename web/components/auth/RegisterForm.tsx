"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BaseButton } from "@/components/shared/BaseButton";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { safeNext, withNext } from "@/lib/nextParam";
import { showSuccess } from "@/lib/toast";
import type { User } from "@/lib/types";
import { validateEmail, validateName, validatePassword } from "@/lib/validation";

export interface RegisterFormProps {
  next?: string | null;
}

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-500 focus-visible:border-primary-500";

/** Controlled registration form with client validation and 409 email-in-use handling. */
export function RegisterForm({ next = null }: RegisterFormProps) {
  const router = useRouter();
  const { handleError } = useErrorHandler();
  const validatedNext = safeNext(next);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (nameErr || emailErr || passwordErr) {
      setErrors({
        name: nameErr ?? undefined,
        email: emailErr ?? undefined,
        password: passwordErr ?? undefined,
      });
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      await apiRequest<User>("/api/auth/register", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
        },
      });
      showSuccess("Account created. Please log in.");
      router.push(withNext("/login", validatedNext));
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setErrors({ email: "This email is already registered." });
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
      className="bg-surface border border-line rounded-lg p-6 w-full max-w-md mx-auto flex flex-col gap-4"
    >
      <div>
        <h1 className="text-xl font-semibold text-ink">Create your account</h1>
        <p className="text-sm text-ink-muted mt-1">Sign up to start organizing your boards.</p>
      </div>

      <div>
        <label htmlFor="register-name" className="block text-sm font-medium text-ink mb-1">
          Name
        </label>
        <input
          id="register-name"
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
        <label htmlFor="register-email" className="block text-sm font-medium text-ink mb-1">
          Email
        </label>
        <input
          id="register-email"
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

      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-ink mb-1">
          Password
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={errors.password ? "true" : undefined}
          className={INPUT_CLASSES}
        />
        {errors.password ? (
          <p role="alert" className="text-xs text-danger-ink mt-1">
            {errors.password}
          </p>
        ) : null}
      </div>

      <BaseButton type="submit" disabled={busy} className="w-full">
        {busy ? "Creating account..." : "Create account"}
      </BaseButton>

      <p className="text-sm text-ink-muted text-center">
        Already have an account?{" "}
        <Link
          href={withNext("/login", validatedNext)}
          className="text-primary-600 hover:text-primary-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
