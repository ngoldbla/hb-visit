import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get all kiosk settings
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("kiosk_settings")
      .select("*")
      .order("setting_key");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Convert array to object keyed by setting_key
    const settings: Record<string, unknown> = {};
    for (const row of data || []) {
      settings[row.setting_key] = row.setting_value;
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update a setting (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Setting key is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Use upsert to insert or update in a single operation
    // This is more reliable than check-then-insert/update which can fail
    // due to race conditions or RLS policy interactions
    const { error } = await supabase
      .from("kiosk_settings")
      .upsert(
        {
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        }
      );

    if (error) {
      console.error("Error upserting setting:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
