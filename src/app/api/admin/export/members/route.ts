import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: members, error } = await supabase
      .from("members")
      .select("*")
      .neq("is_active", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch members:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    const headers = [
      "Name",
      "Email",
      "Company",
      "Phone",
      "Current Streak",
      "Longest Streak",
      "Last Check-In",
      "Joined",
    ];

    const rows = (members || []).map((m) => [
      escapeCSV(m.name),
      escapeCSV(m.email),
      escapeCSV(m.company),
      escapeCSV(m.phone),
      String(m.current_streak ?? 0),
      String(m.longest_streak ?? 0),
      m.last_check_in || "",
      m.created_at ? new Date(m.created_at).toISOString().split("T")[0] : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const date = new Date().toISOString().split("T")[0];

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="members-${date}.csv"`,
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
