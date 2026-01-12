import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Discover existing locations from check_ins and add them to locations table
export async function POST() {
  try {
    const supabase = await createClient();

    // Get all unique location slugs from check_ins
    const { data: checkIns, error: checkInsError } = await supabase
      .from("check_ins")
      .select("location")
      .not("location", "is", null);

    if (checkInsError) {
      return NextResponse.json(
        { success: false, error: checkInsError.message },
        { status: 500 }
      );
    }

    // Get unique location slugs
    const uniqueSlugs = [...new Set(
      (checkIns || [])
        .map((c) => c.location)
        .filter((loc): loc is string => loc !== null && loc.trim() !== "")
    )];

    // Get existing locations
    const { data: existingLocations, error: existingError } = await supabase
      .from("locations")
      .select("slug");

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 }
      );
    }

    const existingSlugs = new Set((existingLocations || []).map((l) => l.slug));

    // Filter to only new slugs
    const newSlugs = uniqueSlugs.filter((slug) => !existingSlugs.has(slug));

    if (newSlugs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new locations to discover",
        added: 0,
      });
    }

    // Create location entries for new slugs
    const newLocations = newSlugs.map((slug) => ({
      name: formatSlugToName(slug),
      slug: slug.toLowerCase(),
      description: `Auto-discovered from check-in data`,
      is_active: true,
    }));

    const { data: insertedLocations, error: insertError } = await supabase
      .from("locations")
      .insert(newLocations)
      .select();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Discovered ${insertedLocations?.length || 0} new locations`,
      added: insertedLocations?.length || 0,
      locations: insertedLocations,
    });
  } catch (error) {
    console.error("Error discovering locations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Convert slug to readable name (e.g., "main-entrance" -> "Main Entrance")
function formatSlugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
