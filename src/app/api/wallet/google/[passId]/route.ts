import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateGoogleWalletUrl } from "@/lib/wallet/google";

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

    const url = generateGoogleWalletUrl({
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
      expiresAt: pass.expires_at,
    });

    if (!url) {
      return NextResponse.json(
        { error: "Google Wallet is not configured" },
        { status: 503 }
      );
    }

    // Update database with Google pass ID
    await supabase
      .from("passes")
      .update({ google_pass_id: pass.id })
      .eq("id", passId);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Google Wallet error:", error);
    return NextResponse.json(
      { error: "Failed to generate Google Wallet pass" },
      { status: 500 }
    );
  }
}
