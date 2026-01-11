import { NextRequest, NextResponse } from "next/server";
import {
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from "@/lib/auth/passkey";
import { createDeviceToken } from "@/lib/auth/tokens";

/**
 * GET: Generate passkey authentication options
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || undefined;

  try {
    const result = await generatePasskeyAuthenticationOptions(email);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "No passkeys found for this email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      options: result.options,
    });
  } catch (error) {
    console.error("Failed to generate authentication options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate authentication options" },
      { status: 500 }
    );
  }
}

/**
 * POST: Verify passkey authentication response and create new token
 */
export async function POST(request: NextRequest) {
  try {
    const { response, email } = await request.json();

    if (!response) {
      return NextResponse.json(
        { success: false, error: "Response is required" },
        { status: 400 }
      );
    }

    const result = await verifyPasskeyAuthentication(response, email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    // Create a new device token for this authenticated user
    const userAgent = request.headers.get("user-agent") || undefined;
    const tokenResult = await createDeviceToken(
      result.visitorEmail!,
      result.visitorName!,
      userAgent
    );

    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: "Failed to create device token" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visitorEmail: result.visitorEmail,
      visitorName: result.visitorName,
      token: tokenResult.token,
    });
  } catch (error) {
    console.error("Failed to verify authentication:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
