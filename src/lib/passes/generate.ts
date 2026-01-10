import { createHmac, randomBytes } from "crypto";

// Generate a unique pass code like "HB-A3K9M2"
export function generatePassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, I, 1 for clarity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HB-${code}`;
}

// Create QR payload with signature for validation
export function createQRPayload(passCode: string, expiresAt: Date): object {
  const payload = {
    v: 1, // Version
    pid: passCode,
    exp: Math.floor(expiresAt.getTime() / 1000),
  };

  // Sign the payload
  const secret = process.env.QR_SIGNING_SECRET || "default-secret-change-me";
  const signature = createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex")
    .substring(0, 16);

  return {
    ...payload,
    sig: signature,
  };
}

// Verify QR payload signature
export function verifyQRPayload(payload: {
  v: number;
  pid: string;
  exp: number;
  sig: string;
}): boolean {
  const { sig, ...data } = payload;
  const secret = process.env.QR_SIGNING_SECRET || "default-secret-change-me";
  const expectedSig = createHmac("sha256", secret)
    .update(JSON.stringify(data))
    .digest("hex")
    .substring(0, 16);

  return sig === expectedSig;
}

// Generate a random token for various purposes
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}
