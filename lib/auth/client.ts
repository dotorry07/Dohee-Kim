"use client";

import { demoUser } from "@/lib/data";
import { extractStudentNumber, getGradeFromStudentNumber, getGradeFromUserId } from "@/lib/student";
import type { UserProfile } from "@/lib/types";

const USER_KEY = "newbie-on:user";

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const user = JSON.parse(raw) as UserProfile;
    const grade = getGradeFromUserId(user.id, user.grade);

    return grade === user.grade ? user : { ...user, grade };
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function signIn(email: string, password: string) {
  if (email !== demoUser.email || password.length < 8) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
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

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_KEY);
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
  window.localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  return updatedUser;
}
