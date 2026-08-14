"use client";

import { demoUser } from "@/lib/data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { extractStudentNumber, getGradeFromStudentNumber, getGradeFromUserId } from "@/lib/student";
import type { UserProfile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

const USER_KEY = "newbie-on:user";

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    const storedUser = JSON.parse(raw) as Partial<UserProfile>;
    if (!storedUser.id || !storedUser.email || !storedUser.name) {
      window.localStorage.removeItem(USER_KEY);
      return null;
    }

    const user: UserProfile = {
      ...demoUser,
      ...storedUser,
      authUserId: storedUser.authUserId || demoUser.authUserId,
      nickname: storedUser.nickname || storedUser.name,
      department: storedUser.department || demoUser.department,
      grade: storedUser.grade || demoUser.grade,
      role: storedUser.role || "user",
      createdAt: storedUser.createdAt || new Date().toISOString()
    };
    const studentNumber = user.studentNumber || extractStudentNumber(user.id);
    const grade = studentNumber ? getGradeFromStudentNumber(studentNumber) : getGradeFromUserId(user.id, user.grade);

    return grade === user.grade ? user : { ...user, grade };
  } catch {
    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
    return null;
  }
}

export async function signIn(email: string, password: string) {
  const normalizedEmail = email.trim();
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("인증 설정이 없어 로그인할 수 없습니다.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error) {
    throw new Error(toKoreanAuthError(error.message));
  }

  if (!data.user?.email) {
    throw new Error("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
  }

  const user = await resolveAuthenticatedProfile(data.user);
  setStoredUser(user);
  return user;
}

function setStoredUser(user: UserProfile) {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    throw new Error("브라우저 저장소를 사용할 수 없어 로그인할 수 없습니다.");
  }
}

function clearStoredUser() {
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // localStorage may be unavailable in restricted browser contexts.
  }
}

export async function signUp(input: {
  email: string;
  password?: string;
  name: string;
  department: string;
  secondaryDepartment?: string;
  grade: number;
  studentNumber?: string;
}) {
  const timestamp = Date.now();
  const normalizedStudentNumber = input.studentNumber?.trim() ?? "";
  const normalizedEmail = input.email.trim();
  const normalizedName = input.name.trim();
  const normalizedDepartment = input.department.trim();
  const normalizedSecondaryDepartment = input.secondaryDepartment?.trim() ?? "";
  const grade = normalizedStudentNumber
    ? getGradeFromStudentNumber(normalizedStudentNumber)
    : input.grade as UserProfile["grade"];
  const user: UserProfile = {
    ...demoUser,
    id: normalizedStudentNumber ? `local-${normalizedStudentNumber}` : `local-${timestamp}`,
    authUserId: `auth-local-${timestamp}`,
    email: normalizedEmail,
    name: normalizedName,
    nickname: normalizedName,
    department: normalizedDepartment,
    secondaryDepartment: normalizedSecondaryDepartment,
    studentNumber: normalizedStudentNumber,
    grade,
    createdAt: new Date().toISOString()
  };

  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase 인증 설정이 없어 회원가입을 완료할 수 없습니다.");
  }

  if (!input.password) {
    throw new Error("비밀번호를 입력해주세요.");
  }

  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password: input.password, user })
  });
  const body = await response.json().catch(() => ({})) as { user?: UserProfile; error?: string; reason?: string };
  if (!response.ok) {
    throw new Error(toKoreanSignupApiError(body.reason || body.error));
  }

  clearStoredUser();
  if (supabase) await supabase.auth.signOut();

  if (!body.user) {
    throw new Error("회원가입 API 응답에 사용자 정보가 없습니다. 서버 응답을 확인해주세요.");
  }

  return body.user;
}

export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  if (supabase) await supabase.auth.signOut();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
  }
}

