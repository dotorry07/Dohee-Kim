import { NextResponse } from "next/server";
import { courses, demoUser, personalSchedules } from "@/lib/data";
import { generateTimetableCandidates } from "@/lib/timetable";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const candidates = generateTimetableCandidates({
    userId: body.userId ?? demoUser.id,
    department: body.department ?? demoUser.department,
    grade: Number(body.grade ?? demoUser.grade),
    requiredCourseIds: Array.isArray(body.requiredCourseIds) ? body.requiredCourseIds : [],
    courses,
    personalSchedules: Array.isArray(body.personalSchedules) ? body.personalSchedules : personalSchedules
  });

  return NextResponse.json({ candidates });
}
