import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeOvertaps = url.searchParams.get("includeOvertaps") === "true";

    const supabase = await createClient();

    let query = supabase
      .from("check_ins")
      .select("*")
      .order("check_in_time", { ascending: false });

    if (!includeOvertaps) {
      query = query.eq("is_overtap", false);
    }

    const { data: checkIns, error } = await query;

    if (error) {
      console.error("Failed to fetch check-ins:", error);
      return NextResponse.json(
        { error: "Failed to fetch check-ins" },
        { status: 500 }
      );
    }

    const headers = [
      "Visitor Name",
      "Location",
      "Check-In Time",
      "Check-Out Time",
      "Duration (minutes)",
      "Check-In Method",
      "Status",
      "Is Overtap",
    ];

    const rows = (checkIns || []).map((c) => [
      escapeCSV(c.visitor_name),
      escapeCSV(c.location),
      formatDateTime(c.check_in_time),
      formatDateTime(c.check_out_time),
      String(c.duration_minutes ?? ""),
      escapeCSV(c.check_in_method),
      escapeCSV(c.status),
      c.is_overtap ? "Yes" : "No",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const date = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="checkins-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
