import { createClient } from "@/lib/supabase/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

// Configuration from environment or defaults
const rpName = process.env.WEBAUTHN_RP_NAME || "HatchBridge Visitor";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;

// In-memory challenge store (for production, use Redis or database)
const challengeStore = new Map<string, string>();

export interface PasskeyRegistrationOptions {
  options: PublicKeyCredentialCreationOptionsJSON;
  challenge: string;
}

export interface PasskeyAuthenticationOptions {
  options: PublicKeyCredentialRequestOptionsJSON;
  challenge: string;
}

// Types for the JSON versions that @simplewebauthn uses
type PublicKeyCredentialCreationOptionsJSON = Awaited<
  ReturnType<typeof generateRegistrationOptions>
>;
type PublicKeyCredentialRequestOptionsJSON = Awaited<
  ReturnType<typeof generateAuthenticationOptions>
>;

/**
 * Generate registration options for a new passkey.
 */
export async function generatePasskeyRegistrationOptions(
  visitorEmail: string,
  visitorName: string
): Promise<PasskeyRegistrationOptions> {
  const supabase = await createClient();

  // Get existing credentials for this user (to exclude them)
  const { data: existingCredentials } = await supabase
    .from("passkey_credentials")
    .select("credential_id")
    .eq("visitor_email", visitorEmail.toLowerCase());

  const excludeCredentials = (existingCredentials || []).map((cred) => ({
    id: cred.credential_id,
    type: "public-key" as const,
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(visitorEmail.toLowerCase()),
    userName: visitorEmail.toLowerCase(),
    userDisplayName: visitorName,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  // Store challenge for verification
  challengeStore.set(visitorEmail.toLowerCase(), options.challenge);

  return {
    options,
    challenge: options.challenge,
  };
}

/**
 * Verify and store a passkey registration response.
 */
export async function verifyPasskeyRegistration(
  visitorEmail: string,
  response: RegistrationResponseJSON
): Promise<{ success: boolean; error?: string }> {
  const expectedChallenge = challengeStore.get(visitorEmail.toLowerCase());

  if (!expectedChallenge) {
    return { success: false, error: "No challenge found" };
  }

  let verification: VerifiedRegistrationResponse;

  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error("Registration verification failed:", error);
    return { success: false, error: "Verification failed" };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { success: false, error: "Registration not verified" };
  }

  const { credential } = verification.registrationInfo;

  // Store the credential in the database
  const supabase = await createClient();

  const { error } = await supabase.from("passkey_credentials").insert({
    visitor_email: visitorEmail.toLowerCase(),
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    transports: response.response.transports || [],
  });

  if (error) {
    console.error("Failed to store credential:", error);
    return { success: false, error: "Failed to store credential" };
  }

  // Clear the challenge
  challengeStore.delete(visitorEmail.toLowerCase());

  return { success: true };
}

/**
 * Generate authentication options for passkey login.
 */
export async function generatePasskeyAuthenticationOptions(
  visitorEmail?: string
): Promise<PasskeyAuthenticationOptions | null> {
  const supabase = await createClient();

  // If email provided, get that user's credentials
  // Otherwise, allow discoverable credentials
  let allowCredentials: { id: string; type: "public-key"; transports?: AuthenticatorTransportFuture[] }[] = [];

  if (visitorEmail) {
    const { data: credentials } = await supabase
      .from("passkey_credentials")
      .select("credential_id, transports")
      .eq("visitor_email", visitorEmail.toLowerCase());

    if (!credentials || credentials.length === 0) {
      return null;
    }

    allowCredentials = credentials.map((cred) => ({
      id: cred.credential_id,
      type: "public-key" as const,
      transports: (cred.transports || []) as AuthenticatorTransportFuture[],
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    userVerification: "preferred",
  });

  // Store challenge for verification
  const challengeKey = visitorEmail?.toLowerCase() || "anonymous";
  challengeStore.set(`auth:${challengeKey}`, options.challenge);

  return {
    options,
    challenge: options.challenge,
  };
}

/**
 * Verify a passkey authentication response.
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  visitorEmail?: string
): Promise<{ success: boolean; visitorEmail?: string; visitorName?: string; error?: string }> {
  const supabase = await createClient();

  // Find the credential in the database
  const { data: credential, error: credError } = await supabase
    .from("passkey_credentials")
    .select("*")
    .eq("credential_id", response.id)
    .single();

  if (credError || !credential) {
    return { success: false, error: "Credential not found" };
  }

  const challengeKey = visitorEmail?.toLowerCase() || "anonymous";
  const expectedChallenge = challengeStore.get(`auth:${challengeKey}`);

  if (!expectedChallenge) {
    return { success: false, error: "No challenge found" };
  }

  let verification: VerifiedAuthenticationResponse;

  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credential_id,
        publicKey: new Uint8Array(Buffer.from(credential.public_key, "base64")),
        counter: credential.counter || 0,
        transports: (credential.transports || []) as AuthenticatorTransportFuture[],
      },
    });
  } catch (error) {
    console.error("Authentication verification failed:", error);
    return { success: false, error: "Verification failed" };
  }

  if (!verification.verified) {
    return { success: false, error: "Authentication not verified" };
  }

  // Update the counter
  await supabase
    .from("passkey_credentials")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("credential_id", credential.credential_id);

  // Clear the challenge
  challengeStore.delete(`auth:${challengeKey}`);

  // Get visitor name from device_tokens
  const { data: tokenData } = await supabase
    .from("device_tokens")
    .select("visitor_name")
    .eq("visitor_email", credential.visitor_email)
    .limit(1)
    .single();

  return {
    success: true,
    visitorEmail: credential.visitor_email,
    visitorName: tokenData?.visitor_name || credential.visitor_email,
  };
}

/**
 * Check if a visitor has any registered passkeys.
 */
export async function hasPasskey(visitorEmail: string): Promise<boolean> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("passkey_credentials")
    .select("*", { count: "exact", head: true })
    .eq("visitor_email", visitorEmail.toLowerCase());

  return (count || 0) > 0;
}