export async function getCurrentUser() {
  const storedUser = getStoredUser();
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return storedUser;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) {
    clearStoredUser();
    return null;
  }

  if (storedUser?.authUserId === data.user.id) {
    return storedUser;
  }

  const user = await resolveAuthenticatedProfile(data.user);
  setStoredUser(user);
  return user;
}

export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return () => undefined;

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session?.user?.email) {
      clearStoredUser();
      callback(null);
      return;
    }

    void resolveAuthenticatedProfile(session.user)
      .then((user) => {
        setStoredUser(user);
        callback(user);
      })
      .catch(() => callback(getStoredUser()));
  });

  return () => data.subscription.unsubscribe();
}

export function updateStoredNickname(nickname: string) {
  return updateStoredProfile({ nickname });
}

export function updateStoredProfile(
  input: Partial<Pick<UserProfile, "email" | "nickname" | "name" | "department" | "secondaryDepartment" | "studentNumber" | "profileImageUrl">>,
  options: { syncRemote?: boolean } = {}
) {
  const user = getStoredUser();
  if (!user) return null;

  const studentNumber = input.studentNumber ?? user.studentNumber ?? extractStudentNumber(user.id);
  const updatedUser = {
    ...user,
    ...input,
    grade: studentNumber ? getGradeFromStudentNumber(studentNumber) : user.grade
  };
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  } catch {
    return null;
  }
  if (options.syncRemote !== false) {
    void updateRemoteProfile(user, input);
  }
  return updatedUser;
}

