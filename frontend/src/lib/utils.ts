import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names conditionally and merges Tailwind CSS classes to avoid conflicts.
 * Useful for dynamically constructing `className` props in React components.
 *
 * @param inputs - List of class values (strings, objects, arrays, etc.)
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
