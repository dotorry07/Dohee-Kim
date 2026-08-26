import { NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/config";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { ensureDatabaseUser } from "@/lib/server/users";
import type { UserProfile } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;

  if (!user?.email) {
    return NextResponse.json({ error: "Missing user." }, { status: 400 });
  }

  if (getAuthProvider() === "mock") {
    return NextResponse.json({ preferences: {}, provider: "mock" });
  }

  try {
    const userId = await ensureDatabaseUser(user);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("timetable_preferences")
      .select("preference_key, value")
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json({
      preferences: Object.fromEntries((data ?? []).map((row) => [row.preference_key, row.value]))
    });
  } catch (error) {
    console.error("Timetable preferences load failed", error);
    return NextResponse.json({ error: "Timetable preferences load failed." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;
  const preferences = body.preferences as Record<string, unknown> | undefined;

  if (!user?.email || !preferences) {
    return NextResponse.json({ error: "Missing preferences." }, { status: 400 });
  }

  if (getAuthProvider() === "mock") {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const userId = await ensureDatabaseUser(user);
    const supabase = createSupabaseAdminClient();
    const rows = Object.entries(preferences).map(([key, value]) => ({
      user_id: userId,
      preference_key: key,
      value,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from("timetable_preferences")
      .upsert(rows, { onConflict: "user_id,preference_key" });

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Timetable preferences save failed", error);
    return NextResponse.json({ error: "Timetable preferences save failed." }, { status: 500 });
  }
}
