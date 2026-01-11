/**
 * Name moderation module for validating visitor names.
 * Blocks profanity, offensive content, trick phrases, and security-risk characters.
 */

export interface ModerationResult {
  isValid: boolean;
  reason?: string;
  userMessage?: string;
}

export interface ModerationOptions {
  maxLength?: number;
  minLength?: number;
}

// Leetspeak character substitutions for normalization
const LEETSPEAK_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  "$": "s",
  "!": "i",
  "+": "t",
  "(": "c",
  "|": "i",
};

// Blocked terms (normalized, lowercase, no spaces)
// These are checked after normalization
const BLOCKED_TERMS: Set<string> = new Set([
  // Common profanity
  "fuck",
  "shit",
  "ass",
  "bitch",
  "damn",
  "crap",
  "dick",
  "cock",
  "pussy",
  "cunt",
  "bastard",
  "whore",
  "slut",
  "piss",
  "tits",
  "boob",
  "penis",
  "vagina",
  "anus",
  "fag",
  "douche",
  "wanker",
  "twat",
  "prick",

  // Slurs and offensive terms
  "nigger",
  "nigga",
  "nig",
  "chink",
  "spic",
  "wetback",
  "kike",
  "kyke",
  "gook",
  "jap",
  "raghead",
  "towelhead",
  "beaner",
  "cracker",
  "honky",
  "gringo",
  "retard",
  "tard",

  // Trick phrases (normalized)
  "deeznuts",
  "deeznutz",
  "dznuts",
  "bofa",
  "sugma",
  "ligma",
  "sugondese",
  "updog",
  "henway",
  "eatma",
  "grabahan",
  "tugma",
  "sawcon",
  "candice",
  "goblin",
  "joe",
  "wendys",

  // Test/abuse patterns
  "test",
  "testing",
  "asdf",
  "qwerty",
  "admin",
  "administrator",
  "null",
  "undefined",
  "none",
  "anonymous",
  "anon",
  "nobody",
  "noname",
  "guest",
  "user",
  "sample",
  "example",
  "placeholder",
  "fakename",
  "fake",
  "name",
  "yourname",
  "myname",
  "firstname",
  "lastname",
  "fullname",
  "xxx",
  "zzz",
  "aaa",
  "abc",
]);

// Patterns that should be blocked as substrings (after normalization)
const BLOCKED_PATTERNS: string[] = [
  "fuck",
  "shit",
  "ass",
  "bitch",
  "cock",
  "dick",
  "cunt",
  "pussy",
  "nigger",
  "nigga",
  "fag",
  "deez",
  "nutz",
  "nuts",
];

// Characters that could enable XSS, SQL injection, or break parsing
const DANGEROUS_CHARS_REGEX = /[<>'"`;\\{}()[\]\/\x00-\x1F]/;

// SQL-like patterns
const SQL_PATTERNS: RegExp[] = [
  /\bor\b.*=.*=/i,
  /\bunion\b.*\bselect\b/i,
  /--/,
  /;\s*drop\b/i,
  /'\s*or\s*'/i,
  /"\s*or\s*"/i,
  /\bdrop\s+table\b/i,
  /\binsert\s+into\b/i,
  /\bdelete\s+from\b/i,
  /\bupdate\s+.*\bset\b/i,
];

/**
 * Normalize a string for profanity checking.
 * Converts to lowercase, removes spaces, applies leetspeak substitutions,
 * and collapses repeated characters.
 */
function normalizeForCheck(name: string): string {
  let normalized = name.toLowerCase();

  // Remove spaces, hyphens, underscores, dots, and other separators
  normalized = normalized.replace(/[\s\-_.']+/g, "");

  // Apply leetspeak normalization (two passes for compound substitutions)
  for (let pass = 0; pass < 2; pass++) {
    for (const [leet, normal] of Object.entries(LEETSPEAK_MAP)) {
      normalized = normalized.split(leet).join(normal);
    }
  }

  // Collapse repeated characters (3+ becomes 2)
  // This catches things like "fuuuuck" -> "fuck"
  normalized = normalized.replace(/(.)\1{2,}/g, "$1$1");

  return normalized;
}

/**
 * Check if the normalized name contains a blocked term (exact match).
 */
function containsBlockedExact(normalized: string): boolean {
  return BLOCKED_TERMS.has(normalized);
}

/**
 * Check if the normalized name contains a blocked pattern (substring).
 */
function containsBlockedPattern(normalized: string): boolean {
  for (const pattern of BLOCKED_PATTERNS) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for dangerous characters that could enable injection attacks.
 */
function containsDangerousChars(name: string): boolean {
  if (DANGEROUS_CHARS_REGEX.test(name)) {
    return true;
  }

  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(name)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if name contains only valid characters for a person's name.
 * Allows: Unicode letters, combining marks, spaces, hyphens, apostrophes, periods
 */
function hasValidNameChars(name: string): boolean {
  // Allow Unicode letters (any language), combining marks, spaces, hyphens, apostrophes, periods
  // eslint-disable-next-line no-misleading-character-class
  return /^[\p{L}\p{M}\s\-'.]+$/u.test(name);
}

/**
 * Check if name looks like a real name (has at least one letter).
 */
function hasLetters(name: string): boolean {
  return /\p{L}/u.test(name);
}

/**
 * Main validation function for names.
 */
export function validateName(
  name: string,
  options: ModerationOptions = {}
): ModerationResult {
  const { maxLength = 100, minLength = 2 } = options;

  // Trim and basic existence check
  const trimmed = name?.trim() || "";

  if (!trimmed) {
    return {
      isValid: false,
      reason: "empty",
      userMessage: "Name is required",
    };
  }

  // Length checks
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      reason: "too_short",
      userMessage: `Name must be at least ${minLength} characters`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      reason: "too_long",
      userMessage: `Name cannot exceed ${maxLength} characters`,
    };
  }

  // Must contain at least one letter
  if (!hasLetters(trimmed)) {
    return {
      isValid: false,
      reason: "no_letters",
      userMessage: "Name must contain at least one letter",
    };
  }

  // Dangerous character check (always applied, before any normalization)
  if (containsDangerousChars(trimmed)) {
    return {
      isValid: false,
      reason: "dangerous_chars",
      userMessage: "Name contains characters that are not allowed",
    };
  }

  // Valid name characters check
  if (!hasValidNameChars(trimmed)) {
    return {
      isValid: false,
      reason: "invalid_chars",
      userMessage:
        "Name can only contain letters, spaces, hyphens, apostrophes, and periods",
    };
  }

  // Profanity and offensive content check (after normalization)
  const normalized = normalizeForCheck(trimmed);

  // Check exact matches first
  if (containsBlockedExact(normalized)) {
    return {
      isValid: false,
      reason: "blocked_content",
      userMessage: "Please enter a valid name",
    };
  }

  // Check pattern matches
  if (containsBlockedPattern(normalized)) {
    return {
      isValid: false,
      reason: "blocked_pattern",
      userMessage: "Please enter a valid name",
    };
  }

  return { isValid: true };
}
