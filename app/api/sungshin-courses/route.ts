import { NextRequest, NextResponse } from "next/server";
import { getLocalSungshinCourses, hasLocalSungshinTerm } from "@/lib/sungshin-course-db";

const defaultSemester = "COMM063.15";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const yy = searchParams.get("yy") || "2026";
  const semCd = searchParams.get("semCd") || defaultSemester;
  const query = normalize(searchParams.get("q") || "");
  const term = searchParams.get("term") || toLocalTerm(yy, semCd);

  const courses = hasLocalSungshinTerm(term) ? getLocalSungshinCourses(term) : [];
  const filtered = query ? courses.filter((course) => matchesQuery(course, query)) : courses;
  const visibleCourses = query && !filtered.length ? courses : filtered;

  return NextResponse.json({
    courses: visibleCourses,
    totalCount: courses.length,
    filteredCount: visibleCourses.length,
    exactMatchCount: filtered.length,
    noExactMatch: Boolean(query && courses.length && !filtered.length),
    source: "local-db",
    term
  });
}

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function matchesQuery(course: {
  courseName: string;
  professorName: string;
  departmentName: string;
  courseCode: string;
  classNumber: string;
  completionType: string;
  scheduleText: string;
  roomText: string;
  campusName: string;
  lessonTypeName: string;
}, query: string) {
  return [
    course.courseName,
    course.professorName,
    course.departmentName,
    course.courseCode,
    course.classNumber,
    course.completionType,
    course.scheduleText,
    course.roomText,
    course.campusName,
    course.lessonTypeName
  ].some((value) => normalize(value).includes(query));
}

function toLocalTerm(yy: string, semCd: string) {
  if (semCd.endsWith(".15")) {
    return `${yy}-summer`;
  }

  if (semCd.endsWith(".20")) {
    return `${yy}-2`;
  }

  if (semCd.endsWith(".25")) {
    return `${yy}-winter`;
  }

  return `${yy}-1`;
}
