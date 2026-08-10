import { NextRequest, NextResponse } from "next/server";
import { getLocalSungshinCourses, hasLocalSungshinTerm, localSungshinCourses, localSungshinTerms } from "@/lib/sungshin-course-db";

const defaultSemester = "COMM063.20";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const yy = searchParams.get("yy") || "2026";
  const semCd = searchParams.get("semCd") || defaultSemester;
  const query = normalize(searchParams.get("q") || "");
  const term = searchParams.get("term") || toLocalTerm(yy, semCd);
  const category = searchParams.get("category");

  const courses = hasLocalSungshinTerm(term) ? getLocalSungshinCourses(term) : [];
  const categoryFiltered = isKnownCategory(category) ? courses.filter((course) => hasCourseCategory(course, category)) : courses;
  const filtered = query ? categoryFiltered.filter((course) => matchesQuery(course, query)) : categoryFiltered;
  const fallbackCourses = query && !filtered.length ? findCrossTermFallbackCourses(term, category, query) : [];
  const visibleCourses = filtered.length ? filtered : fallbackCourses;

  return NextResponse.json({
    courses: visibleCourses,
    totalCount: courses.length,
    filteredCount: visibleCourses.length,
    exactMatchCount: filtered.length,
    noExactMatch: Boolean(query && courses.length && !filtered.length),
    usedCrossTermFallback: fallbackCourses.length > 0,
    source: "local-db",
    term
  });
}

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function isKnownCategory(value: string | null): value is "major" | "elective" {
  return value === "major" || value === "elective";
}

function findCrossTermFallbackCourses(term: string, category: string | null, query: string) {
  for (const fallbackTerm of [...localSungshinTerms].reverse()) {
    if (fallbackTerm === term) {
      continue;
    }

    const fallbackCourses = localSungshinCourses
      .filter((course) => course.term === fallbackTerm)
      .filter((course) => !isKnownCategory(category) || hasCourseCategory(course, category))
      .filter((course) => matchesQuery(course, query));

    if (fallbackCourses.length) {
      return fallbackCourses;
    }
  }

  return [];
}

function isGemCourse(course: {
  gemYn?: string;
  isGem?: boolean;
  subjectCharacterName?: string;
  characterSubjectAreaName?: string;
  remarkText?: string;
}) {
  return Boolean(course.isGem)
    || course.gemYn?.toUpperCase() === "O"
    || [
      course.subjectCharacterName,
      course.characterSubjectAreaName,
      course.remarkText
    ].some((value) => /gem/i.test(value ?? ""));
}

function hasCourseCategory(course: {
  completionType: string;
  courseTypeName?: string;
  courseCategories?: ("major" | "elective")[];
  gemYn?: string;
  isGem?: boolean;
  subjectCharacterName?: string;
  characterSubjectAreaName?: string;
  remarkText?: string;
}, category: "major" | "elective") {
  if (isGemCourse(course)) {
    return true;
  }

  if (course.courseCategories?.includes(category)) {
    return true;
  }

  const labels = [course.completionType, course.courseTypeName].join(" ");
  return category === "major" ? /전공|major/i.test(labels) : /교양|liberal|general/i.test(labels);
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
  courseTypeName?: string;
  subjectCharacterName?: string;
  subjectAreaName?: string;
  characterSubjectAreaName?: string;
  remarkText?: string;
  gemYn?: string;
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
    course.lessonTypeName,
    course.courseTypeName,
    course.subjectCharacterName,
    course.subjectAreaName,
    course.characterSubjectAreaName,
    course.remarkText,
    course.gemYn
  ].some((value) => normalize(value ?? "").includes(query));
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
