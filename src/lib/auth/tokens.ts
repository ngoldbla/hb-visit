import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export interface TokenValidationResult {
  success: boolean;
  visitorEmail?: string;
  visitorName?: string;
  error?: string;
}

export interface TokenCreationResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Generates a new device token and stores it in the database.
 */
export async function createDeviceToken(
  visitorEmail: string,
  visitorName: string,
  userAgent?: string
): Promise<TokenCreationResult> {
  const supabase = await createClient();
  const token = randomUUID();

  const { error } = await supabase.from("device_tokens").insert({
    token,
    visitor_email: visitorEmail.toLowerCase().trim(),
    visitor_name: visitorName.trim(),
    user_agent: userAgent || null,
    is_active: true,
  });

  if (error) {
    console.error("Failed to create device token:", error);
    return { success: false, error: "Failed to create device token" };
  }

  return { success: true, token };
}

/**
 * Validates a device token and returns the associated visitor info.
 * Updates the last_used_at timestamp on successful validation.
 */
export async function validateDeviceToken(
  token: string
): Promise<TokenValidationResult> {
  if (!token || !isValidUUID(token)) {
    return { success: false, error: "Invalid token format" };
  }

  const supabase = await createClient();

  // Look up the token
  const { data, error } = await supabase
    .from("device_tokens")
    .select("visitor_email, visitor_name, is_active")
    .eq("token", token)
    .single();

  if (error || !data) {
    return { success: false, error: "Token not found" };
  }

  if (!data.is_active) {
    return { success: false, error: "Token is inactive" };
  }

  // Update last_used_at timestamp
  await supabase
    .from("device_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token);

  return {
    success: true,
    visitorEmail: data.visitor_email,
    visitorName: data.visitor_name,
  };
}

/**
 * Deactivates a device token.
 */
export async function deactivateToken(token: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("device_tokens")
    .update({ is_active: false })
    .eq("token", token);

  return !error;
}

/**
 * Deactivates all tokens for a visitor email.
 */
export async function deactivateAllTokensForVisitor(
  visitorEmail: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("device_tokens")
    .update({ is_active: false })
    .eq("visitor_email", visitorEmail.toLowerCase().trim());

  return !error;
}

/**
 * Checks if a string is a valid UUID.
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
