import { PKPass } from "passkit-generator";
import { randomUUID } from "crypto";

interface ApplePassData {
  passId: string;
  passCode: string;
  visitorName: string;
  visitorCompany?: string | null;
  hostName?: string | null;
  scheduledDate: string;
  scheduledTime?: string | null;
  meetingRoom?: string | null;
  purpose?: string | null;
  qrPayload: string;
  expiresAt: Date;
}

/**
 * Generates an Apple Wallet .pkpass file for a visitor pass.
 *
 * Prerequisites:
 * 1. Apple Developer Account ($99/year)
 * 2. Pass Type Identifier registered at Apple Developer Portal
 * 3. Certificates generated and exported:
 *    - WWDR G4 Certificate (from Apple Certificate Authority)
 *    - Signer Certificate (from your Pass Type ID)
 *    - Signer Private Key (from CSR generation)
 *
 * Environment variables required:
 * - APPLE_PASS_TYPE_ID: e.g., "pass.com.hatchbridge.visitor"
 * - APPLE_TEAM_ID: Your Apple Developer Team ID
 * - APPLE_WWDR_CERT: WWDR G4 certificate (base64 or file path)
 * - APPLE_SIGNER_CERT: Your signer certificate (base64 or file path)
 * - APPLE_SIGNER_KEY: Your signer private key (base64 or file path)
 * - APPLE_SIGNER_KEY_PASSPHRASE: Optional passphrase for private key
 */
export async function generateApplePass(
  data: ApplePassData
): Promise<Buffer | null> {
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const wwdrCert = process.env.APPLE_WWDR_CERT;
  const signerCert = process.env.APPLE_SIGNER_CERT;
  const signerKey = process.env.APPLE_SIGNER_KEY;
  const signerKeyPassphrase = process.env.APPLE_SIGNER_KEY_PASSPHRASE;

  if (!passTypeId || !teamId || !wwdrCert || !signerCert || !signerKey) {
    console.log(
      "Apple Wallet not configured - missing required environment variables"
    );
    return null;
  }

  const serialNumber = randomUUID();

  // Format date and time for display
  const dateDisplay = new Date(data.scheduledDate + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  );

  const timeDisplay = data.scheduledTime
    ? formatTime(data.scheduledTime)
    : "Anytime";

  try {
    // Load certificates - handle both base64 and file paths
    const wwdr = loadCertificate(wwdrCert);
    const signer = loadCertificate(signerCert);
    const key = loadCertificate(signerKey);

    // Create the pass.json content
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeId,
      teamIdentifier: teamId,
      serialNumber,
      organizationName: "HatchBridge",
      description: "Visitor Pass",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(0, 8, 36)",
      labelColor: "rgb(255, 196, 33)",
      logoText: "HatchBridge",
      generic: {
        primaryFields: [
          {
            key: "visitor",
            label: "VISITOR",
            value: data.visitorName,
          },
        ],
        secondaryFields: [
          {
            key: "host",
            label: "HOST",
            value: data.hostName || "Reception",
          },
          ...(data.meetingRoom
            ? [
                {
                  key: "location",
                  label: "LOCATION",
                  value: data.meetingRoom,
                },
              ]
            : []),
        ],
        auxiliaryFields: [
          {
            key: "date",
            label: "DATE",
            value: dateDisplay,
          },
          {
            key: "time",
            label: "TIME",
            value: timeDisplay,
          },
        ],
        backFields: [
          {
            key: "passCode",
            label: "Pass Code",
            value: data.passCode,
          },
          ...(data.purpose
            ? [
                {
                  key: "purpose",
                  label: "Purpose of Visit",
                  value: data.purpose,
                },
              ]
            : []),
          ...(data.visitorCompany
            ? [
                {
                  key: "company",
                  label: "Company",
                  value: data.visitorCompany,
                },
              ]
            : []),
        ],
      },
      barcodes: [
        {
          format: "PKBarcodeFormatQR",
          message: data.qrPayload,
          messageEncoding: "iso-8859-1",
          altText: data.passCode,
        },
      ],
      expirationDate: data.expiresAt.toISOString(),
      relevantDate: new Date(data.scheduledDate + "T00:00:00").toISOString(),
    };

    // Create pass with buffers for model content
    const pass = new PKPass(
      {
        "pass.json": Buffer.from(JSON.stringify(passJson)),
      },
      {
        wwdr,
        signerCert: signer,
        signerKey: key,
        signerKeyPassphrase,
      }
    );

    return pass.getAsBuffer();
  } catch (error) {
    console.error("Failed to generate Apple Wallet pass:", error);
    return null;
  }
}

function loadCertificate(value: string): Buffer {
  // Check if it's a base64 string (doesn't start with / or .)
  if (!value.startsWith("/") && !value.startsWith(".")) {
    return Buffer.from(value, "base64");
  }
  // Otherwise treat as file path
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  return fs.readFileSync(value);
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
