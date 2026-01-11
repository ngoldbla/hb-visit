import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CONFIRMATION_PHRASE = "DELETE ALL DATA";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resetType, confirmationText } = body;

    // Validate confirmation text
    if (confirmationText !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        { success: false, error: "Confirmation text does not match" },
        { status: 400 }
      );
    }

    // Validate reset type
    const validResetTypes = ["check_ins", "streaks", "members", "all"];
    if (!validResetTypes.includes(resetType)) {
      return NextResponse.json(
        { success: false, error: "Invalid reset type" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    switch (resetType) {
      case "check_ins":
        // Delete all check-ins only
        const { error: checkInsError } = await supabase
          .from("check_ins")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000"); // Match all rows

        if (checkInsError) {
          console.error("Failed to delete check-ins:", checkInsError);
          return NextResponse.json(
            { success: false, error: "Failed to delete check-ins" },
            { status: 500 }
          );
        }

        // Reset community goal count
        await supabase
          .from("community_goals")
          .update({ current_count: 0 })
          .eq("is_active", true);

        break;

      case "streaks":
        // Reset all streaks to 0
        const { error: streaksError } = await supabase
          .from("members")
          .update({
            current_streak: 0,
            longest_streak: 0,
            last_check_in: null,
          })
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (streaksError) {
          console.error("Failed to reset streaks:", streaksError);
          return NextResponse.json(
            { success: false, error: "Failed to reset streaks" },
            { status: 500 }
          );
        }
        break;

      case "members":
        // Delete all check-ins first (due to foreign key)
        await supabase
          .from("check_ins")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        // Delete all members
        const { error: membersError } = await supabase
          .from("members")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        if (membersError) {
          console.error("Failed to delete members:", membersError);
          return NextResponse.json(
            { success: false, error: "Failed to delete members" },
            { status: 500 }
          );
        }

        // Reset community goal count
        await supabase
          .from("community_goals")
          .update({ current_count: 0 })
          .eq("is_active", true);

        break;

      case "all":
        // Delete all check-ins
        await supabase
          .from("check_ins")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        // Delete all members
        await supabase
          .from("members")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        // Delete all device tokens
        await supabase
          .from("device_tokens")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        // Delete all passkey credentials
        await supabase
          .from("passkey_credentials")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");

        // Reset community goal count
        await supabase
          .from("community_goals")
          .update({ current_count: 0 })
          .eq("is_active", true);

        break;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reset: ${resetType}`,
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
