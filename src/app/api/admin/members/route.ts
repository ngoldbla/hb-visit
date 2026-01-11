import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deactivateAllTokensForVisitor } from "@/lib/auth/tokens";

// PATCH - Update member fields
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, email, company, phone, current_streak, longest_streak } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (current_streak !== undefined) updateData.current_streak = current_streak;
    if (longest_streak !== undefined) updateData.longest_streak = longest_streak;

    const { data, error } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update member:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, member: data });
  } catch (error) {
    console.error("Member update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete (deactivate) member
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First, get the member's email to deactivate their tokens
    const { data: member } = await supabase
      .from("members")
      .select("email")
      .eq("id", id)
      .single();

    // Deactivate all tokens for this member so they can re-register
    if (member?.email) {
      await deactivateAllTokensForVisitor(member.email);
    }

    const { error } = await supabase
      .from("members")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to deactivate member:", error);
      return NextResponse.json(
        { success: false, error: "Failed to deactivate member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member deactivate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Reactivate a deactivated member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    if (action !== "reactivate") {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("members")
      .update({
        is_active: true,
        deactivated_at: null,
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to reactivate member:", error);
      return NextResponse.json(
        { success: false, error: "Failed to reactivate member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member reactivate error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
