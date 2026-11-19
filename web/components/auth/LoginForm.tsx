"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BaseButton } from "@/components/shared/BaseButton";
import { useAuth } from "@/hooks/useAuth";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { apiRequest } from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import type { LoginResult } from "@/lib/types";
import { validateEmail } from "@/lib/validation";

const INPUT_CLASSES =
  "w-full min-h-[44px] rounded-md border border-field bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary-500 focus-visible:border-primary-500";

/** Controlled login form with client validation and generic 401 feedback. */
export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { handleError } = useErrorHandler();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = password.length === 0 ? "Password is required" : null;

    if (emailErr || passwordErr) {
      setErrors({
        email: emailErr ?? undefined,
        password: passwordErr ?? undefined,
      });
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const result = await apiRequest<LoginResult>("/api/auth/login", {
        method: "POST",
        body: {
          email: email.trim(),
          password,
        },
      });
      login(result);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setPassword("");
        setErrors({ form: "Invalid email or password." });
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
        <h1 className="text-xl font-semibold text-ink">Log in to Kano</h1>
        <p className="text-sm text-ink-muted mt-1">Enter your email and password to continue.</p>
      </div>

      {errors.form ? (
        <div role="alert" className="rounded-md bg-danger-soft text-danger-ink px-3 py-2 text-sm">
          {errors.form}
        </div>
      ) : null}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-ink mb-1">
          Email
        </label>
        <input
          id="login-email"
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
        <label htmlFor="login-password" className="block text-sm font-medium text-ink mb-1">
          Password
        </label>
        <input
          id="login-password"
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
        {busy ? "Logging in..." : "Log in"}
      </BaseButton>

      <p className="text-sm text-ink-muted text-center">
        Need an account?{" "}
        <Link href="/register" className="text-primary-600 hover:text-primary-700 hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
