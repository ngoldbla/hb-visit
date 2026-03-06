/**
 * Phone number normalization and formatting utilities.
 * Handles US phone numbers (10 digits).
 */

/**
 * Strip non-digits and normalize to 10-digit US format.
 * Handles 11-digit numbers starting with 1 (country code).
 * Returns null if the result isn't a valid 10-digit number.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  // Handle US 11-digit (1 + 10 digits)
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  if (digits.length === 10) {
    return digits;
  }

  return null;
}

/**
 * Format a normalized 10-digit phone for display during entry.
 * Progressively formats as digits are entered:
 *   3 digits  → (555)
 *   6 digits  → (555) 123
 *   10 digits → (555) 123-4567
 */
export function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");

  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

/**
 * Mask a normalized phone for privacy on confirmation screens.
 * e.g. "5551234567" → "***-***-4567"
 */
export function maskPhone(normalized: string): string {
  if (normalized.length < 4) return normalized;
  return `***-***-${normalized.slice(-4)}`;
}
