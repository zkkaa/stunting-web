import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
    });

    return NextResponse.json({
      success: true,
      status: res.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Keep-alive ping failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}