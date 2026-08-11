import type { UserProfile } from "@/lib/types";

export function extractStudentNumber(userId: string) {
  const studentNumber = userId.replace(/\D/g, "").slice(-8);
  return /^\d{8}$/.test(studentNumber) ? studentNumber : "";
}

export function getGradeFromStudentNumber(studentNumber: string, baseDate = new Date()): UserProfile["grade"] {
  const admissionYear = Number(studentNumber.slice(0, 4));
  const currentYear = baseDate.getFullYear();

  if (!/^\d{8}$/.test(studentNumber) || !Number.isFinite(admissionYear) || admissionYear > currentYear) {
    return 1;
  }

  const grade = currentYear - admissionYear + 1;
  return Math.min(4, Math.max(1, grade)) as UserProfile["grade"];
}

export function getGradeFromUserId(userId: string, fallbackGrade: UserProfile["grade"]) {
  const studentNumber = extractStudentNumber(userId);
  return studentNumber ? getGradeFromStudentNumber(studentNumber) : fallbackGrade;
}
