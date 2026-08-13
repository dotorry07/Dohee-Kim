"use client";

import { demoUser } from "@/lib/data";
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
    const grade = getGradeFromUserId(user.id, user.grade);

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

export function signIn(email: string, password: string) {
  if (email !== demoUser.email || password.length < 8) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
  } catch {
    throw new Error("브라우저 저장소를 사용할 수 없어 로그인할 수 없습니다.");
  }
  return demoUser;
}

export function signUp(input: {
  email: string;
  name: string;
  department: string;
  secondaryDepartment?: string;
  grade: number;
  studentNumber?: string;
}) {
  const timestamp = Date.now();
  const normalizedStudentNumber = input.studentNumber?.trim() ?? "";
  const grade = normalizedStudentNumber
    ? getGradeFromStudentNumber(normalizedStudentNumber)
    : input.grade as UserProfile["grade"];
  const user: UserProfile = {
    ...demoUser,
    id: normalizedStudentNumber ? `local-${normalizedStudentNumber}` : `local-${timestamp}`,
    authUserId: `auth-local-${timestamp}`,
    email: input.email,
    name: input.name,
    nickname: input.name,
    department: input.department,
    secondaryDepartment: input.secondaryDepartment?.trim() ?? "",
    grade,
    createdAt: new Date().toISOString()
  };

  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    throw new Error("브라우저 저장소를 사용할 수 없어 회원가입할 수 없습니다.");
  }
  return user;
}

export function signOut() {
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

  const studentNumber = extractStudentNumber(user.id);
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
  return updatedUser;
}
