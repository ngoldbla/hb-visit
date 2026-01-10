import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Pass = Database["public"]["Tables"]["passes"]["Row"];

export async function POST(request: NextRequest) {
  try {
    const { qr_data } = await request.json();

    if (!qr_data) {
      return NextResponse.json(
        { error: "QR data is required" },
        { status: 400 }
      );
    }

    // Parse QR payload
    let payload;
    try {
      payload = JSON.parse(qr_data);
    } catch {
      return NextResponse.json(
        { error: "Invalid QR code format" },
        { status: 400 }
      );
    }

    const { pid: passCode } = payload;

    if (!passCode) {
      return NextResponse.json(
        { error: "Invalid pass code" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Look up the pass
    const { data, error: passError } = await supabase
      .from("passes")
      .select("*")
      .eq("pass_code", passCode)
      .single();

    if (passError || !data) {
      return NextResponse.json(
        { error: "Pass not found. Please check your QR code." },
        { status: 404 }
      );
    }

    const pass = data as Pass;

    // Check pass status
    if (pass.status === "used") {
      return NextResponse.json(
        { error: "This pass has already been used." },
        { status: 400 }
      );
    }

    if (pass.status === "expired" || new Date(pass.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This pass has expired. Please contact your host." },
        { status: 400 }
      );
    }

    if (pass.status === "revoked") {
      return NextResponse.json(
        { error: "This pass has been revoked." },
        { status: 400 }
      );
    }

    // Create check-in record
    const { data: checkIn, error: checkInError } = await supabase
      .from("check_ins")
      .insert({
        pass_id: pass.id,
        member_id: pass.member_id,
        check_in_time: new Date().toISOString(),
        check_in_method: "qr_scan",
        kiosk_id: "main-lobby",
        status: "checked_in",
      })
      .select()
      .single();

    if (checkInError) {
      console.error("Check-in error:", checkInError);
      return NextResponse.json(
        { error: "Failed to create check-in record." },
        { status: 500 }
      );
    }

    // Update pass status
    await supabase
      .from("passes")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
      })
      .eq("id", pass.id);

    // TODO: Send host notification (email/Slack)
    // This will be implemented with Resend/Slack webhook

    return NextResponse.json({
      success: true,
      check_in_id: checkIn.id,
      visitor_name: pass.visitor_name,
      host_name: pass.host_name,
      meeting_room: pass.meeting_room,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
