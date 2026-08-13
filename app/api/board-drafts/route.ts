import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { ensureDatabaseUser } from "@/lib/server/users";
import type { BoardPost, UserProfile } from "@/lib/types";

type BoardDraft = {
  id?: string;
  category: BoardPost["category"];
  title: string;
  content: string;
  image?: unknown;
};

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
      .from("board_drafts")
      .select("id, category, title, content, image, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ drafts: data ?? [] });
  } catch (error) {
    console.error("Board drafts load failed", error);
    return NextResponse.json({ error: "Board drafts load failed." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;
  const draft = body.draft as BoardDraft | undefined;

  if (!user?.email || !draft) {
    return NextResponse.json({ error: "Missing draft." }, { status: 400 });
  }

  try {
    const userId = await ensureDatabaseUser(user);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("board_drafts")
      .upsert({
        ...(draft.id ? { id: draft.id } : {}),
        user_id: userId,
        category: draft.category,
        title: draft.title,
        content: draft.content,
        image: draft.image ?? null,
        saved_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Board draft save failed", error);
    return NextResponse.json({ error: "Board draft save failed." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;
  const draftId = typeof body.draftId === "string" ? body.draftId : "";

  if (!user?.email || !draftId) {
    return NextResponse.json({ error: "Missing draft." }, { status: 400 });
  }

  try {
    const userId = await ensureDatabaseUser(user);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("board_drafts").delete().eq("id", draftId).eq("user_id", userId);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Board draft delete failed", error);
    return NextResponse.json({ error: "Board draft delete failed." }, { status: 500 });
  }
}
