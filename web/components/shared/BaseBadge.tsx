import React from "react";
import { cn } from "@/lib/cn";

export type BaseBadgeVariant = "gray" | "blue" | "green" | "red" | "yellow";

export interface BaseBadgeProps {
  variant?: BaseBadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<BaseBadgeVariant, string> = {
  gray: "bg-sunken text-ink-muted",
  blue: "bg-primary-100 text-primary-700",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger-ink",
  yellow: "bg-warning-soft text-warning-ink",
};

/** Shared status and role badge using Kano semantic color tokens. */
export function BaseBadge({ variant = "gray", className, children }: BaseBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-2.5 rounded-full text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
