import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { ensureDatabaseUser } from "@/lib/server/users";
import type { UserProfile } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;

  if (!user?.email) {
    return NextResponse.json({ error: "Missing user." }, { status: 400 });
  }

  try {
    const userId = await ensureDatabaseUser(user);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("notice_reads")
      .select("notice_id")
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json({ noticeIds: (data ?? []).map((row) => row.notice_id as string) });
  } catch (error) {
    console.error("Notice reads load failed", error);
    return NextResponse.json({ error: "Notice reads load failed." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;
  const noticeId = typeof body.noticeId === "string" ? body.noticeId : "";

  if (!user?.email || !noticeId) {
    return NextResponse.json({ error: "Missing notice." }, { status: 400 });
  }

  try {
    const userId = await ensureDatabaseUser(user);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("notice_reads")
      .upsert({ user_id: userId, notice_id: noticeId, read_at: new Date().toISOString() }, { onConflict: "user_id,notice_id" });

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Notice read save failed", error);
    return NextResponse.json({ error: "Notice read save failed." }, { status: 500 });
  }
}
