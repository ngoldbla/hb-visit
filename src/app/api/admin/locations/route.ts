import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all locations with check-in counts
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all locations
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    if (locationsError) {
      return NextResponse.json(
        { success: false, error: locationsError.message },
        { status: 500 }
      );
    }

    // Get check-in counts by location
    const { data: checkInCounts, error: countsError } = await supabase
      .from("check_ins")
      .select("location")
      .not("location", "is", null);

    if (countsError) {
      return NextResponse.json(
        { success: false, error: countsError.message },
        { status: 500 }
      );
    }

    // Count check-ins per location
    const countMap: Record<string, number> = {};
    for (const checkIn of checkInCounts || []) {
      const loc = checkIn.location as string;
      countMap[loc] = (countMap[loc] || 0) + 1;
    }

    // Add check-in count to each location
    const locationsWithCounts = (locations || []).map((loc) => ({
      ...loc,
      check_in_count: countMap[loc.slug] || 0,
    }));

    // Get base URL setting
    const { data: baseUrlSetting } = await supabase
      .from("kiosk_settings")
      .select("setting_value")
      .eq("setting_key", "base_url")
      .single();

    const baseUrl = baseUrlSetting?.setting_value as string || "https://visit.hatchbridge.com";

    return NextResponse.json({
      success: true,
      locations: locationsWithCounts,
      baseUrl,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Location name is required" },
        { status: 400 }
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "Location slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { success: false, error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", slug.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A location with this slug already exists" },
        { status: 400 }
      );
    }

    const { data: location, error } = await supabase
      .from("locations")
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

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a location
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, description, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Location ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (slug !== undefined) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { success: false, error: "Slug must contain only lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }
      // Check for duplicate slug
      const { data: existing } = await supabase
        .from("locations")
        .select("id")
        .eq("slug", slug.trim())
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, error: "A location with this slug already exists" },
          { status: 400 }
        );
      }
      updateData.slug = slug.trim().toLowerCase();
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: location, error } = await supabase
      .from("locations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a location
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Location ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("locations").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