async function loadRemoteProfile(email: string, authUserId?: string) {
  try {
    const params = new URLSearchParams({ email });
    if (authUserId) {
      params.set("authUserId", authUserId);
    }
    const response = await fetch(`/api/profile?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return null;
    const body = await response.json() as { user?: UserProfile };
    return body.user ?? null;
  } catch {
    return null;
  }
}

async function resolveAuthenticatedProfile(authUser: User) {
  const email = authUser.email ?? "";
  const profile = await loadRemoteProfile(email, authUser.id);
  if (profile) {
    return {
      ...profile,
      authUserId: profile.authUserId || authUser.id
    };
  }

  const fallback = {
    ...demoUser,
    id: authUser.id,
    authUserId: authUser.id,
    email,
    name: stringMetadata(authUser, "name") || email.split("@")[0],
    nickname: stringMetadata(authUser, "nickname") || stringMetadata(authUser, "name") || email.split("@")[0],
    department: stringMetadata(authUser, "department") || demoUser.department,
    secondaryDepartment: stringMetadata(authUser, "secondaryDepartment"),
    studentNumber: stringMetadata(authUser, "studentNumber"),
    profileImageUrl: stringMetadata(authUser, "profileImageUrl"),
    grade: numberMetadata(authUser, "grade") || demoUser.grade,
    createdAt: authUser.created_at ?? new Date().toISOString()
  } satisfies UserProfile;

  const syncedProfile = await syncRemoteProfile(fallback);
  return syncedProfile ?? fallback;
}

function stringMetadata(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" ? value : "";
}

function numberMetadata(user: User, key: string): UserProfile["grade"] | null {
  const value = Number(user.user_metadata?.[key]);
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function toKoreanAuthError(message?: string, context: "login" | "signup" = "login") {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("email not confirmed") || normalized.includes("not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. 메일함에서 인증을 완료한 뒤 로그인해주세요.";
  }

  if (normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  if (normalized.includes("already registered") || normalized.includes("already been registered") || normalized.includes("user already exists")) {
    return "이미 가입된 이메일입니다. 로그인 화면에서 로그인해주세요.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "현재 Supabase 설정에서 회원가입이 비활성화되어 있습니다.";
  }

  if (normalized.includes("weak password") || normalized.includes("password should")) {
    return "비밀번호가 보안 기준을 충족하지 않습니다. 더 안전한 비밀번호를 입력해주세요.";
  }

  if (normalized.includes("email_address_invalid") || normalized.includes("invalid email")) {
    return "사용할 수 없는 이메일 주소입니다.";
  }

  if (normalized.includes("password")) {
    return "비밀번호 조건을 확인해주세요.";
  }

  if (normalized.includes("email")) {
    return "이메일 주소를 확인해주세요.";
  }

  return context === "signup"
    ? "Supabase Auth 회원가입 요청이 실패했습니다. 이메일, 비밀번호 조건, Supabase Auth 설정을 확인해주세요."
    : "로그인 중 오류가 발생했습니다. 다시 시도해주세요.";
}

async function syncRemoteProfile(user: UserProfile) {
  try {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user })
    });
    if (!response.ok) return null;
    const body = await response.json() as { user?: UserProfile };
    if (body.user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(body.user));
    }
    return body.user ?? null;
  } catch {
    // Local fallback remains the source of truth when Supabase is unavailable.
    return null;
  }
}

async function createRemoteProfile(user: UserProfile) {
  const response = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user })
  });

  const body = await response.json().catch(() => ({})) as { user?: UserProfile; error?: string; reason?: string };
  if (!response.ok) {
    throw new Error(toKoreanProfileError(body.reason || body.error));
  }

  if (!body.user) {
    throw new Error("회원 프로필 저장 응답에 사용자 정보가 없습니다. 프로필 API 응답을 확인해주세요.");
  }

  return body.user;
}

function toKoreanProfileError(reason?: string) {
  const normalized = reason?.toLowerCase() ?? "";

  if (normalized.includes("duplicate_email")) {
    return "이미 가입된 이메일입니다. 로그인 화면에서 로그인해주세요.";
  }

  if (normalized.includes("duplicate_student_number")) {
    return "이미 등록된 학번입니다. 입력한 학번을 확인해주세요.";
  }

  if (normalized.includes("missing_user")) {
    return "회원가입에 필요한 정보가 누락되었습니다.";
  }

  if (normalized.includes("supabase") || normalized.includes("profile")) {
    return "회원 프로필 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  return "회원 정보를 저장하지 못했습니다. 입력 정보를 확인한 뒤 다시 시도해주세요.";
}

function toKoreanSignupApiError(reason?: string) {
  const normalized = reason?.toLowerCase() ?? "";

  if (normalized.includes("duplicate_email")) {
    return "이미 가입된 이메일입니다. 로그인 화면에서 로그인해주세요.";
  }

  if (normalized.includes("duplicate_student_number")) {
    return "이미 등록된 학번입니다. 입력한 학번을 확인해주세요.";
  }

  if (normalized.includes("invalid_email")) {
    return "사용할 수 없는 이메일 주소입니다.";
  }

  if (normalized.includes("weak_password")) {
    return "비밀번호가 보안 기준을 충족하지 않습니다. 더 안전한 비밀번호를 입력해주세요.";
  }

  if (normalized.includes("rate_limited")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }

  if (normalized.includes("missing_signup_input")) {
    return "회원가입에 필요한 정보가 누락되었습니다.";
  }

  if (normalized.includes("email_mismatch")) {
    return "회원가입 이메일 정보가 일치하지 않습니다. 새로고침 후 다시 시도해주세요.";
  }

  if (normalized.includes("missing_auth_user")) {
    return "Supabase Auth 계정 생성 응답에 사용자 정보가 없습니다.";
  }

  return "회원가입 처리 중 오류가 발생했습니다. 입력값과 Supabase 설정을 확인해주세요.";
}

export async function updateRemoteProfile(user: UserProfile, profile: Partial<Pick<UserProfile, "email" | "nickname" | "name" | "department" | "secondaryDepartment" | "studentNumber" | "profileImageUrl" | "grade">>) {
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, profile })
    });
    if (!response.ok) return null;
    const body = await response.json() as { user?: UserProfile };
    if (body.user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(body.user));
    }
    return body.user ?? null;
  } catch {
    return null;
  }
}
