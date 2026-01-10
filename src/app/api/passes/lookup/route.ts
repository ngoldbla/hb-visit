import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Simple in-memory rate limiting (consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

const LookupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = LookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const supabase = await createClient();

    // Query active passes for this email
    const { data: passes, error } = await supabase
      .from("passes")
      .select(`
        id,
        pass_code,
        visitor_name,
        visitor_company,
        scheduled_date,
        scheduled_time,
        host_name,
        meeting_room,
        purpose,
        status,
        expires_at,
        qr_payload
      `)
      .eq("visitor_email", email.toLowerCase())
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("scheduled_date", { ascending: true });

    if (error) {
      console.error("Lookup error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve passes" },
        { status: 500 }
      );
    }

    // Always return success (don't reveal if email exists for privacy)
    return NextResponse.json({
      passes: passes || [],
      message: passes?.length
        ? `Found ${passes.length} active pass${passes.length === 1 ? "" : "es"}`
        : "No active passes found for this email",
    });
  } catch (error) {
    console.error("Lookup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
