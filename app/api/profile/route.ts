import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { ensureDatabaseUser, loadDatabaseUserByEmail } from "@/lib/server/users";
import type { UserProfile } from "@/lib/types";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  try {
    const profile = await loadDatabaseUserByEmail(email);
    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error("Profile load failed", error);
    return NextResponse.json({ error: "Profile load failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;

  if (!user?.email) {
    return NextResponse.json({ error: "Missing user." }, { status: 400 });
  }

  try {
    const id = await ensureDatabaseUser(user);
    const profile = await loadDatabaseUserByEmail(user.email);
    return NextResponse.json({ user: profile ? { ...profile, id } : { ...user, id } });
  } catch (error) {
    console.error("Profile upsert failed", error);
    return NextResponse.json({ error: "Profile upsert failed." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;
  const profile = body.profile as Partial<Pick<UserProfile, "name" | "nickname" | "department" | "secondaryDepartment">> | undefined;

  if (!user?.email || !profile) {
    return NextResponse.json({ error: "Missing profile." }, { status: 400 });
  }

  try {
    const userId = await ensureDatabaseUser(user);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("users")
      .update({
        name: profile.name,
        nickname: profile.nickname,
        department: profile.department
      })
      .eq("id", userId);

    if (error) throw error;

    const updated = await loadDatabaseUserByEmail(user.email);
    return NextResponse.json({ user: updated ?? { ...user, ...profile } });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Profile update failed." }, { status: 500 });
  }
}
