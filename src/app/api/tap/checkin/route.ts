import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDeviceToken } from "@/lib/auth/tokens";

export async function POST(request: NextRequest) {
  try {
    // Get the token from header or body
    const token =
      request.headers.get("X-Visitor-Token") ||
      (await request.json().catch(() => ({}))).token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No token provided" },
        { status: 400 }
      );
    }

    // Get location from query params or body
    const url = new URL(request.url);
    const location = url.searchParams.get("loc") || "unknown";

    // Validate the token
    const validation = await validateDeviceToken(token);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error, requiresAuth: true },
        { status: 401 }
      );
    }

    const { visitorEmail, visitorName } = validation;

    // Create check-in record
    const supabase = await createClient();

    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .insert({
        check_in_time: new Date().toISOString(),
        check_in_method: "nfc_token",
        location,
        visitor_name: visitorName,
        status: "checked_in",
      })
      .select("id")
      .single();

    if (checkInError) {
      console.error("Failed to create check-in:", checkInError);
      return NextResponse.json(
        { success: false, error: "Failed to create check-in" },
        { status: 500 }
      );
    }

    // TODO: Trigger host notification here

    return NextResponse.json({
      success: true,
      check_in_id: checkIn.id,
      visitor_name: visitorName,
      visitor_email: visitorEmail,
      location,
      message: `Welcome back, ${visitorName}!`,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
