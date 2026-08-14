import { NextResponse } from "next/server";
import { ensureDatabaseUser, loadDatabaseUserByAuthUserId, loadDatabaseUserByEmail, loadDatabaseUserById, updateDatabaseUserProfile } from "@/lib/server/users";
import type { UserProfile } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");
  const authUserId = url.searchParams.get("authUserId");
  if (!id && !email) {
    return NextResponse.json({ error: "Missing profile lookup." }, { status: 400 });
  }

  try {
    const profile = id
      ? await loadDatabaseUserById(id)
      : await loadDatabaseUserByEmail(email as string) ?? (authUserId ? await loadDatabaseUserByAuthUserId(authUserId) : null);
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
    return NextResponse.json({ error: "Missing user.", reason: "missing_user" }, { status: 400 });
  }

  try {
    const id = await ensureDatabaseUser(user);
    const profile = await loadDatabaseUserByEmail(user.email);
    return NextResponse.json({ user: profile ? { ...profile, id } : { ...user, id } });
  } catch (error) {
    console.error("Profile upsert failed", error);
    const reason = getProfileFailureReason(error);
    return NextResponse.json({ error: "Profile upsert failed.", reason }, { status: reason === "unknown_profile_error" ? 500 : 409 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const user = body.user as UserProfile | undefined;
  const profile = body.profile as Partial<Pick<UserProfile, "email" | "name" | "nickname" | "department" | "secondaryDepartment" | "studentNumber" | "profileImageUrl" | "grade">> | undefined;

  if (!user?.email || !profile) {
    return NextResponse.json({ error: "Missing profile." }, { status: 400 });
  }

  try {
    await updateDatabaseUserProfile(user, profile);
    const updated = await loadDatabaseUserByEmail(profile.email ?? user.email);
    return NextResponse.json({ user: updated ?? { ...user, ...profile } });
  } catch (error) {
    console.error("Profile update failed", error);
    const reason = getProfileFailureReason(error);
    return NextResponse.json({ error: "Profile update failed.", reason }, { status: reason === "unknown_profile_error" ? 500 : 409 });
  }
}

function getProfileFailureReason(error: unknown) {
  const databaseError = error as { code?: string; message?: string; details?: string };
  const text = `${databaseError.message ?? ""} ${databaseError.details ?? ""}`.toLowerCase();

  if (databaseError.code === "23505" && text.includes("email")) {
    return "duplicate_email";
  }

  if (databaseError.code === "23505" && text.includes("student_number")) {
    return "duplicate_student_number";
  }

  if (databaseError.code === "23505") {
    return "duplicate_profile";
  }

  return "unknown_profile_error";
}
