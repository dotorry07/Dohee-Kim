import type { ClassSchedule, Course, DayOfWeek, PersonalSchedule, Timetable } from "@/lib/types";

export const dayLabels: Record<DayOfWeek, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금"
};

export const weekdays = Object.keys(dayLabels) as DayOfWeek[];

export const timetableColors = ["#582f82", "#7350a0", "#8b5fbf", "#442363", "#6d3d98", "#9b78c4"];

export function isRemoteClass(item: { lessonTypeName?: string; roomName?: string; buildingName?: string; memo?: string }) {
  const lessonType = item.lessonTypeName?.replace(/\s+/g, "") ?? "";
  const buildingName = item.buildingName?.replace(/\s+/g, "") ?? "";
  const roomName = item.roomName?.replace(/\s+/g, "") ?? "";
  const memo = item.memo?.replace(/\s+/g, "") ?? "";

  return [lessonType, buildingName, roomName, memo].some((value) => value.includes("원격"));
}

export const isRecordedRemoteClass = isRemoteClass;

export function getClassCreditLabel(item: { credits?: string; memo?: string }) {
  const memoParts = item.memo?.split("·") ?? [];
  const credits = getClassCreditValue({ ...item, memoCredit: memoParts[memoParts.length - 1]?.trim() });

  if (credits === null) {
    return "";
  }

  return `${formatCreditValue(credits)}학점`;
}

export function getClassCreditValue(item: { credits?: string; memoCredit?: string }) {
  const rawValue = item.credits?.trim() || item.memoCredit?.trim() || "";
  const normalized = rawValue.replace(/학점$/, "").trim();
  const creditPart = normalized.split("/")[0]?.trim() ?? "";
  const creditNumber = Number(creditPart);

  if (!Number.isFinite(creditNumber)) {
    return null;
  }

  return creditNumber;
}

export function getTotalCreditLabel(classes: { courseId?: string; courseName?: string; professorName?: string; credits?: string; memo?: string }[]) {
  const countedCourseKeys = new Set<string>();
  const totalCredits = classes.reduce((total, item) => {
    const courseKey = item.courseId || [item.courseName, item.professorName, item.memo].filter(Boolean).join("|");

    if (courseKey && countedCourseKeys.has(courseKey)) {
      return total;
    }

    const memoParts = item.memo?.split("·") ?? [];
    const creditValue = getClassCreditValue({ ...item, memoCredit: memoParts[memoParts.length - 1]?.trim() });

    if (courseKey && creditValue !== null) {
      countedCourseKeys.add(courseKey);
    }

    return total + (creditValue ?? 0);
  }, 0);

  return `총 ${formatCreditValue(totalCredits)}학점`;
}

function formatCreditValue(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function isTimeRangeValid(startTime: string, endTime: string) {
  return toMinutes(endTime) > toMinutes(startTime);
}

export function overlaps(
  left: { dayOfWeek: string; startTime: string; endTime: string },
  right: { dayOfWeek: string; startTime: string; endTime: string }
) {
  if (left.dayOfWeek !== right.dayOfWeek) {
    return false;
  }

  return toMinutes(left.startTime) < toMinutes(right.endTime) && toMinutes(right.startTime) < toMinutes(left.endTime);
}

export function hasAnyOverlap<T extends { dayOfWeek: string; startTime: string; endTime: string }>(items: T[]) {
  return items.some((item, index) => items.slice(index + 1).some((next) => overlaps(item, next)));
}

export function getTodayClasses(classes: ClassSchedule[]) {
  const todayIndex = new Date().getDay();
  const todayKey = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][todayIndex];
  return classes
    .filter((item) => item.dayOfWeek === todayKey)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
}

export function generateTimetableCandidates(input: {
  userId: string;
  department: string;
  grade: number;
  requiredCourseIds: string[];
  courses: Course[];
  personalSchedules: PersonalSchedule[];
}) {
  const baseCourses = input.courses
    .filter((course) => course.department === input.department && course.grade === input.grade)
    .filter((course) => course.requiredType === "required" && input.requiredCourseIds.includes(course.id));

  const electives = input.courses
    .filter((course) => course.department === input.department && course.grade === input.grade && course.requiredType === "elective")
    .sort((a, b) => a.courseName.localeCompare(b.courseName, "ko"));

  const combinations = [
    baseCourses,
    [...baseCourses, electives[0]].filter(Boolean),
    [...baseCourses, electives[1]].filter(Boolean)
  ];

  return combinations
    .map((courseSet, index) => toTimetable(input.userId, courseSet, index))
    .filter((candidate) => !hasAnyOverlap(candidate.classes))
    .filter((candidate) => !candidate.classes.some((classItem) => input.personalSchedules.some((schedule) => overlaps(classItem, schedule))))
    .sort((a, b) => b.score - a.score);
}

function toTimetable(userId: string, courseSet: Course[], index: number): Timetable {
  return {
    id: `candidate-${index + 1}`,
    userId,
    semester: "2026-1",
    title: `추천 시간표 ${index + 1}`,
    isSelected: index === 0,
    score: courseSet.length,
    classes: courseSet.map((course, courseIndex) => ({
      id: `candidate-${index + 1}-${course.id}`,
      timetableId: `candidate-${index + 1}`,
      courseId: course.id,
      courseName: course.courseName,
      professorName: course.professorName,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      buildingName: course.buildingName,
      roomName: course.roomName,
      color: timetableColors[courseIndex % timetableColors.length],
      memo: course.requiredType === "required" ? "필수 이수" : "선택 추천"
    })),
    createdAt: new Date().toISOString()
  };
}
