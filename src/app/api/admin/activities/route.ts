import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all activities with check-in counts and related data
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all activities with location and series info
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select("*, locations(name), activity_series(name)")
      .order("event_date", { ascending: false, nullsFirst: false });

    if (activitiesError) {
      return NextResponse.json(
        { success: false, error: activitiesError.message },
        { status: 500 }
      );
    }

    // Get check-in counts per activity
    const { data: checkInCounts, error: countsError } = await supabase
      .from("check_ins")
      .select("activity_id")
      .not("activity_id", "is", null);

    if (countsError) {
      return NextResponse.json(
        { success: false, error: countsError.message },
        { status: 500 }
      );
    }

    const countMap: Record<string, number> = {};
    for (const checkIn of checkInCounts || []) {
      const activityId = checkIn.activity_id as string;
      countMap[activityId] = (countMap[activityId] || 0) + 1;
    }

    const activitiesWithCounts = (activities || []).map((a) => ({
      ...a,
      check_in_count: countMap[a.id] || 0,
      location_name: (a.locations as { name: string } | null)?.name || "Unknown",
      series_name: (a.activity_series as { name: string } | null)?.name || null,
    }));

    // Get all locations for the dropdown
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");

    // Get all series for the dropdown
    const { data: series } = await supabase
      .from("activity_series")
      .select("*")
      .eq("is_active", true)
      .order("name");

    // Get base URL setting
    const { data: baseUrlSetting } = await supabase
      .from("kiosk_settings")
      .select("setting_value")
      .eq("setting_key", "base_url")
      .single();

    const baseUrl = baseUrlSetting?.setting_value as string || "https://visit.hatchbridge.com";

    return NextResponse.json({
      success: true,
      activities: activitiesWithCounts,
      locations: locations || [],
      series: series || [],
      baseUrl,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, location_id, series_id, event_date, start_time, end_time } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Activity name is required" },
        { status: 400 }
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { success: false, error: "Activity slug is required" },
        { status: 400 }
      );
    }

    if (!location_id) {
      return NextResponse.json(
        { success: false, error: "Location is required" },
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

    // Check for duplicate slug
    const { data: existing } = await supabase
      .from("activities")
      .select("id")
      .eq("slug", slug.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An activity with this slug already exists" },
        { status: 400 }
      );
    }

    const { data: activity, error } = await supabase
      .from("activities")
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim() || null,
        location_id,
        series_id: series_id || null,
        event_date: event_date || null,
        start_time: start_time || null,
        end_time: end_time || null,
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

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update an activity
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, description, location_id, series_id, event_date, start_time, end_time, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Activity ID is required" },
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
      const { data: existing } = await supabase
        .from("activities")
        .select("id")
        .eq("slug", slug.trim())
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, error: "An activity with this slug already exists" },
          { status: 400 }
        );
      }
      updateData.slug = slug.trim().toLowerCase();
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (location_id !== undefined) updateData.location_id = location_id;
    if (series_id !== undefined) updateData.series_id = series_id || null;
    if (event_date !== undefined) updateData.event_date = event_date || null;
    if (start_time !== undefined) updateData.start_time = start_time || null;
    if (end_time !== undefined) updateData.end_time = end_time || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: activity, error } = await supabase
      .from("activities")
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

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an activity
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("activities").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
