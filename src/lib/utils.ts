import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a full name as "FirstName L." (first name + last initial)
 * @param fullName - The full name (e.g., "Sarah Miller")
 * @returns Formatted name (e.g., "Sarah M.")
 */
export function formatDisplayName(fullName: string): string {
  if (!fullName?.trim()) return "Visitor";

  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0];

  if (parts.length === 1) {
    return firstName;
  }

  const lastName = parts[parts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}
