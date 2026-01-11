import { NextRequest, NextResponse } from "next/server";
import { createDeviceToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, company, location } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Get user agent for device tracking
    const userAgent = request.headers.get("user-agent") || undefined;

    // Create device token
    const result = await createDeviceToken(
      email.toLowerCase().trim(),
      name.trim(),
      userAgent
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      message: `Welcome, ${name}!`,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
