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

    // Check if setting exists
    const { data: existing } = await supabase
      .from("kiosk_settings")
      .select("id")
      .eq("setting_key", key)
      .single();

    if (existing) {
      // Update existing setting
      const { error } = await supabase
        .from("kiosk_settings")
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", key);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
    } else {
      // Insert new setting
      const { error } = await supabase.from("kiosk_settings").insert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
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
