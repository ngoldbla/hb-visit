import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch check-ins for specific activity IDs (for reports)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const activityIds = url.searchParams.getAll("activity_id");

    if (activityIds.length === 0) {
      return NextResponse.json({ success: true, checkIns: [] });
    }

    const supabase = await createClient();

    const { data: checkIns, error } = await supabase
      .from("check_ins")
      .select("activity_id, member_id, visitor_name, check_in_time")
      .in("activity_id", activityIds)
      .eq("is_overtap", false)
      .order("check_in_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, checkIns: checkIns || [] });
  } catch (error) {
    console.error("Error fetching activity check-ins:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
