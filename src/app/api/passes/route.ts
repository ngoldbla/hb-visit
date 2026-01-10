import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePassCode, createQRPayload } from "@/lib/passes/generate";
import { z } from "zod";
import type { Json } from "@/lib/supabase/types";

const CreatePassSchema = z.object({
  visitor_email: z.string().email(),
  visitor_name: z.string().min(1),
  visitor_company: z.string().optional(),
  scheduled_date: z.string(), // YYYY-MM-DD
  scheduled_time: z.string().optional(), // HH:MM
  host_name: z.string().optional(),
  host_email: z.string().email().optional(),
  purpose: z.string().optional(),
  meeting_room: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreatePassSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createClient();

    // Generate pass code and QR payload
    const passCode = generatePassCode();
    const expiresAt = new Date(data.scheduled_date);
    expiresAt.setDate(expiresAt.getDate() + 1); // Valid for 24 hours after scheduled date
    expiresAt.setHours(23, 59, 59, 999);

    const qrPayload = createQRPayload(passCode, expiresAt);

    // Check for existing member
    const { data: existingMember } = await supabase
      .from("members")
      .select("id")
      .eq("email", data.visitor_email)
      .single();

    // Create the pass
    const { data: pass, error } = await supabase
      .from("passes")
      .insert({
        pass_code: passCode,
        visitor_email: data.visitor_email,
        visitor_name: data.visitor_name,
        visitor_company: data.visitor_company,
        member_id: existingMember?.id,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        host_name: data.host_name,
        host_email: data.host_email,
        purpose: data.purpose,
        meeting_room: data.meeting_room,
        status: "active",
        expires_at: expiresAt.toISOString(),
        qr_payload: qrPayload as unknown as Json,
      })
      .select()
      .single();

    if (error) {
      console.error("Create pass error:", error);
      return NextResponse.json(
        { error: "Failed to create pass" },
        { status: 500 }
      );
    }

    // TODO: Send email with pass
    // TODO: Generate Apple Wallet / Google Pay pass URLs

    return NextResponse.json({
      success: true,
      pass: {
        id: pass.id,
        pass_code: pass.pass_code,
        qr_data: JSON.stringify(qrPayload),
        expires_at: pass.expires_at,
        // These will be populated once wallet integration is complete
        apple_wallet_url: null,
        google_wallet_url: null,
      },
    });
  } catch (error) {
    console.error("Create pass error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("passes")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: passes, error } = await query.limit(100);

    if (error) {
      console.error("List passes error:", error);
      return NextResponse.json(
        { error: "Failed to list passes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ passes });
  } catch (error) {
    console.error("List passes error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
