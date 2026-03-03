import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all activity series
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: series, error } = await supabase
      .from("activity_series")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, series: series || [] });
  } catch (error) {
    console.error("Error fetching series:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new series
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Series name is required" },
        { status: 400 }
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "Series slug is required" },
        { status: 400 }
      );
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { success: false, error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("activity_series")
      .select("id")
      .eq("slug", slug.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A series with this slug already exists" },
        { status: 400 }
      );
    }

    const { data: series, error } = await supabase
      .from("activity_series")
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, series });
  } catch (error) {
    console.error("Error creating series:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
