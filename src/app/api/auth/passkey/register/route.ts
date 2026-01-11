import { NextRequest, NextResponse } from "next/server";
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
} from "@/lib/auth/passkey";

/**
 * GET: Generate passkey registration options
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const name = url.searchParams.get("name");

  if (!email || !name) {
    return NextResponse.json(
      { success: false, error: "Email and name are required" },
      { status: 400 }
    );
  }

  try {
    const { options } = await generatePasskeyRegistrationOptions(email, name);

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error("Failed to generate registration options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate registration options" },
      { status: 500 }
    );
  }
}

/**
 * POST: Verify passkey registration response
 */
export async function POST(request: NextRequest) {
  try {
    const { email, response } = await request.json();

    if (!email || !response) {
      return NextResponse.json(
        { success: false, error: "Email and response are required" },
        { status: 400 }
      );
    }

    const result = await verifyPasskeyRegistration(email, response);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to verify registration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify registration" },
      { status: 500 }
    );
  }
}
