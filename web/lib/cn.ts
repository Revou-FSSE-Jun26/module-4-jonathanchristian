import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS class names safely with Kano tokens. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
