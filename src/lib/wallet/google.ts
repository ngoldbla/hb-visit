import jwt from "jsonwebtoken";

interface GooglePassData {
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
  expiresAt: string;
}

/**
 * Generates a Google Wallet "Save to Wallet" URL for a visitor pass.
 *
 * Prerequisites:
 * 1. Google Cloud Project with Google Wallet API enabled
 * 2. Service Account with "Google Wallet Object Creator" role
 * 3. Issuer Account registered at Google Pay & Wallet Console
 * 4. Generic Pass Class created in Google Wallet Console
 *
 * Environment variables required:
 * - GOOGLE_WALLET_ISSUER_ID: Your issuer ID from Google Wallet Console
 * - GOOGLE_WALLET_CREDENTIALS: JSON string of service account key
 * - NEXT_PUBLIC_APP_URL: Your application URL (for logo)
 */
export function generateGoogleWalletUrl(data: GooglePassData): string | null {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const credentialsJson = process.env.GOOGLE_WALLET_CREDENTIALS;

  if (!issuerId || !credentialsJson) {
    console.log("Google Wallet not configured - missing GOOGLE_WALLET_ISSUER_ID or GOOGLE_WALLET_CREDENTIALS");
    return null;
  }

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(credentialsJson);
  } catch {
    console.error("Failed to parse GOOGLE_WALLET_CREDENTIALS");
    return null;
  }

  const classId = `${issuerId}.hatchbridge_visitor`;
  const objectId = `${issuerId}.${data.passId.replace(/-/g, "_")}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hatchbridge.com";

  // Format date and time for display
  const dateDisplay = new Date(data.scheduledDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeDisplay = data.scheduledTime
    ? formatTime(data.scheduledTime)
    : "Anytime";

  const genericObject = {
    id: objectId,
    classId: classId,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    hexBackgroundColor: "#000824",
    logo: {
      sourceUri: {
        uri: `${appUrl}/logo-wallet.png`,
      },
      contentDescription: {
        defaultValue: {
          language: "en",
          value: "HatchBridge Logo",
        },
      },
    },
    cardTitle: {
      defaultValue: {
        language: "en",
        value: "HatchBridge",
      },
    },
    subheader: {
      defaultValue: {
        language: "en",
        value: "Visitor Pass",
      },
    },
    header: {
      defaultValue: {
        language: "en",
        value: data.visitorName,
      },
    },
    textModulesData: [
      {
        id: "pass_code",
        header: "Pass Code",
        body: data.passCode,
      },
      {
        id: "date",
        header: "Date",
        body: dateDisplay,
      },
      {
        id: "time",
        header: "Time",
        body: timeDisplay,
      },
      ...(data.hostName
        ? [
            {
              id: "host",
              header: "Host",
              body: data.hostName,
            },
          ]
        : []),
      ...(data.meetingRoom
        ? [
            {
              id: "location",
              header: "Location",
              body: data.meetingRoom,
            },
          ]
        : []),
    ],
    barcode: {
      type: "QR_CODE",
      value: data.qrPayload,
      alternateText: data.passCode,
    },
    validTimeInterval: {
      end: {
        date: data.expiresAt,
      },
    },
  };

  const claims = {
    iss: credentials.client_email,
    aud: "google",
    typ: "savetowallet",
    origins: [appUrl],
    payload: {
      genericObjects: [genericObject],
    },
  };

  try {
    const token = jwt.sign(claims, credentials.private_key, {
      algorithm: "RS256",
    });
    return `https://pay.google.com/gp/v/save/${token}`;
  } catch (error) {
    console.error("Failed to sign Google Wallet JWT:", error);
    return null;
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
