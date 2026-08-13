"use client";

import { demoUser } from "@/lib/data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { extractStudentNumber, getGradeFromStudentNumber, getGradeFromUserId } from "@/lib/student";
import type { UserProfile } from "@/lib/types";

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
  const supabase = createSupabaseBrowserClient();

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user?.email) {
      const profile = await loadRemoteProfile(data.user.email);
      const user = profile ?? {
        ...demoUser,
        authUserId: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email.split("@")[0],
        nickname: data.user.user_metadata?.nickname || data.user.user_metadata?.name || data.user.email.split("@")[0]
      };
      setStoredUser(user);
      return user;
    }
  }

  if (email !== demoUser.email || password.length < 8) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  setStoredUser(demoUser);
  return demoUser;
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
  if (supabase && input.password) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: input.password,
      options: {
        data: {
          name: normalizedName,
          nickname: normalizedName,
          department: normalizedDepartment,
          secondaryDepartment: normalizedSecondaryDepartment,
          grade
        }
      }
    });
    if (error && !isAlreadyRegisteredError(error.message)) {
      throw new Error(error.message || "회원가입을 완료하지 못했습니다.");
    }
    if (!error && data.user?.id) {
      user.authUserId = data.user.id;
    }
  }

  const savedUser = await createRemoteProfile(user);
  clearStoredUser();

  if (supabase) {
    await supabase.auth.signOut();
  }

  return savedUser;
}

function isAlreadyRegisteredError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  return normalized.includes("already registered") || normalized.includes("already been registered") || normalized.includes("user already exists");
}

export function signOut() {
  const supabase = createSupabaseBrowserClient();
  if (supabase) void supabase.auth.signOut();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // localStorage may be unavailable in restricted browser contexts.
    }
  }
}

export function updateStoredNickname(nickname: string) {
  return updateStoredProfile({ nickname });
}

export function updateStoredProfile(input: Partial<Pick<UserProfile, "nickname" | "name" | "department" | "secondaryDepartment">>) {
  const user = getStoredUser();
  if (!user) return null;

  const studentNumber = user.studentNumber || extractStudentNumber(user.id);
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
  void updateRemoteProfile(user, input);
  return updatedUser;
}

async function loadRemoteProfile(email: string) {
  try {
    const response = await fetch(`/api/profile?email=${encodeURIComponent(email)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const body = await response.json() as { user?: UserProfile };
    return body.user ?? null;
  } catch {
    return null;
  }
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

  if (!response.ok) {
    throw new Error("회원 정보를 users에 저장하지 못했습니다.");
  }

  const body = await response.json() as { user?: UserProfile };
  if (!body.user) {
    throw new Error("저장된 회원 정보를 확인하지 못했습니다.");
  }

  return body.user;
}

export async function updateRemoteProfile(user: UserProfile, profile: Partial<Pick<UserProfile, "nickname" | "name" | "department" | "secondaryDepartment">>) {
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
