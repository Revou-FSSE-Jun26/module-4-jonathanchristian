"use client";

import React from "react";
import { cn } from "@/lib/cn";

export type BaseButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

export interface BaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BaseButtonVariant;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed";

const VARIANT_CLASSES: Record<BaseButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-sunken disabled:text-ink-subtle",
  secondary:
    "bg-surface text-ink border border-line-strong hover:bg-sunken active:bg-line disabled:bg-sunken disabled:text-ink-subtle disabled:border-line",
  destructive:
    "bg-danger text-white hover:bg-danger-hover active:bg-danger-ink disabled:bg-sunken disabled:text-ink-subtle",
  ghost:
    "bg-transparent text-ink-muted hover:bg-sunken hover:text-ink active:bg-line disabled:text-ink-subtle disabled:hover:bg-transparent",
};

/** Shared button primitive enforcing Kano tokens, 44 px tap target, and disabled semantics. */
export function BaseButton({
  variant = "primary",
  disabled = false,
  type = "button",
  onClick,
  className,
  children,
  ...props
}: BaseButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={disabled ? "true" : undefined}
      onClick={handleClick}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
