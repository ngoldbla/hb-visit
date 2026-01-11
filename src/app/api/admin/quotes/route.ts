import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all quotes
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: quotes, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, author, category, source } = body;

    if (!text?.trim()) {
      return NextResponse.json(
        { success: false, error: "Quote text is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        text: text.trim(),
        author: author?.trim() || null,
        category: category?.trim() || null,
        source: source?.trim() || null,
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

    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a quote
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, text, author, category, source, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Quote ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (text !== undefined) updateData.text = text.trim();
    if (author !== undefined) updateData.author = author?.trim() || null;
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (source !== undefined) updateData.source = source?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: quote, error } = await supabase
      .from("quotes")
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

    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quote
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Quote ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("quotes").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
