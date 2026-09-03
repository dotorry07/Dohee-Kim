import { type NextRequest, NextResponse } from "next/server";
import { getAuthProvider } from "@/lib/auth/config";
import {
  MOCK_ACCOUNTS_COOKIE,
  mockAccountsCookieOptions,
  registerMockUser
} from "@/lib/auth/mock-server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { ensureDatabaseUser, loadDatabaseUserByEmail } from "@/lib/server/users";
import type { UserProfile } from "@/lib/types";

type SignupRequest = {
  email?: string;
  password?: string;
  user?: UserProfile;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as SignupRequest;
  const email = body.email?.trim();
  const password = body.password;
  const user = body.user;

  if (!email || !password || !user?.email) {
    return NextResponse.json({ error: "Missing signup input.", reason: "missing_signup_input" }, { status: 400 });
  }

  if (email.toLowerCase() !== user.email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Email mismatch.", reason: "email_mismatch" }, { status: 400 });
  }

  if (getAuthProvider() === "mock") {
    const result = registerMockUser(
      { email, password, user },
      request.cookies.get(MOCK_ACCOUNTS_COOKIE)?.value
    );

    if ("reason" in result) {
      const status = result.reason === "duplicate_email" ? 409 : 400;
      return NextResponse.json({ error: "Mock signup failed.", reason: result.reason }, { status });
    }

    const response = NextResponse.json(
      { user: result.user, provider: "mock" },
      { status: 201 }
    );
    response.cookies.set(MOCK_ACCOUNTS_COOKIE, result.accountsCookie, mockAccountsCookieOptions);
    return response;
  }

  try {
    const existingProfile = await loadDatabaseUserByEmail(email);
    if (existingProfile) {
      return NextResponse.json({ error: "Email already registered.", reason: "duplicate_email" }, { status: 409 });
    }

    const signupName = user.name.trim();
    const signupProfile = { ...user, name: signupName, nickname: signupName };
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: signupProfile.name,
        nickname: signupProfile.nickname,
        department: signupProfile.department,
        secondaryDepartment: signupProfile.secondaryDepartment ?? "",
        studentNumber: signupProfile.studentNumber ?? "",
        grade: signupProfile.grade
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message, reason: getAuthFailureReason(error.message) }, { status: 400 });
    }

    if (!data.user?.id) {
      return NextResponse.json({ error: "Auth user missing.", reason: "missing_auth_user" }, { status: 502 });
    }

    const profileInput = { ...signupProfile, authUserId: data.user.id, email };
    const id = await ensureDatabaseUser(profileInput);
    const profile = await loadDatabaseUserByEmail(email);

    return NextResponse.json({ user: profile ? { ...profile, id } : { ...profileInput, id } });
  } catch (error) {
    console.error("Signup failed", error);
    const reason = getProfileFailureReason(error);
    return NextResponse.json({ error: "Signup failed.", reason }, { status: reason === "unknown_signup_error" ? 500 : 409 });
  }
}

function getAuthFailureReason(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("already") || normalized.includes("exist")) return "duplicate_email";
  if (normalized.includes("password")) return "weak_password";
  if (normalized.includes("email")) return "invalid_email";
  if (normalized.includes("rate") || normalized.includes("too many")) return "rate_limited";

  return "auth_signup_failed";
}

function getProfileFailureReason(error: unknown) {
  const databaseError = error as { code?: string; message?: string; details?: string };
  const text = `${databaseError.message ?? ""} ${databaseError.details ?? ""}`.toLowerCase();

  if (databaseError.code === "23505" && text.includes("email")) return "duplicate_email";
  if (databaseError.code === "23505" && text.includes("student_number")) return "duplicate_student_number";
  if (databaseError.code === "23505") return "duplicate_profile";

  return "unknown_signup_error";
}
