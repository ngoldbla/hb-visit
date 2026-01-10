import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApplePass } from "@/lib/wallet/apple";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passId: string }> }
) {
  try {
    const { passId } = await params;
    const supabase = await createClient();

    const { data: pass, error } = await supabase
      .from("passes")
      .select("*")
      .eq("id", passId)
      .single();

    if (error || !pass) {
      return NextResponse.json({ error: "Pass not found" }, { status: 404 });
    }

    // Check if pass is still valid
    if (pass.status !== "active") {
      return NextResponse.json(
        { error: "Pass is no longer active" },
        { status: 400 }
      );
    }

    if (new Date(pass.expires_at) < new Date()) {
      return NextResponse.json({ error: "Pass has expired" }, { status: 400 });
    }

    const buffer = await generateApplePass({
      passId: pass.id,
      passCode: pass.pass_code,
      visitorName: pass.visitor_name,
      visitorCompany: pass.visitor_company,
      hostName: pass.host_name,
      scheduledDate: pass.scheduled_date,
      scheduledTime: pass.scheduled_time,
      meetingRoom: pass.meeting_room,
      purpose: pass.purpose,
      qrPayload: JSON.stringify(pass.qr_payload),
      expiresAt: new Date(pass.expires_at),
    });

    if (!buffer) {
      return NextResponse.json(
        { error: "Apple Wallet is not configured" },
        { status: 503 }
      );
    }

    // Update database with Apple pass serial
    await supabase
      .from("passes")
      .update({ apple_pass_serial: pass.pass_code })
      .eq("id", passId);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="HatchBridge-${pass.pass_code}.pkpass"`,
      },
    });
  } catch (error) {
    console.error("Apple Wallet error:", error);
    return NextResponse.json(
      { error: "Failed to generate Apple Wallet pass" },
      { status: 500 }
    );
  }
}
