"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { courses } from "@/lib/data";
import { sungshinDepartments } from "@/lib/sungshin-departments";
import { dayLabels, isRecordedRemoteClass, overlaps, timetableColors, toMinutes, weekdays } from "@/lib/timetable";
import { loadRemoteTimetables, saveRemoteTimetable } from "@/lib/timetable-storage";
import { TimetableSelect } from "../TimetableSelect";
import styles from "../SwipeNotice.module.css";
import type { ClassSchedule, Course, DayOfWeek, PersonalSchedule, Timetable, UserProfile } from "@/lib/types";

const savedTimetablesKey = "newbie-on:timetables";
const emptyPersonalSchedules: PersonalSchedule[] = [];
const plannerHours = Array.from({ length: 12 }, (_, index) => 9 + index);
const plannerStartMinutes = plannerHours[0] * 60;
const plannerEndMinutes = (plannerHours[plannerHours.length - 1] + 1) * 60;
const plannerMinuteStep = 30;
const periodTimes: Record<number, { start: string; end: string }> = {
  1: { start: "09:00", end: "09:50" },
  2: { start: "10:00", end: "10:50" },
  3: { start: "11:00", end: "11:50" },
  4: { start: "12:00", end: "12:50" },
  5: { start: "13:00", end: "13:50" },
  6: { start: "14:00", end: "14:50" },
  7: { start: "15:00", end: "15:50" },
  8: { start: "16:00", end: "16:50" },
  9: { start: "17:00", end: "17:50" },
  10: { start: "18:00", end: "18:50" },
  11: { start: "19:00", end: "19:50" },
  12: { start: "20:00", end: "20:50" },
  13: { start: "21:00", end: "21:50" },
  14: { start: "22:00", end: "22:50" }
};
const dayNameToKey: Record<string, DayOfWeek> = {
  월: "MON",
  화: "TUE",
  수: "WED",
  목: "THU",
  금: "FRI"
};

interface SungshinCourse {
  id: string;
  term: string;
  departmentName: string;
  courseCode: string;
  courseName: string;
  classNumber: string;
  completionType: string;
  credits: string;
  scheduleText: string;
  roomText: string;
  professorName: string;
  campusName: string;
  lessonTypeName: string;
  courseTypeName?: string;
  subjectCharacterName?: string;
  subjectAreaName?: string;
  characterSubjectAreaName?: string;
  remarkText?: string;
  gemYn?: string;
  isGem?: boolean;
  courseCategories?: ("major" | "elective")[];
}

interface SungshinCourseResponse {
  courses: SungshinCourse[];
  totalCount: number;
  filteredCount: number;
  exactMatchCount?: number;
  noExactMatch?: boolean;
}

interface PersonalDragSelection {
  dayOfWeek: DayOfWeek;
  anchorMinutes: number;
  currentMinutes: number;
}

interface PendingPersonalSchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

interface RequiredCourseTimeOption {
  id: string;
  courseName: string;
  courseCode: string;
  professorName: string;
  scheduleText: string;
  campusName: string;
  lessonTypeName: string;
  roomLabel: string;
  count: number;
  course: SungshinCourse;
}

interface TimetableEditDraft {
  title: string;
  semester: string;
  classes: ClassSchedule[];
  personalSchedules: PersonalSchedule[];
  selectedRequiredCourseIds: string[];
  selectedMajorDepartments?: string[];
  selectedMajorGrade?: string;
  selectedMajorTrack?: MajorTrack;
}

type PlannerStep = "classes" | "personal" | "recommendations";
type MajorTrack = "primary" | "minor" | "double";
type ElectivePreference = "no-consecutive" | "no-first-period" | "needs-free-day" | "remote-only";

const yearOptions = [2026, 2025, 2024, 2023];
const gradeOptions = [1, 2, 3, 4].map((item) => ({ value: String(item), label: `${item}학년` }));
const majorTrackOptions: { value: MajorTrack; label: string }[] = [
  { value: "primary", label: "주전공" },
  { value: "minor", label: "부전공" },
  { value: "double", label: "복수전공" }
];
const plannerSteps: { id: PlannerStep; label: string }[] = [
  { id: "classes", label: "수업 선택" },
  { id: "personal", label: "개인 일정 선택" },
  { id: "recommendations", label: "추천 교양 목록" }
];
const semesterOptions = [
  { value: "winter", label: "겨울 계절학기" },
  { value: "2", label: "2학기" },
  { value: "summer", label: "여름 계절학기" },
  { value: "1", label: "1학기" }
] as const;
const electiveAreaOptions = ["인식과가치", "문학과예술", "사회의이해", "자연의설명", "공학과기술", "도전과실천"] as const;
type ElectiveArea = (typeof electiveAreaOptions)[number];
const electivePreferenceOptions: { value: ElectivePreference; label: string }[] = [
  { value: "no-consecutive", label: "연강시러" },
  { value: "no-first-period", label: "1교시 시러" },
  { value: "needs-free-day", label: "공강필요" },
  { value: "remote-only", label: "원격조아" }
];
const supportedSemesterOrder = ["1", "summer", "2", "winter"] as const;
const currentSemester = "2026-2";
const localSemesterRangeLabel = "2023년 1학기 - 2026년 2학기";
const criticalThinkingCourseName = "비판적 사고와 토론";
const creativeWritingCourseName = "창조적 사고와 글쓰기";
const majorCareerCourseName = "전공별 진로 탐색";
const professorMergedRequiredCourses = [criticalThinkingCourseName, creativeWritingCourseName];
const commonRequiredCourses = [...professorMergedRequiredCourses, majorCareerCourseName];
const sectionMergedRequiredCourses = commonRequiredCourses;
const defaultRequiredCourses = ["파이썬프로그래밍", "기초통계학", "미적분과 벡터해석 기초"];
const requiredCourseAliases: Record<string, string[]> = {
  기초통계학: ["기초통계학", "기초통계실습", "기초통계", "기초 통계학"],
  "일반화학 Ⅰ": ["일반화학 Ⅰ", "일반화학 I", "일반화학 1"],
  "일반화학 Ⅱ": ["일반화학 Ⅱ", "일반화학 II", "일반화학 2"],
  "일반생물학 Ⅰ": ["일반생물학 Ⅰ", "일반생물학 I", "일반생물학 1"],
  "일반생물학 Ⅱ": ["일반생물학 Ⅱ", "일반생물학 II", "일반생물학 2"],
  "일반물리학 Ⅰ": ["일반물리학 Ⅰ", "일반물리학 I", "일반물리학 1"]
};
const secondSemesterCommonCourseAllocations: Record<string, { courseName: string; scheduleText: string; campusName: string }> = Object.fromEntries([
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "월/1-2", "수정", ["영어영문학과", "법학부", "융합보안공학과"]),
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "월/4-5", "수정", ["창의융합학부", "일본어문·문화학과", "독일어문·문화학과", "프랑스어문·문화학과"]),
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "수/1-2", "수정", ["유아교육과", "한문교육과", "국어국문학과", "사학과"]),
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "수/11-12", "수정", ["경영학과 재직자반"]),
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "금/1-2", "수정", ["AI융합학부", "컴퓨터공학과", "서비스디자인공학과"]),
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "금/4-5", "수정", ["교육학과", "사회교육과", "윤리교육과"]),
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "금/1-2", "운정", ["바이오식품공학과", "청정신소재공학과", "화학·에너지융합학부"]),
  ...createCommonCourseAllocationEntries(creativeWritingCourseName, "금/4-5", "운정", ["바이오신약의과학부", "바이오헬스융합학부"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "월/1-2", "수정", ["경제학과", "심리학과", "지리학과", "정치외교학과", "미디어커뮤니케이션학과"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "월/4-5", "수정", ["경영학과"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "수/1-2", "수정", ["수리통계데이터사이언스학부"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "금/1-2", "수정", ["중국어문·문화학과", "스포츠과학부", "기악과", "성악과", "작곡과"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "금/4-5", "수정", ["동양화과", "서양화과", "공예과", "조소과", "디자인과"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "월/1-2", "운정", ["사회복지학과", "현대실용음악학과"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "월/4-5", "운정", ["미디어영상연기학과", "문화예술경영학과", "무용예술학과"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "금/1-2", "운정", ["의류산업학과", "뷰티산업학과", "소비자산업학과"]),
  ...createCommonCourseAllocationEntries(criticalThinkingCourseName, "금/4-5", "운정", ["간호학과"])
]);
const departmentRequiredCourses: Record<string, string[]> = {
  수리통계데이터사이언스학부: defaultRequiredCourses,
  서비스디자인공학과: defaultRequiredCourses,
  융합보안공학과: defaultRequiredCourses,
  컴퓨터공학과: defaultRequiredCourses,
  AI융합학부: defaultRequiredCourses,
  "화학·에너지융합학부": ["미적분과 벡터해석 기초", "일반화학 Ⅰ", "일반화학 Ⅱ"],
  화학과: ["미적분과 벡터해석 기초", "일반화학 Ⅰ", "일반화학 Ⅱ"],
  바이오헬스융합학부: ["일반화학 Ⅰ", "일반생물학 Ⅰ"],
  청정신소재공학과: ["일반화학 Ⅰ", "일반화학 Ⅱ", "일반물리학 Ⅰ"],
  "청정융합에너지공학과": ["일반화학 Ⅰ", "일반화학 Ⅱ", "일반물리학 Ⅰ"],
  바이오식품공학과: ["미적분과 벡터해석 기초", "일반화학 Ⅰ", "일반생물학 Ⅰ"],
  식품영양학과: ["미적분과 벡터해석 기초", "일반화학 Ⅰ", "일반생물학 Ⅰ"],
  식품영양학: ["미적분과 벡터해석 기초", "일반화학 Ⅰ", "일반생물학 Ⅰ"],
  바이오생명공학과: ["일반화학 Ⅰ", "일반생물학 Ⅰ", "일반생물학 Ⅱ"],
  바이오신약의과학부: ["일반화학 Ⅰ", "일반생물학 Ⅰ", "일반생물학 Ⅱ"],
  글로벌의과학과: ["일반화학 Ⅰ", "일반생물학 Ⅰ", "일반생물학 Ⅱ"]
};

export default function TimetableEditPage() {
  return (
    <AuthGuard>
      {(user) => <TimetableEditWorkspace user={user} />}
    </AuthGuard>
  );
}

function parseSungshinCourse(
  course: SungshinCourse,
  colorOffset: number,
  options?: { idPrefix?: string; memo?: string }
): ClassSchedule[] {
  const roomParts = splitRoomText(course);
  const idPrefix = options?.idPrefix ?? "sungshin";

  return course.scheduleText.split(",").reduce<ClassSchedule[]>((items, part, index) => {
      const match = part.trim().match(/^([월화수목금])\/(\d+)(?:-(\d+))?$/);

      if (!match) {
        return items;
      }

      const dayOfWeek = dayNameToKey[match[1]];
      const startPeriod = Number(match[2]);
      const endPeriod = Number(match[3] ?? match[2]);
      const startTime = periodTimes[startPeriod]?.start;
      const endTime = periodTimes[endPeriod]?.end;

      if (!dayOfWeek || !startTime || !endTime) {
        return items;
      }

      items.push({
        id: `${idPrefix}-${course.id}-${index}`,
        timetableId: "draft",
        courseId: course.courseCode,
        courseName: course.courseName,
        professorName: course.professorName,
        dayOfWeek,
        startTime,
        endTime,
        buildingName: roomParts.buildingName,
        roomName: roomParts.roomName,
        lessonTypeName: course.lessonTypeName,
        color: timetableColors[(colorOffset + index) % timetableColors.length],
        memo: options?.memo ?? `${course.departmentName} · ${course.completionType} · ${course.credits}`.trim()
      });
      return items;
    }, []);
}

function splitRoomText(course: SungshinCourse) {
  const trimmed = course.roomText.trim();

  if (!trimmed) {
    return {
      buildingName: isRecordedRemoteClass(course) ? "원격강의" : "강의실 미정",
      roomName: ""
    };
  }

  const [buildingName, ...rest] = trimmed.split(/\s+/);
  return {
    buildingName,
    roomName: rest.join(" ")
  };
}

function getCourseRoomLabel(course: SungshinCourse) {
  return course.roomText.trim() || (isRecordedRemoteClass(course) ? "원격강의" : "강의실 미정");
}

function normalizeElectiveAreaName(value?: string) {
  return (value ?? "").replace(/\s+/g, "");
}

function getElectiveAreaName(course: SungshinCourse) {
  const areaName = normalizeElectiveAreaName(course.characterSubjectAreaName) || normalizeElectiveAreaName(course.subjectAreaName);
  return electiveAreaOptions.find((option) => normalizeElectiveAreaName(option) === areaName) ?? "";
}

function matchesElectivePreferences(
  course: SungshinCourse,
  preferences: ElectivePreference[],
  classes: ClassSchedule[],
  personalSchedules: PersonalSchedule[]
) {
  if (!preferences.length) {
    return true;
  }

  const parsedClasses = parseSungshinCourse(course, 0);
  const isRemote = !parsedClasses.length || parsedClasses.every(isRecordedRemoteClass);

  if (preferences.includes("remote-only")) {
    return isRemote;
  }

  if (isRemote) {
    return true;
  }

  if (preferences.includes("no-first-period") && parsedClasses.some((item) => item.startTime === periodTimes[1].start)) {
    return false;
  }

  if (preferences.includes("no-consecutive") && parsedClasses.some((item) => hasAdjacentClass(item, classes))) {
    return false;
  }

  if (preferences.includes("needs-free-day") && !keepsAtLeastOneFreeDay(parsedClasses, classes, personalSchedules)) {
    return false;
  }

  return true;
}

function hasAdjacentClass(classItem: ClassSchedule, classes: ClassSchedule[]) {
  const start = toMinutes(classItem.startTime);
  const end = toMinutes(classItem.endTime);

  return classes.some((item) => (
    !isRecordedRemoteClass(item)
    && item.dayOfWeek === classItem.dayOfWeek
    && (toMinutes(item.endTime) === start || toMinutes(item.startTime) === end)
  ));
}

function keepsAtLeastOneFreeDay(newClasses: ClassSchedule[], classes: ClassSchedule[], personalSchedules: PersonalSchedule[]) {
  const busyDays = new Set<string>();

  [...classes, ...newClasses].forEach((item) => {
    if (!isRecordedRemoteClass(item)) {
      busyDays.add(item.dayOfWeek);
    }
  });

  personalSchedules.forEach((item) => {
    busyDays.add(item.dayOfWeek);
  });

  return weekdays.some((day) => !busyDays.has(day));
}

function getClassScheduleLabel(item: ClassSchedule) {
  return [
    dayLabels[item.dayOfWeek],
    `${item.startTime}-${item.endTime}`,
    [item.buildingName, item.roomName].filter(Boolean).join(" ")
  ].filter(Boolean).join(" · ");
}

function getSelectedRequiredCourseNames(classes: ClassSchedule[], requiredCourses: string[]) {
  return classes
    .map((item) => item.courseName)
    .map((courseName) => getRequiredCourseDisplayName(courseName, requiredCourses))
    .filter((courseName, index, names) => requiredCourses.includes(courseName) && names.indexOf(courseName) === index);
}

function classMatchesRequiredCourseName(classItem: ClassSchedule, courseName: string, requiredCourses: string[]) {
  return getRequiredCourseDisplayName(classItem.courseName, requiredCourses) === courseName;
}

function classMatchesParsedSchedule(classItem: ClassSchedule, parsedItem: ClassSchedule) {
  return classItem.courseName === parsedItem.courseName
    && classItem.professorName === parsedItem.professorName
    && classItem.dayOfWeek === parsedItem.dayOfWeek
    && classItem.startTime === parsedItem.startTime
    && classItem.endTime === parsedItem.endTime;
}

function classMatchesSungshinCourse(classItem: ClassSchedule, course: SungshinCourse) {
  return parseSungshinCourse(course, 0).some((parsedClass) => classMatchesParsedSchedule(classItem, parsedClass));
}

function getClassMemoDepartment(classItem: ClassSchedule) {
  const [departmentName] = (classItem.memo ?? "").split("·").map((item) => item.trim()).filter(Boolean);
  return departmentName ?? "";
}

function matchesSelectedMajorGrade(course: SungshinCourse, selectedGrade: string) {
  const areaGrade = course.subjectAreaName?.match(/([1-4])\s*영역/)?.[1];

  if (!areaGrade) {
    return true;
  }

  return areaGrade === selectedGrade;
}

function getRequiredClassId(courseName: string) {
  return `required-common-${courseName}`;
}

function getRequiredOptionId(course: SungshinCourse, displayCourseName = course.courseName) {
  if (!sectionMergedRequiredCourses.includes(displayCourseName)) {
    return `${displayCourseName}-${course.id}-${course.classNumber}`;
  }

  return `${displayCourseName}-${course.courseCode}-${course.scheduleText}-${course.campusName}`;
}

function createCommonCourseAllocationEntries(courseName: string, scheduleText: string, campusName: string, departments: string[]) {
  return departments.map((department) => [department, { courseName, scheduleText, campusName }] as const);
}

function getCommonRequiredCoursesForSemester(semester: string) {
  const { semesterPart } = splitSemester(semester);
  return semesterPart === "1" ? commonRequiredCourses : professorMergedRequiredCourses;
}

function getRequiredCoursesForDepartment(department: string, semester: string) {
  return Array.from(new Set([...getCommonRequiredCoursesForSemester(semester), ...(departmentRequiredCourses[department] ?? [])]));
}

function getRequiredCourseSearchNames(courseName: string) {
  return requiredCourseAliases[courseName] ?? [courseName];
}

function getRequiredCourseDisplayName(courseName: string, requiredCourses: string[]) {
  return requiredCourses.find((requiredCourse) => getRequiredCourseSearchNames(requiredCourse).includes(courseName)) ?? courseName;
}

function getScheduleSortKey(scheduleText: string) {
  const dayOrder: Record<string, number> = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 };
  const match = scheduleText.trim().match(/^([월화수목금])\/(\d+)/);

  if (!match) {
    return { day: 99, period: 99 };
  }

  return {
    day: dayOrder[match[1]] ?? 99,
    period: Number(match[2])
  };
}

function getSecondSemesterCommonCourseAllocation(department: string, courseName: string, semester: string) {
  if (semester !== "2026-2" || !professorMergedRequiredCourses.includes(courseName)) {
    return null;
  }

  const allocation = secondSemesterCommonCourseAllocations[department];
  return allocation?.courseName === courseName ? allocation : null;
}

function toAllocatedRequiredCourse(course: SungshinCourse, courseName: string, department: string, semester: string) {
  if (!professorMergedRequiredCourses.includes(courseName)) {
    return course.scheduleText.trim() ? course : null;
  }

  if (semester !== "2026-2") {
    return course.scheduleText.trim() ? course : null;
  }

  const allocation = getSecondSemesterCommonCourseAllocation(department, courseName, semester);

  if (!allocation) {
    return null;
  }

  return {
    ...course,
    courseName: allocation.courseName,
    scheduleText: allocation.scheduleText,
    campusName: allocation.campusName
  };
}

function getRequiredCourseOptions(courses: SungshinCourse[], requiredCourses: string[], department: string, semester: string) {
  const grouped = new Map<string, RequiredCourseTimeOption>();
  const searchableNames = new Set(requiredCourses.flatMap(getRequiredCourseSearchNames));
  const uniqueCourses = [...new Map(courses.map((course) => [course.id, course])).values()]
    .filter((course) => searchableNames.has(course.courseName));
  const preferredCourses = requiredCourses.flatMap((requiredCourse) => {
    const aliases = getRequiredCourseSearchNames(requiredCourse);
    const matches = uniqueCourses.filter((course) => aliases.includes(course.courseName));
    const sameTermMatches = matches.filter((course) => course.term === semester);
    return sameTermMatches.length ? sameTermMatches : matches;
  });

  preferredCourses
    .forEach((course) => {
      const courseName = getRequiredCourseDisplayName(course.courseName, requiredCourses);
      const allocatedCourse = toAllocatedRequiredCourse(course, courseName, department, semester);

      if (!allocatedCourse) {
        return;
      }

      const shouldMergeSections = sectionMergedRequiredCourses.includes(courseName);
      const key = getRequiredOptionId(allocatedCourse, courseName);
      const previous = grouped.get(key);

      if (shouldMergeSections && previous) {
        grouped.set(key, {
          ...previous,
          count: previous.count + 1,
          professorName: previous.professorName === course.professorName ? previous.professorName : "",
          roomLabel: previous.roomLabel === getCourseRoomLabel(allocatedCourse) ? previous.roomLabel : "분반별 강의실 상이"
        });
        return;
      }

      grouped.set(key, {
        id: key,
        courseName,
        courseCode: allocatedCourse.courseCode,
        professorName: course.professorName,
        scheduleText: allocatedCourse.scheduleText,
        campusName: allocatedCourse.campusName,
        lessonTypeName: allocatedCourse.lessonTypeName,
        roomLabel: getCourseRoomLabel(allocatedCourse),
        count: 1,
        course: allocatedCourse
      });
    });

  return [...grouped.values()].sort((left, right) => {
    if (left.courseName !== right.courseName) {
      return requiredCourses.indexOf(left.courseName) - requiredCourses.indexOf(right.courseName);
    }

    if (professorMergedRequiredCourses.includes(left.courseName)) {
      const leftSchedule = getScheduleSortKey(left.scheduleText);
      const rightSchedule = getScheduleSortKey(right.scheduleText);

      return leftSchedule.day - rightSchedule.day
        || leftSchedule.period - rightSchedule.period
        || left.scheduleText.localeCompare(right.scheduleText, "ko");
    }

    return left.scheduleText.localeCompare(right.scheduleText, "ko");
  });
}

function toSungshinSemesterCode(semester: string) {
  const normalized = semester.trim();

  if (normalized.endsWith("-1")) {
    return "COMM063.10";
  }

  if (normalized.endsWith("-2")) {
    return "COMM063.20";
  }

  if (normalized.endsWith("-summer") || normalized.includes("여름")) {
    return "COMM063.15";
  }

  if (normalized.endsWith("-winter") || normalized.includes("겨울")) {
    return "COMM063.25";
  }

  return "COMM063.10";
}

function splitSemester(semester: string) {
  const [defaultYear, defaultSemesterPart] = currentSemester.split("-");
  const [year = defaultYear, semesterPart = defaultSemesterPart] = semester.split("-");
  return {
    year: yearOptions.includes(Number(year)) ? year : defaultYear,
    semesterPart: supportedSemesterOrder.includes(semesterPart as (typeof supportedSemesterOrder)[number]) ? semesterPart : defaultSemesterPart
  };
}

function normalizeSupportedSemester(semester: string) {
  const selected = splitSemester(semester);
  const options = getAvailableSemesterOptions(selected.year);
  const semesterPart = options.some((option) => option.value === selected.semesterPart) ? selected.semesterPart : options[0].value;
  return joinSemester(selected.year, semesterPart);
}

function joinSemester(year: string, semesterPart: string) {
  return `${year}-${semesterPart}`;
}

function getSemesterLabel(semester: string) {
  const selected = splitSemester(semester);
  const semesterLabel = semesterOptions.find((option) => option.value === selected.semesterPart)?.label ?? "1학기";
  return `${selected.year}년 ${semesterLabel}`;
}

function getAvailableSemesterOptions(year: string) {
  if (year === "2026") {
    return semesterOptions.filter((option) => option.value === "1" || option.value === "summer" || option.value === "2");
  }

  return semesterOptions;
}

function normalizeMajorDepartments(departments: string[], primaryDepartment: string) {
  return Array.from(new Set([primaryDepartment, ...departments].filter(Boolean)));
}

function isDraft(value: unknown): value is TimetableEditDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<TimetableEditDraft>;
  return typeof draft.title === "string" && typeof draft.semester === "string" && Array.isArray(draft.classes) && Array.isArray(draft.personalSchedules);
}

function getUniqueTimetableTitle(baseTitle: string, timetables: Timetable[], currentIds: string[]) {
  const currentIdSet = new Set(currentIds.filter(Boolean));
  const existingTitles = new Set(
    timetables
      .filter((item) => !currentIdSet.has(item.id))
      .map((item) => item.title.trim())
      .filter(Boolean)
  );

  if (!existingTitles.has(baseTitle)) {
    return baseTitle;
  }

  let suffix = 1;
  let nextTitle = `${baseTitle}(${suffix})`;

  while (existingTitles.has(nextTitle)) {
    suffix += 1;
    nextTitle = `${baseTitle}(${suffix})`;
  }

  return nextTitle;
}

function TimetableEditWorkspace({ user }: { user: UserProfile }) {
  const userId = user.id;
  const department = user.department;
  const grade = user.grade;
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const initialTitle = searchParams.get("title");
  const initialSemester = searchParams.get("semester");
  const draftStorageKey = `newbie-on:timetable-edit-draft:${editingId ?? `${initialTitle ?? "new"}:${initialSemester ?? currentSemester}`}`;
  const [title, setTitle] = useState("새 시간표");
  const [semester, setSemester] = useState(currentSemester);
  const selectedSemester = splitSemester(semester);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [personalSchedules, setPersonalSchedules] = useState<PersonalSchedule[]>(emptyPersonalSchedules);
  const [selectedRequiredCourseIds, setSelectedRequiredCourseIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [selectedMajorTrack, setSelectedMajorTrack] = useState<MajorTrack>("primary");
  const [selectedMajorDepartments, setSelectedMajorDepartments] = useState<string[]>([department]);
  const [selectedMajorGrade, setSelectedMajorGrade] = useState(String(grade));
  const [majorDepartmentToAdd, setMajorDepartmentToAdd] = useState("");
  const [sungshinCourses, setSungshinCourses] = useState<SungshinCourse[]>([]);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [electiveCourses, setElectiveCourses] = useState<SungshinCourse[]>([]);
  const [selectedElectiveAreas, setSelectedElectiveAreas] = useState<string[]>([...electiveAreaOptions]);
  const [selectedElectivePreferences, setSelectedElectivePreferences] = useState<ElectivePreference[]>([]);
  const [isElectiveCourseLoading, setIsElectiveCourseLoading] = useState(false);
  const [requiredCourseOptions, setRequiredCourseOptions] = useState<RequiredCourseTimeOption[]>([]);
  const [isRequiredCourseLoading, setIsRequiredCourseLoading] = useState(false);
  const [isRemoteTimetableLoading, setIsRemoteTimetableLoading] = useState(false);
  const [isInitialPageLoading, setIsInitialPageLoading] = useState(true);
  const [isDatabaseLoadingVisible, setIsDatabaseLoadingVisible] = useState(true);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);
  const [courseConflictNotice, setCourseConflictNotice] = useState("");
  const [pendingSemester, setPendingSemester] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<PlannerStep>("classes");
  const isSavingTimetableRef = useRef(false);
  const isDatabaseLoading = isInitialPageLoading || isRequiredCourseLoading || isCourseLoading || isElectiveCourseLoading || isRemoteTimetableLoading;
  const requiredCourses = useMemo(() => getRequiredCoursesForDepartment(department, semester), [department, semester]);
  const activeStepIndex = plannerSteps.findIndex((step) => step.id === activeStep);
  const majorDepartmentOptions = useMemo(
    () => [
      { value: "", label: `${selectedMajorTrack === "minor" ? "부전공" : "복수전공"} 학과 선택` },
      ...sungshinDepartments
        .filter((item) => item !== department)
        .map((item) => ({ value: item, label: item }))
    ],
    [department, selectedMajorTrack]
  );
  const requiredCourseOptionsByName = useMemo(
    () => requiredCourses
      .map((courseName) => ({
        courseName,
        options: requiredCourseOptions.filter((option) => option.courseName === courseName)
      }))
      .filter(({ options }) => options.length > 0),
    [requiredCourseOptions, requiredCourses]
  );
  const visibleRequiredCourseNames = useMemo(
    () => new Set(requiredCourseOptionsByName.map(({ courseName }) => courseName)),
    [requiredCourseOptionsByName]
  );
  const visibleElectiveCourses = useMemo(
    () => electiveCourses
      .filter((course) => !isOwnDepartmentGemCourse(course))
      .filter((course) => !isRequiredElectiveCourse(course))
      .filter((course) => !isSungshinCourseSelected(course))
      .filter((course) => {
        return selectedElectiveAreas.length === electiveAreaOptions.length || selectedElectiveAreas.includes(getElectiveAreaName(course));
      })
      .filter((course) => {
        return matchesElectivePreferences(course, selectedElectivePreferences, classes, personalSchedules);
      })
      .filter((course) => !sungshinCourseConflictsWithSchedule(course)),
    [classes, department, electiveCourses, personalSchedules, requiredCourses, selectedElectiveAreas, selectedElectivePreferences]
  );
  const selectedSungshinElectiveCourses = useMemo(
    () => electiveCourses
      .filter((course) => !isOwnDepartmentGemCourse(course))
      .filter((course) => !isRequiredElectiveCourse(course))
      .filter(isSungshinCourseSelected)
      .sort((left, right) => (
        Number(Boolean(right.isGem)) - Number(Boolean(left.isGem))
        || left.courseName.localeCompare(right.courseName, "ko")
        || left.classNumber.localeCompare(right.classNumber, "ko")
      )),
    [classes, electiveCourses, department, requiredCourses]
  );
  const selectedExistingElectiveClasses = useMemo(
    () => classes.filter((item) => (
      isClassShownAsSelectedElective(item)
      && !selectedSungshinElectiveCourses.some((course) => classMatchesSungshinCourse(item, course))
    )),
    [classes, requiredCourses, selectedSungshinElectiveCourses]
  );
  const recommendedElectiveCourses = useMemo(
    () => {
      const selectableCourses = courses
        .filter((course) => course.requiredType === "elective")
        .filter((course) => isRecommendedCourseSelected(course) || !courseConflictsWithSchedule(course))
        .sort((left, right) => (
          Number(isRecommendedCourseSelected(right)) - Number(isRecommendedCourseSelected(left))
          || left.courseName.localeCompare(right.courseName, "ko")
        ));
      const selectedCourses = selectableCourses.filter(isRecommendedCourseSelected);
      const unselectedCourses = selectableCourses.filter((course) => !isRecommendedCourseSelected(course));

      return [
        ...selectedCourses,
        ...unselectedCourses.slice(0, Math.max(0, 6 - selectedCourses.length))
      ];
    },
    [classes, personalSchedules]
  );
  const selectedElectiveClasses = useMemo(
    () => {
      const selectedRecommendedIds = new Set(
        recommendedElectiveCourses
          .filter(isRecommendedCourseSelected)
          .map((course) => `required-${course.id}`)
      );
      const selectedSungshinPrefixes = electiveCourses
        .filter(isSungshinCourseSelected)
        .map(getSungshinClassIdPrefix);
      const selectedClassMap = new Map<string, ClassSchedule>();

      classes.forEach((item) => {
        if (
          item.memo?.includes("교양")
          || selectedRecommendedIds.has(item.id)
          || selectedSungshinPrefixes.some((prefix) => item.id.startsWith(prefix))
        ) {
          selectedClassMap.set(item.id, item);
        }
      });

      return Array.from(selectedClassMap.values());
    },
    [classes, electiveCourses, recommendedElectiveCourses]
  );
  const selectedElectiveDisplayCount = selectedSungshinElectiveCourses.length + selectedExistingElectiveClasses.length;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsInitialPageLoading(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (isDatabaseLoading) {
      setIsDatabaseLoadingVisible(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsDatabaseLoadingVisible(false);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isDatabaseLoading]);

  useEffect(() => {
    let nextTitle = "새 시간표";
    let nextSemester = currentSemester;
    let nextClasses: ClassSchedule[] = [];
    let nextPersonalSchedules: PersonalSchedule[] = emptyPersonalSchedules;
    let nextSelectedRequiredCourseIds: string[] = [];
    let nextSelectedMajorDepartments = [department];
    let nextSelectedMajorGrade = String(grade);
    let nextSelectedMajorTrack: MajorTrack = "primary";

    if (!editingId && initialTitle?.trim()) {
      nextTitle = initialTitle.trim();
    }

    if (!editingId && initialSemester?.trim()) {
      nextSemester = normalizeSupportedSemester(initialSemester);
    }

    if (editingId) {
      const saved = window.localStorage.getItem(savedTimetablesKey);
      let savedTimetables: Timetable[] = [];

      try {
        savedTimetables = saved ? (JSON.parse(saved) as Timetable[]) : [];
      } catch {
        savedTimetables = [];
      }

      const existing = savedTimetables.find((item) => item.id === editingId);

      if (!existing) {
        setError("수정할 시간표를 찾을 수 없습니다.");
      } else {
        nextTitle = existing.title;
        nextSemester = normalizeSupportedSemester(existing.semester);
        nextClasses = existing.classes;
        nextPersonalSchedules = existing.personalSchedules ?? emptyPersonalSchedules;
        nextSelectedRequiredCourseIds = getSelectedRequiredCourseNames(existing.classes, requiredCourses);
      }
    }

    const savedDraft = window.localStorage.getItem(draftStorageKey);

    try {
      const parsedDraft = savedDraft ? JSON.parse(savedDraft) : null;
      if (isDraft(parsedDraft)) {
        nextTitle = parsedDraft.title;
        nextSemester = normalizeSupportedSemester(parsedDraft.semester);
        nextClasses = parsedDraft.classes;
        nextPersonalSchedules = parsedDraft.personalSchedules;
        nextSelectedRequiredCourseIds = (parsedDraft.selectedRequiredCourseIds ?? []).filter((courseName) => requiredCourses.includes(courseName));
        nextSelectedMajorDepartments = normalizeMajorDepartments(parsedDraft.selectedMajorDepartments ?? [department], department);
        nextSelectedMajorGrade = parsedDraft.selectedMajorGrade ?? String(grade);
        nextSelectedMajorTrack = parsedDraft.selectedMajorTrack ?? (nextSelectedMajorDepartments[0] === department ? "primary" : "minor");
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }

    nextClasses = nextClasses.filter((item) => !item.id.startsWith("required-common-") || requiredCourses.includes(item.courseName));
    nextSelectedRequiredCourseIds = Array.from(new Set([
      ...nextSelectedRequiredCourseIds,
      ...getSelectedRequiredCourseNames(nextClasses, requiredCourses)
    ]));

    setTitle(nextTitle);
    setSemester(nextSemester);
    setClasses(nextClasses);
    setPersonalSchedules(nextPersonalSchedules);
    setSelectedRequiredCourseIds(nextSelectedRequiredCourseIds);
    setSelectedMajorTrack(nextSelectedMajorTrack);
    setSelectedMajorDepartments(nextSelectedMajorDepartments);
    setMajorDepartmentToAdd(nextSelectedMajorTrack === "primary" ? "" : nextSelectedMajorDepartments[0] ?? "");
    setSelectedMajorGrade(nextSelectedMajorGrade);
    setIsDraftReady(true);
  }, [department, draftStorageKey, editingId, grade, initialSemester, initialTitle, requiredCourses]);

  useEffect(() => {
    if (!editingId || window.localStorage.getItem(draftStorageKey)) {
      return;
    }

    let isActive = true;

    async function loadRemoteEditingTimetable() {
      setIsRemoteTimetableLoading(true);

      try {
        const remoteTimetables = await loadRemoteTimetables(user);
        const existing = remoteTimetables?.find((item) => item.id === editingId);

        if (!isActive || !existing) {
          return;
        }

        setTitle(existing.title);
        setSemester(normalizeSupportedSemester(existing.semester));
        setClasses(existing.classes);
        setPersonalSchedules(existing.personalSchedules ?? emptyPersonalSchedules);
        setSelectedRequiredCourseIds(getSelectedRequiredCourseNames(existing.classes, requiredCourses));
        setError("");
      } catch {
        if (isActive) {
          setError("Supabase에서 수정할 시간표를 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) {
          setIsRemoteTimetableLoading(false);
        }
      }
    }

    void loadRemoteEditingTimetable();

    return () => {
      isActive = false;
    };
  }, [draftStorageKey, editingId, requiredCourses, user]);

  useEffect(() => {
    if (!isDraftReady) {
      return;
    }

    const draft: TimetableEditDraft = {
      title,
      semester,
      classes,
      personalSchedules,
      selectedRequiredCourseIds,
      selectedMajorDepartments,
      selectedMajorGrade,
      selectedMajorTrack
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [classes, draftStorageKey, isDraftReady, personalSchedules, selectedMajorDepartments, selectedMajorGrade, selectedMajorTrack, selectedRequiredCourseIds, semester, title]);

  useEffect(() => {
    if (!isDraftReady) {
      return;
    }

    async function loadRequiredCourses() {
      if (!requiredCourses.length) {
        setRequiredCourseOptions([]);
        setIsRequiredCourseLoading(false);
        return;
      }

      setIsRequiredCourseLoading(true);

      try {
        const responses = await Promise.all(requiredCourses.flatMap(getRequiredCourseSearchNames).map(async (courseName) => {
          const params = new URLSearchParams({
            q: courseName,
            yy: selectedSemester.year,
            semCd: toSungshinSemesterCode(semester),
            term: semester
          });
          const response = await fetch(`/api/sungshin-courses?${params.toString()}`);

          if (!response.ok) {
            throw new Error("request failed");
          }

          return response.json() as Promise<SungshinCourseResponse>;
        }));

        setRequiredCourseOptions(getRequiredCourseOptions(responses.flatMap((response) => response.courses), requiredCourses, department, semester));
      } catch {
        setRequiredCourseOptions([]);
      } finally {
        setIsRequiredCourseLoading(false);
      }
    }

    void loadRequiredCourses();
  }, [department, isDraftReady, selectedSemester.year, semester, requiredCourses]);

  useEffect(() => {
    if (!isDraftReady || isRequiredCourseLoading) {
      return;
    }

    setSelectedRequiredCourseIds((current) => {
      const fixedVisibleRequiredCourses = professorMergedRequiredCourses.filter((courseName) => visibleRequiredCourseNames.has(courseName));
      return Array.from(new Set([
        ...current.filter((courseName) => visibleRequiredCourseNames.has(courseName)),
        ...fixedVisibleRequiredCourses
      ]));
    });
    setClasses((current) => {
      const fixedRequiredCoursesByName = new Map(requiredCourseOptionsByName
        .filter(({ courseName, options }) => professorMergedRequiredCourses.includes(courseName) && options.length === 1)
        .map(({ courseName, options }) => [courseName, options[0]]));
      let nextClasses = current.filter((item) => !item.id.startsWith("required-common-") || visibleRequiredCourseNames.has(item.courseName));

      fixedRequiredCoursesByName.forEach((option, courseName) => {
        if (nextClasses.some((item) => classMatchesRequiredCourseName(item, courseName, requiredCourses))) {
          return;
        }

        const classId = getRequiredClassId(courseName);
        const existingOtherClasses = nextClasses.filter((item) => !item.id.startsWith(classId));
        const newClasses = toRequiredClassSchedules(option, existingOtherClasses.length);

        if (newClasses.length) {
          nextClasses = [...existingOtherClasses, ...newClasses];
        }
      });

      return nextClasses;
    });
  }, [isDraftReady, isRequiredCourseLoading, requiredCourseOptionsByName, requiredCourses, visibleRequiredCourseNames]);

  useEffect(() => {
    if (!isDraftReady || activeStep !== "recommendations" || electiveCourses.length || isElectiveCourseLoading) {
      return;
    }

    void loadElectiveCourses();
  }, [activeStep, electiveCourses.length, isDraftReady, isElectiveCourseLoading, semester]);

  useEffect(() => {
    if (!isDraftReady || activeStep !== "classes" || !selectedMajorDepartments.length) {
      return;
    }

    void loadMajorCourses();
  }, [activeStep, isDraftReady, selectedMajorDepartments, selectedMajorGrade, semester]);

  async function completeTimetable() {
    if (isSavingTimetableRef.current) {
      return;
    }

    isSavingTimetableRef.current = true;
    setIsSavingTimetable(true);

    let didNavigate = false;

    try {
      const trimmedTitle = title.trim();

      if (!trimmedTitle) {
        setError("시간표 이름은 필수입니다.");
        return;
      }

      if (!classes.length) {
        setError("강의를 직접 추가하거나 추천 후보를 선택한 뒤 저장하세요.");
        return;
      }

      const saved = window.localStorage.getItem(savedTimetablesKey);
      let savedTimetables: Timetable[] = [];

      try {
        savedTimetables = saved ? (JSON.parse(saved) as Timetable[]) : [];
      } catch {
        savedTimetables = [];
      }

      let remoteTimetables: Timetable[] = [];

      try {
        remoteTimetables = await loadRemoteTimetables(user);
      } catch {
        remoteTimetables = [];
      }

      const draftId = editingId ?? `saved-${Date.now()}`;
      const uniqueTitle = getUniqueTimetableTitle(trimmedTitle, [...savedTimetables, ...remoteTimetables], [draftId, editingId ?? ""]);

      const newTimetable: Timetable = {
        id: draftId,
        userId,
        semester: semester.trim() || currentSemester,
        title: uniqueTitle,
        isSelected: false,
        score: classes.length ? 0 : 0,
        classes,
        personalSchedules,
        createdAt: new Date().toISOString()
      };
      let savedTimetable = newTimetable;

      try {
        const remoteSavedTimetable = await saveRemoteTimetable(user, newTimetable) ?? newTimetable;
        savedTimetable = {
          ...remoteSavedTimetable,
          personalSchedules: remoteSavedTimetable.personalSchedules?.length
            ? remoteSavedTimetable.personalSchedules
            : personalSchedules
        };
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Supabase에 시간표를 저장하지 못했습니다. 잠시 후 다시 시도하세요.");
        return;
      }

      const localOnlyTimetables = savedTimetables.filter((item) => (
        item.id.startsWith("saved-")
        && item.id !== newTimetable.id
        && item.id !== savedTimetable.id
      ));
      window.localStorage.setItem(savedTimetablesKey, JSON.stringify([savedTimetable, ...localOnlyTimetables]));
      window.localStorage.removeItem(draftStorageKey);
      didNavigate = true;
      router.push(`/timetable?semester=${encodeURIComponent(savedTimetable.semester)}`);
    } finally {
      if (!didNavigate) {
        isSavingTimetableRef.current = false;
        setIsSavingTimetable(false);
      }
    }
  }

  function toClassSchedule(course: Course, colorOffset: number, memo = "필수 이수"): ClassSchedule {
    return {
      id: `required-${course.id}`,
      timetableId: "draft",
      courseId: course.id,
      courseName: course.courseName,
      professorName: course.professorName,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      buildingName: course.buildingName,
      roomName: course.roomName,
      color: timetableColors[colorOffset % timetableColors.length],
      memo
    };
  }

  function addRecommendedCourse(course: Course) {
    const newClass = toClassSchedule(course, classes.length, "교양");

    if (!isRecordedRemoteClass(newClass) && classes.some((item) => !isRecordedRemoteClass(item) && overlaps(item, newClass))) {
      setCourseConflictNotice("선택한 강좌가 기존 강의 시간과 겹칩니다.");
      return;
    }

    if (classOverlapsPersonalSchedule(newClass, personalSchedules)) {
      setError("선택한 추천 교양이 개인 일정 시간과 겹칩니다.");
      return;
    }

    setClasses((current) => [...current, newClass]);
    setError("");
  }

  function courseConflictsWithSchedule(course: Course) {
    const newClass = toClassSchedule(course, 0);

    return classes.some((item) => !isRecordedRemoteClass(item) && overlaps(item, newClass))
      || classOverlapsPersonalSchedule(newClass, personalSchedules);
  }

  function isRecommendedCourseSelected(course: Course) {
    return classes.some((item) => item.id === `required-${course.id}`);
  }

  function toggleRecommendedCourse(course: Course, checked: boolean) {
    if (!checked) {
      setClasses((current) => current.filter((item) => item.id !== `required-${course.id}`));
      setError("");
      return;
    }

    addRecommendedCourse(course);
  }

  function toggleRequiredCourse(course: Course) {
    const isSelected = selectedRequiredCourseIds.includes(course.id);

    if (isSelected) {
      setSelectedRequiredCourseIds((current) => current.filter((id) => id !== course.id));
      setClasses((current) => current.filter((item) => item.id !== `required-${course.id}`));
      setError("");
      return;
    }

    const newClass = toClassSchedule(course, classes.length);

    if (!isRecordedRemoteClass(newClass) && classes.some((item) => !isRecordedRemoteClass(item) && overlaps(item, newClass))) {
      setCourseConflictNotice("선택한 강좌가 기존 강의 시간과 겹칩니다.");
      return;
    }

    if (classOverlapsPersonalSchedule(newClass, personalSchedules)) {
      setError("선택한 필수 이수 강의가 개인 일정 시간과 겹칩니다.");
      return;
    }

    setSelectedRequiredCourseIds((current) => [...current, course.id]);
    setClasses((current) => [...current, newClass]);
    setError("");
  }

  function toRequiredClassSchedules(option: RequiredCourseTimeOption, colorOffset: number): ClassSchedule[] {
    const roomCourse: SungshinCourse = {
      ...option.course,
      professorName: option.professorName,
      roomText: option.roomLabel === "분반별 강의실 상이" ? "" : option.roomLabel
    };
    const roomParts = option.roomLabel === "분반별 강의실 상이"
      ? { buildingName: "분반별 강의실 상이", roomName: "" }
      : splitRoomText(roomCourse);

    return option.scheduleText.split(",").reduce<ClassSchedule[]>((items, part, index) => {
      const match = part.trim().match(/^([월화수목금])\/(\d+)(?:-(\d+))?$/);

      if (!match) {
        return items;
      }

      const dayOfWeek = dayNameToKey[match[1]];
      const startPeriod = Number(match[2]);
      const endPeriod = Number(match[3] ?? match[2]);
      const startTime = periodTimes[startPeriod]?.start;
      const endTime = periodTimes[endPeriod]?.end;

      if (!dayOfWeek || !startTime || !endTime) {
        return items;
      }

      items.push({
        id: `${getRequiredClassId(option.courseName)}-${index}`,
        timetableId: "draft",
        courseId: option.courseCode,
        courseName: option.courseName,
        professorName: option.professorName,
        dayOfWeek,
        startTime,
        endTime,
        buildingName: roomParts.buildingName,
        roomName: roomParts.roomName,
        lessonTypeName: option.lessonTypeName,
        color: timetableColors[(colorOffset + index) % timetableColors.length],
        memo: "필수 이수"
      });

      return items;
    }, []);
  }

  function setRequiredCommonCourse(courseName: string, optionId: string) {
    const classId = getRequiredClassId(courseName);

    if (!optionId) {
      setSelectedRequiredCourseIds((current) => current.filter((id) => id !== courseName));
      setClasses((current) => current.filter((item) => !item.id.startsWith(classId) && !classMatchesRequiredCourseName(item, courseName, requiredCourses)));
      setError("");
      return;
    }

    const option = requiredCourseOptions.find((item) => item.id === optionId);

    if (!option) {
      return;
    }

    const existingOtherClasses = classes.filter((item) => !item.id.startsWith(classId));
    const newClasses = toRequiredClassSchedules(option, existingOtherClasses.length);

    if (!newClasses.length) {
      setError("선택한 필수 이수 강의의 시간표 정보를 해석하지 못했습니다.");
      return;
    }

    if (newClasses.some((newClass) => !isRecordedRemoteClass(newClass) && existingOtherClasses.some((item) => !isRecordedRemoteClass(item) && overlaps(item, newClass)))) {
      setCourseConflictNotice("선택한 강좌가 기존 강의 시간과 겹칩니다.");
      return;
    }

    if (newClasses.some((newClass) => classOverlapsPersonalSchedule(newClass, personalSchedules))) {
      setError("선택한 필수 이수 강의 시간이 개인 일정 시간과 겹칩니다.");
      return;
    }

    setSelectedRequiredCourseIds((current) => current.includes(courseName) ? current : [...current, courseName]);
    setClasses([...existingOtherClasses, ...newClasses]);
    setError("");
  }

  function toggleRequiredCommonCourse(courseName: string, options: RequiredCourseTimeOption[], checked: boolean) {
    const classId = getRequiredClassId(courseName);

    if (professorMergedRequiredCourses.includes(courseName) && !checked) {
      setSelectedRequiredCourseIds((current) => current.includes(courseName) ? current : [...current, courseName]);
      setError("");
      return;
    }

    if (!checked) {
      setSelectedRequiredCourseIds((current) => current.filter((id) => id !== courseName));
      setClasses((current) => current.filter((item) => !item.id.startsWith(classId) && !classMatchesRequiredCourseName(item, courseName, requiredCourses)));
      setError("");
      return;
    }

    if (options.length === 1) {
      setRequiredCommonCourse(courseName, options[0].id);
      return;
    }

    setSelectedRequiredCourseIds((current) => current.includes(courseName) ? current : [...current, courseName]);
    setClasses((current) => current.filter((item) => !item.id.startsWith(classId)));
    setError("");
  }

  function chooseRequiredCommonCourseTime(courseName: string, optionId: string) {
    const classId = getRequiredClassId(courseName);

    if (!optionId) {
      setSelectedRequiredCourseIds((current) => current.includes(courseName) ? current : [...current, courseName]);
      setClasses((current) => current.filter((item) => !item.id.startsWith(classId) && !classMatchesRequiredCourseName(item, courseName, requiredCourses)));
      setError("");
      return;
    }

    setRequiredCommonCourse(courseName, optionId);
  }

  function getRequiredOptionLabel(option: RequiredCourseTimeOption) {
    const sectionCountLabel = sectionMergedRequiredCourses.includes(option.courseName) && option.count > 1 ? `${option.count}개 분반` : "";
    return [option.professorName, option.scheduleText, option.campusName, option.roomLabel, sectionCountLabel].filter(Boolean).join(" · ");
  }

  function getSelectedRequiredTimeLabel(courseName: string) {
    const classId = getRequiredClassId(courseName);
    const selectedClasses = classes.filter((item) => item.id.startsWith(classId) || classMatchesRequiredCourseName(item, courseName, requiredCourses));

    return Array.from(new Set(selectedClasses.map(getClassScheduleLabel))).join(" / ");
  }

  function getSelectedRequiredOptionId(courseName: string) {
    const selectedClass = classes.find((item) => item.id.startsWith(getRequiredClassId(courseName)));
    const selectedOption = selectedClass
      ? requiredCourseOptions.find((option) => {
          const parsed = toRequiredClassSchedules(option, 0);
          return parsed.some((item) => (
            item.dayOfWeek === selectedClass.dayOfWeek
            && item.startTime === selectedClass.startTime
            && item.endTime === selectedClass.endTime
            && (!item.professorName || item.professorName === selectedClass.professorName)
          ));
        })
      : null;

    return selectedOption?.id ?? "";
  }

  function goToNextStep() {
    if (activeStep === "classes") {
      setActiveStep("personal");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (activeStep === "personal") {
      setActiveStep("recommendations");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    void completeTimetable();
  }

  function requestStepChange(nextStep: PlannerStep) {
    if (nextStep === activeStep) {
      return;
    }

    setActiveStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToPreviousStep() {
    if (activeStep === "recommendations") {
      setActiveStep("personal");
    } else if (activeStep === "personal") {
      setActiveStep("classes");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeSelectedMajorTrack(nextTrack: MajorTrack) {
    setSelectedMajorTrack(nextTrack);
    setMajorDepartmentToAdd("");
    setSelectedMajorDepartments(nextTrack === "primary" ? [department] : []);
    setSungshinCourses([]);
    setError("");
  }

  function changeMajorDepartment(nextDepartment: string) {
    setMajorDepartmentToAdd(nextDepartment);
    setSelectedMajorDepartments(nextDepartment ? [nextDepartment] : []);
    setSungshinCourses([]);
    setError("");
  }

  function changeSelectedMajorGrade(nextGrade: string) {
    setSelectedMajorGrade(nextGrade);
    setSungshinCourses([]);
    setError("");
  }

  async function loadMajorCourses() {
    setIsCourseLoading(true);
    setError("");

    try {
      const responses = await Promise.all(selectedMajorDepartments.map(async (majorDepartment) => {
        const params = new URLSearchParams({
          q: majorDepartment,
          yy: selectedSemester.year,
          semCd: toSungshinSemesterCode(semester),
          term: semester,
          category: "major"
        });
        const response = await fetch(`/api/sungshin-courses?${params.toString()}`);

        if (!response.ok) {
          throw new Error("request failed");
        }

        return response.json() as Promise<SungshinCourseResponse>;
      }));
      const selectedDepartmentSet = new Set(selectedMajorDepartments);
      const uniqueCourses = new Map<string, SungshinCourse>();

      responses
        .flatMap((response) => response.courses)
        .filter((course) => selectedDepartmentSet.has(course.departmentName))
        .filter((course) => matchesSelectedMajorGrade(course, selectedMajorGrade))
        .forEach((course) => uniqueCourses.set(course.id, course));

      const nextCourses = [...uniqueCourses.values()].sort((left, right) => (
        left.departmentName.localeCompare(right.departmentName, "ko")
        || left.courseName.localeCompare(right.courseName, "ko")
        || left.classNumber.localeCompare(right.classNumber, "ko")
      ));

      setSungshinCourses(nextCourses);

      if (!nextCourses.length) {
        setError("선택한 전공 학과의 강좌를 현재 학기 로컬 DB에서 찾지 못했습니다.");
      }
    } catch {
      setSungshinCourses([]);
      setError("로컬 강의 DB를 불러오지 못했습니다. 개발 서버를 새로고침한 뒤 다시 시도해주세요.");
    } finally {
      setIsCourseLoading(false);
    }
  }

  async function loadElectiveCourses() {
    setIsElectiveCourseLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        yy: selectedSemester.year,
        semCd: toSungshinSemesterCode(semester),
        term: semester,
        category: "elective"
      });
      const response = await fetch(`/api/sungshin-courses?${params.toString()}`);

      if (!response.ok) {
        throw new Error("request failed");
      }

      const data = await response.json() as SungshinCourseResponse;
      const nextCourses = data.courses
        .filter((course) => course.scheduleText)
        .sort((left, right) => (
          Number(Boolean(right.isGem)) - Number(Boolean(left.isGem))
          || left.completionType.localeCompare(right.completionType, "ko")
          || left.courseName.localeCompare(right.courseName, "ko")
          || left.classNumber.localeCompare(right.classNumber, "ko")
        ));

      setElectiveCourses(nextCourses);

      if (!nextCourses.length) {
        setError("현재 학기 로컬 DB에서 교양 강좌를 찾지 못했습니다.");
      }
    } catch {
      setElectiveCourses([]);
      setError("로컬 교양 강좌 DB를 불러오지 못했습니다. 개발 서버를 새로고침한 뒤 다시 시도해주세요.");
    } finally {
      setIsElectiveCourseLoading(false);
    }
  }

  function addSungshinCourse(course: SungshinCourse) {
    const parsedClasses = parseSungshinCourse(course, classes.length);

    if (!parsedClasses.length) {
      setError("이 강좌의 시간표 정보를 해석하지 못했습니다.");
      return;
    }

    if (parsedClasses.some((newClass) => !isRecordedRemoteClass(newClass) && classes.some((item) => !isRecordedRemoteClass(item) && overlaps(item, newClass)))) {
      setCourseConflictNotice("선택한 강좌가 기존 강의 시간과 겹칩니다.");
      return;
    }

    if (parsedClasses.some((newClass) => classOverlapsPersonalSchedule(newClass, personalSchedules))) {
      setError("선택한 강좌가 개인 일정 시간과 겹칩니다.");
      return;
    }

    setClasses((current) => [...current, ...parsedClasses]);
    setError("");
  }

  function sungshinCourseConflictsWithSchedule(course: SungshinCourse) {
    const parsedClasses = parseSungshinCourse(course, 0);

    return !parsedClasses.length
      || parsedClasses.some((newClass) => (
        (!isRecordedRemoteClass(newClass) && classes.some((item) => !isRecordedRemoteClass(item) && overlaps(item, newClass)))
        || classOverlapsPersonalSchedule(newClass, personalSchedules)
      ));
  }

  function getSungshinClassIdPrefix(course: SungshinCourse) {
    return `sungshin-${course.id}-`;
  }

  function isSungshinCourseSelected(course: SungshinCourse) {
    const classIdPrefix = getSungshinClassIdPrefix(course);
    const parsedClasses = parseSungshinCourse(course, 0);
    return parsedClasses.length > 0 && parsedClasses.every((parsedClass) => (
      classes.some((item) => item.id.startsWith(classIdPrefix) || classMatchesParsedSchedule(item, parsedClass))
    ));
  }

  function isOwnDepartmentGemCourse(course: SungshinCourse) {
    return Boolean(course.isGem) && course.departmentName === department;
  }

  function isRequiredElectiveCourse(course: SungshinCourse) {
    return requiredCourses.some((courseName) => getRequiredCourseDisplayName(course.courseName, requiredCourses) === courseName);
  }

  function isClassShownAsSelectedElective(classItem: ClassSchedule) {
    if (classItem.memo?.includes("필수 이수") || requiredCourses.some((courseName) => classMatchesRequiredCourseName(classItem, courseName, requiredCourses))) {
      return false;
    }

    if (classItem.memo?.includes("교양") || classItem.memo?.includes("GEM")) {
      return true;
    }

    const classDepartment = getClassMemoDepartment(classItem);
    return Boolean(classDepartment && classDepartment !== department);
  }

  function removeExistingElectiveClass(classId: string) {
    setClasses((current) => current.filter((item) => item.id !== classId));
    setError("");
  }

  function toggleSungshinCourse(course: SungshinCourse, checked: boolean) {
    const classIdPrefix = getSungshinClassIdPrefix(course);
    const parsedClasses = parseSungshinCourse(course, 0);

    if (!checked) {
      setClasses((current) => current.filter((item) => (
        !item.id.startsWith(classIdPrefix)
        && !parsedClasses.some((parsedClass) => classMatchesParsedSchedule(item, parsedClass))
      )));
      setError("");
      return;
    }

    if (parsedClasses.length && parsedClasses.every((parsedClass) => classes.some((item) => classMatchesParsedSchedule(item, parsedClass)))) {
      return;
    }

    addSungshinCourse(course);
  }

  function toggleElectiveArea(area: string, checked: boolean) {
    setSelectedElectiveAreas((current) => {
      if (checked) {
        return current.includes(area) ? current : [...current, area];
      }

      return current.filter((item) => item !== area);
    });
  }

  function toggleElectivePreference(preference: ElectivePreference, checked: boolean) {
    setSelectedElectivePreferences((current) => {
      if (checked) {
        return current.includes(preference) ? current : [...current, preference];
      }

      return current.filter((item) => item !== preference);
    });
  }

  function requestSemesterChange(nextSemester: string) {
    const normalizedNextSemester = normalizeSupportedSemester(nextSemester);

    if (normalizedNextSemester === semester) {
      return;
    }

    setPendingSemester(normalizedNextSemester);
  }

  function confirmSemesterChange() {
    if (!pendingSemester) {
      return;
    }

    setSemester(pendingSemester);
    setClasses((current) => current.filter((item) => !item.id.startsWith("required-common-")));
    setSelectedRequiredCourseIds([]);
    setRequiredCourseOptions([]);
    setSungshinCourses([]);
    setElectiveCourses([]);
    setSelectedElectiveAreas([...electiveAreaOptions]);
    setSelectedElectivePreferences([]);
    setError("");
    setPendingSemester(null);
  }

  return (
    <main className="page timetable-edit">
      <section className="timetable-top-banner" aria-labelledby="timetable-edit-title">
        <div className="timetable-top-banner-inner">
          <div className="timetable-top-banner-copy">
            <h1 id="timetable-edit-title">시간표 제작</h1>
            <p>{plannerSteps[activeStepIndex]?.label ?? "수업 선택"} 단계에서 필요한 항목을 선택하세요.</p>
          </div>
          <img className="timetable-top-banner-image" src="/images/banner-timetable.png" alt="" />
        </div>
      </section>

      <nav className="timetable-stepper" aria-label="시간표 만들기 단계">
        <span className="timetable-step-dot-group" aria-hidden="true">
          <span className="timetable-step-dot" />
          <span className="timetable-step-dot" />
        </span>
        {plannerSteps.map((step, index) => (
          <Fragment key={step.id}>
            <button
              aria-current={step.id === activeStep ? "step" : undefined}
              className="timetable-step"
              type="button"
              onClick={() => requestStepChange(step.id)}
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
            </button>
            {index < plannerSteps.length - 1 ? (
              <span className="timetable-step-dot-group" aria-hidden="true">
                <span className="timetable-step-dot" />
                <span className="timetable-step-dot" />
              </span>
            ) : null}
          </Fragment>
        ))}
        <span className="timetable-step-dot-group" aria-hidden="true">
          <span className="timetable-step-dot" />
          <span className="timetable-step-dot" />
        </span>
      </nav>

      {activeStep === "classes" ? (
        <>
          <section className="grid two">
            <article className="panel">
              <div className="section-title">
                <h2>필수 이수 강의</h2>
                <span className="badge">{selectedRequiredCourseIds.length}개 선택</span>
              </div>
              <p className="section-note">{department} 기준 현재 학기에 선택해야 하는 필수 이수 과목만 표시합니다. 비판적 사고와 토론, 창조적 사고와 글쓰기는 2026-2 배정표에 맞는 과목과 시간대로 고정됩니다.</p>
              {isRequiredCourseLoading ? (
                <div className="list">
                  <div className="list-item">
                    <strong>필수 이수 강의 시간을 불러오는 중입니다.</strong>
                  </div>
                </div>
              ) : (
                <div className="checkbox-list">
                  {!requiredCourseOptionsByName.length ? (
                    <div className="list-item">
                      <strong>현재 학기에 선택할 필수 이수 과목이 없습니다.</strong>
                    </div>
                  ) : requiredCourseOptionsByName.map(({ courseName, options }) => {
                    const selectedOptionId = getSelectedRequiredOptionId(courseName);
                    const selectedTimeFallbackLabel = selectedOptionId ? "" : getSelectedRequiredTimeLabel(courseName);
                    const isSelected = selectedRequiredCourseIds.includes(courseName) || Boolean(selectedOptionId || selectedTimeFallbackLabel);
                    const isSelectionLocked = professorMergedRequiredCourses.includes(courseName);
                    const fixedOption = options.length === 1 ? options[0] : null;
                    const selectedTimeFallbackValue = `selected-${courseName}`;
                    const requiredTimeOptions = [
                      ...(selectedTimeFallbackLabel ? [{ value: selectedTimeFallbackValue, label: `현재 선택됨 · ${selectedTimeFallbackLabel}` }] : []),
                      { value: "", label: "시간 선택" },
                      ...options.map((option) => ({
                        value: option.id,
                        label: getRequiredOptionLabel(option)
                      }))
                    ];

                    return (
                      <label className="checkbox-card" key={courseName}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isSelectionLocked || !options.length}
                          onChange={(event) => toggleRequiredCommonCourse(courseName, options, event.target.checked)}
                        />
                        <span>
                          <strong>{courseName}</strong>
                          {fixedOption ? (
                            <span className="required-fixed-time">{getRequiredOptionLabel(fixedOption)}</span>
                          ) : (
                            <TimetableSelect
                              ariaLabel={`${courseName} 수업 시간`}
                              disabled={!isSelected || !options.length}
                              value={selectedOptionId || (selectedTimeFallbackLabel ? selectedTimeFallbackValue : "")}
                              placeholder={options.length ? "시간 선택" : "선택 학기 데이터 없음"}
                              options={requiredTimeOptions}
                              onChange={(nextOptionId) => {
                                if (nextOptionId === selectedTimeFallbackValue) {
                                  return;
                                }

                                chooseRequiredCommonCourseTime(courseName, nextOptionId);
                              }}
                            />
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="panel">
              <div className="section-title">
                <h2>전공 강의 추가</h2>
                <span className="badge">학과·학년 선택</span>
              </div>
              <p className="section-note">전공 강의를 불러오기 전에 학과와 학년을 선택하세요. GEM 강좌는 전공과 교양 목록 양쪽에 표시됩니다.</p>
              <div className="form">
                <div className="field">
                  <label>학과 선택</label>
                  <TimetableSelect
                    ariaLabel="전공 구분"
                    value={selectedMajorTrack}
                    options={majorTrackOptions}
                    onChange={(nextTrack) => changeSelectedMajorTrack(nextTrack as MajorTrack)}
                  />
                  {selectedMajorTrack === "primary" ? (
                    <span className="field-help">{department}</span>
                  ) : (
                    <TimetableSelect
                      ariaLabel={`${selectedMajorTrack === "minor" ? "부전공" : "복수전공"} 학과`}
                      value={majorDepartmentToAdd}
                      options={majorDepartmentOptions}
                      onChange={changeMajorDepartment}
                    />
                  )}
                </div>
                <div className="field">
                  <label>학년</label>
                  <TimetableSelect
                    ariaLabel="전공 강의 대상 학년"
                    value={selectedMajorGrade}
                    options={gradeOptions}
                    onChange={changeSelectedMajorGrade}
                  />
                </div>
                {isCourseLoading ? (
                  <div className="list">
                    <div className="list-item">
                      <strong>전공 강좌를 불러오는 중입니다.</strong>
                    </div>
                  </div>
                ) : sungshinCourses.length ? (
                  <div className="major-course-list">
                    <div className="dropdown-summary">
                      {selectedMajorGrade}학년 전공 강좌 {sungshinCourses.length.toLocaleString("ko-KR")}개
                    </div>
                    {sungshinCourses.map((course) => {
                      const isSelected = isSungshinCourseSelected(course);

                      return (
                        <label className="checkbox-card" key={course.id}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => toggleSungshinCourse(course, event.target.checked)}
                          />
                          <span>
                            <strong>
                              [{course.courseName}] - {course.professorName || "교수 미정"}
                              {course.classNumber && course.classNumber !== "001" ? ` (${course.classNumber})` : ""}
                            </strong>
                            <small>{[course.isGem ? "GEM" : "", course.departmentName, course.scheduleText || "시간 미정", getCourseRoomLabel(course)].filter(Boolean).join(" · ")}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </article>
          </section>

          <section className="panel selected-class-list-panel">
            <div className="section-title selected-class-list-title">
              <h2>선택된 강의 목록</h2>
              <span className="badge">{classes.length}개</span>
            </div>
            <div className="list">
              {classes.length ? classes.map((item) => (
                <div className="list-item" key={item.id}>
                  <strong>{item.courseName}</strong>
                  <span className="muted">{[item.professorName, getClassScheduleLabel(item), item.memo].filter(Boolean).join(" · ")}</span>
                </div>
              )) : (
                <div className="list-item">
                  <strong>선택된 강의가 없습니다.</strong>
                  <span className="muted">필수 이수 강의나 전공 강의를 체크하면 이곳에 표시됩니다.</span>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {activeStep === "personal" ? (
        <section className="panel">
          <div className="section-title">
            <h2>개인 일정</h2>
            <span className="badge">드래그로 추가</span>
          </div>
          <p className="section-note">원하는 시간대를 드래그한 뒤 놓으면 일정 이름을 정할 수 있습니다.</p>
          <PersonalSchedulePlanner
            classes={classes}
            personalSchedules={personalSchedules}
            userId={userId}
            onAddSchedule={(schedule) => {
              if (classes.some((item) => classOverlapsPersonalSchedule(item, [schedule]))) {
                setError("수업 시간과 겹치는 개인 일정은 추가할 수 없습니다.");
                return false;
              }

              if (personalSchedules.some((item) => overlaps(item, schedule))) {
                setError("같은 요일의 개인 일정 시간이 겹칩니다.");
                return false;
              }

              setPersonalSchedules((current) => [...current, schedule]);
              setError("");
              return true;
            }}
            onDeleteSchedule={(scheduleId) => {
              setPersonalSchedules((current) => current.filter((item) => item.id !== scheduleId));
              setError("");
            }}
          />
        </section>
      ) : null}

      {error ? <div className="error" style={{ marginTop: 16 }}>{error}</div> : null}

      {activeStep === "recommendations" ? (
        <>
          <section>
            <article className="panel timetable-recommend-panel">
              <div className="section-title">
                <div className="timetable-recommend-title">
                  <span aria-hidden="true" />
                  <h2>추천 교양 목록</h2>
                </div>
                <span className="badge">{selectedElectiveDisplayCount + (visibleElectiveCourses.length || recommendedElectiveCourses.length)}개 표시</span>
              </div>
              <div className="timetable-recommend-filter-row timetable-recommend-area-row" aria-label="교양 및 GEM 영역 필터">
                {electiveAreaOptions.map((area) => (
                  <label className="timetable-recommend-chip" key={area}>
                    <input
                      type="checkbox"
                      checked={selectedElectiveAreas.includes(area)}
                      onChange={(event) => toggleElectiveArea(area, event.target.checked)}
                    />
                    <ElectiveAreaIcon area={area} />
                    <span>
                      <strong>{area}</strong>
                    </span>
                  </label>
                ))}
              </div>
              <div className="timetable-recommend-filter-row timetable-recommend-preference-row" aria-label="교양 추천 선호 조건">
                {electivePreferenceOptions.map((option) => (
                  <label className="timetable-recommend-chip timetable-recommend-preference-chip" key={option.value}>
                    <input
                      type="checkbox"
                      checked={selectedElectivePreferences.includes(option.value)}
                      onChange={(event) => toggleElectivePreference(option.value, event.target.checked)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                    </span>
                  </label>
                ))}
              </div>
              <div className="timetable-recommend-course-list">
                {isElectiveCourseLoading ? (
                  <div className="timetable-recommend-course-row">
                    <strong>교양 강좌를 불러오는 중입니다.</strong>
                  </div>
                ) : selectedElectiveDisplayCount || visibleElectiveCourses.length ? (
                  <>
                    {selectedSungshinElectiveCourses.map((course) => (
                      <label className="timetable-recommend-course-row selected-recommend-course-row" key={`selected-${course.id}`}>
                        <input
                          type="checkbox"
                          checked
                          onChange={(event) => toggleSungshinCourse(course, event.target.checked)}
                        />
                        <span>
                          <strong>{course.courseName}{course.classNumber && course.classNumber !== "001" ? ` (${course.classNumber})` : ""}</strong>
                          <em>{course.isGem ? "GEM" : "교양"}</em>
                          <small>
                            {[course.completionType, course.subjectAreaName, course.departmentName, course.professorName, course.scheduleText || "시간 미정", getCourseRoomLabel(course)].filter(Boolean).join(" · ")}
                          </small>
                        </span>
                      </label>
                    ))}
                    {selectedExistingElectiveClasses.map((classItem) => (
                      <label className="timetable-recommend-course-row selected-recommend-course-row" key={`selected-existing-${classItem.id}`}>
                        <input
                          type="checkbox"
                          checked
                          onChange={(event) => {
                            if (!event.target.checked) {
                              removeExistingElectiveClass(classItem.id);
                            }
                          }}
                        />
                        <span>
                          <strong>{classItem.courseName}</strong>
                          <em>{classItem.memo?.includes("GEM") ? "GEM" : "교양"}</em>
                          <small>{[classItem.professorName, getClassScheduleLabel(classItem), classItem.memo].filter(Boolean).join(" · ")}</small>
                        </span>
                      </label>
                    ))}
                    {visibleElectiveCourses.map((course) => {
                      const isSelected = isSungshinCourseSelected(course);

                      return (
                        <label className="timetable-recommend-course-row" key={course.id}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => toggleSungshinCourse(course, event.target.checked)}
                          />
                          <span>
                            <strong>{course.courseName}{course.classNumber && course.classNumber !== "001" ? ` (${course.classNumber})` : ""}</strong>
                            <em>교양</em>
                            <small>
                              {[course.isGem ? "GEM" : "", course.completionType, course.subjectAreaName, course.departmentName, course.professorName, course.scheduleText || "시간 미정", getCourseRoomLabel(course)].filter(Boolean).join(" · ")}
                            </small>
                          </span>
                        </label>
                      );
                    })}
                  </>
                ) : electiveCourses.length ? (
                  <div className="timetable-recommend-course-row">
                    <strong>조건에 맞는 교양 강좌가 없습니다.</strong>
                    <span className="muted">교양 종류 선택을 늘리거나 앞 단계의 시간표를 조정해보세요.</span>
                  </div>
                ) : (
                  <>
                    {recommendedElectiveCourses.map((course) => {
                      const isSelected = isRecommendedCourseSelected(course);

                      return (
                        <label className="timetable-recommend-course-row" key={course.id}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => toggleRecommendedCourse(course, event.target.checked)}
                          />
                          <span>
                            <strong>{course.courseName}</strong>
                            <em>교양</em>
                            <small>{course.professorName} · {dayLabels[course.dayOfWeek]} {course.startTime}-{course.endTime}</small>
                          </span>
                        </label>
                      );
                    })}
                    {!recommendedElectiveCourses.length ? (
                      <div className="timetable-recommend-course-row">
                        <strong>조건에 맞는 교양 강좌가 없습니다.</strong>
                        <span className="muted">앞 단계의 시간표나 개인 일정을 조정해보세요.</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </article>

          </section>
          {selectedElectiveClasses.length ? (
            <section className="panel selected-class-list-panel selected-elective-list-panel">
              <div className="section-title selected-class-list-title">
                <h2>선택된 교양 목록</h2>
                <span className="badge">{selectedElectiveClasses.length}개</span>
              </div>
              <div className="list">
                {selectedElectiveClasses.map((item) => (
                  <div className="list-item" key={item.id}>
                    <strong>{item.courseName}</strong>
                    <span className="muted">{[item.professorName, getClassScheduleLabel(item), item.memo].filter(Boolean).join(" · ")}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <div className="timetable-step-actions">
        {activeStep !== "classes" ? <button className="ghost-button" type="button" onClick={goToPreviousStep} disabled={isSavingTimetable}>이전</button> : <span />}
        <button className="button" type="button" onClick={goToNextStep} disabled={isSavingTimetable}>
          {isSavingTimetable ? "저장 중" : activeStep === "recommendations" ? "시간표 저장" : "다음"}
        </button>
      </div>

      {pendingSemester ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPendingSemester(null);
        }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="semester-change-title">
            <div>
              <h2 id="semester-change-title">학기를 변경할까요?</h2>
              <p>{getSemesterLabel(pendingSemester)}로 변경하면 선택한 강의와 검색 결과가 초기화됩니다.</p>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setPendingSemester(null)}>취소</button>
              <button className="button danger-button" type="button" onClick={confirmSemesterChange}>변경</button>
            </div>
          </section>
        </div>
      ) : null}
      {courseConflictNotice ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCourseConflictNotice("");
        }}>
          <section className="conflict-alert-modal" role="alertdialog" aria-modal="true" aria-labelledby="course-conflict-title">
            <div className="conflict-alert-marker" aria-hidden="true">!</div>
            <div>
              <h2 id="course-conflict-title">선택 불가</h2>
              <p>{courseConflictNotice}</p>
            </div>
            <button className="button" type="button" onClick={() => setCourseConflictNotice("")}>확인</button>
          </section>
        </div>
      ) : null}
      {isDatabaseLoadingVisible ? <DatabaseLoadingNotice /> : null}
    </main>
  );
}

function ElectiveAreaIcon({ area }: { area: ElectiveArea }) {
  return (
    <i className="elective-area-art" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {area === "인식과가치" ? (
          <>
            <path d="M15.8 21v-4.2h3v-3.1h2.3l-2.4-4.1C18.2 5.8 15.3 3 11.4 3 7 3 3.6 6.5 3.6 10.9c0 2.9 1.5 5.2 3.8 6.6V21h8.4Z" />
          </>
        ) : null}
        {area === "문학과예술" ? (
          <>
            <path d="M12 4.3c-4.5 0-8.2 3.2-8.2 7.1 0 3.5 2.9 6.4 6.8 7 .9.1 1.5-.6 1.2-1.4-.3-1 .5-1.9 1.6-1.9h1.2c3.1 0 5.6-2.3 5.6-5.2 0-3.1-3.7-5.6-8.2-5.6Z" />
            <path d="M7.7 10.8h.1M10.4 8.3h.1M13.7 8.3h.1M16.1 10.8h.1" />
          </>
        ) : null}
        {area === "사회의이해" ? (
          <>
            <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
            <path d="M4.6 12h14.8" />
            <path d="M12 4c2 2.1 3.1 4.7 3.1 8S14 17.9 12 20" />
            <path d="M12 4c-2 2.1-3.1 4.7-3.1 8S10 17.9 12 20" />
          </>
        ) : null}
        {area === "자연의설명" ? (
          <>
            <path d="M4.5 18.6c2.4-1 4.9-1.5 7.5-1.5s5.1.5 7.5 1.5" />
            <path d="M12 17.1V9.8" />
            <path d="M12 12.3c-2.8 0-4.9-1.8-5.4-4.6 2.8-.2 4.9 1.3 5.4 4.6Z" />
            <path d="M12 12.3c2.8 0 4.9-1.8 5.4-4.6-2.8-.2-4.9 1.3-5.4 4.6Z" />
            <path d="M6.2 20.2h11.6" />
          </>
        ) : null}
        {area === "공학과기술" ? (
          <>
            <path d="M8.3 4.2v1.5M8.3 12.5V14M4.2 8.3h1.5M10.9 5.7 12 4.6M10.9 10.9 12 12M5.7 5.7 4.6 4.6M5.7 10.9 4.6 12" />
            <path d="M8.3 6.1a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z" />
            <path d="M16.6 10v1.3M16.6 18.6V20M12.6 14.6h1.3M19.3 14.6h1.3M13.8 11.8l.9.9M18.5 16.5l.9.9M13.8 17.4l.9-.9M18.5 12.7l.9-.9" />
            <path d="M16.6 12.4a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4Z" />
            <path d="M18.5 4.5v1.1M18.5 10.7v1.1M15.4 7.6h1.1M20.5 7.6h1.1M16.3 5.4l.8.8M19.9 9l.8.8M16.3 9.8l.8-.8M19.9 6.2l.8-.8" />
            <path d="M18.5 6.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z" />
          </>
        ) : null}
        {area === "도전과실천" ? (
          <>
            <path d="M8.1 11.4a5.4 5.4 0 1 1 7.8 0c-1.3 1.2-2 2.5-2 4.1h-3.8c0-1.6-.7-2.9-2-4.1Z" />
            <path d="M10.1 18h3.8" />
            <path d="M10.7 21h2.6" />
            <path d="M9.9 9.6c.5-.9 1.2-1.5 2.2-1.8" />
            <path d="M12 2.6V1.2" />
            <path d="M4.9 5.2 3.8 4.1" />
            <path d="m19.1 5.2 1.1-1.1" />
            <path d="M2.4 12h-1.4" />
            <path d="M23 12h-1.4" />
            <path d="m4.9 18.8-1.1 1.1" />
            <path d="m19.1 18.8 1.1 1.1" />
          </>
        ) : null}
      </svg>
    </i>
  );
}

function DatabaseLoadingNotice() {
  return (
    <div className={`${styles.overlay} ${styles.loadingOverlay}`} role="status" aria-live="polite" aria-label="데이터베이스 로딩 중">
      <span className={`${styles.content} ${styles.loadingContent}`}>
        <span className={styles.loadingSpinner} aria-hidden="true" />
        <span className={styles.loadingMessage}>데이터베이스에서 값을 불러오는 중입니다</span>
      </span>
    </div>
  );
}

function PersonalSchedulePlanner({
  classes,
  personalSchedules,
  userId,
  onAddSchedule,
  onDeleteSchedule
}: {
  classes: ClassSchedule[];
  personalSchedules: PersonalSchedule[];
  userId: string;
  onAddSchedule: (schedule: PersonalSchedule) => boolean;
  onDeleteSchedule: (scheduleId: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [dragSelection, setDragSelection] = useState<PersonalDragSelection | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<PendingPersonalSchedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<PersonalSchedule | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");

  function getSelectionFromPointer(event: PointerEvent<HTMLDivElement>) {
    const grid = gridRef.current;

    if (!grid) {
      return null;
    }

    const rect = grid.getBoundingClientRect();
    const timeColumn = 72;
    const headerRow = 44;
    const x = event.clientX - rect.left - timeColumn;
    const y = event.clientY - rect.top - headerRow;
    const dayIndex = Math.floor(x / ((rect.width - timeColumn) / weekdays.length));

    if (dayIndex < 0 || dayIndex >= weekdays.length || y < 0) {
      return null;
    }

    const rawMinutes = plannerStartMinutes + (y / (rect.height - headerRow)) * (plannerEndMinutes - plannerStartMinutes);
    const roundedMinutes = Math.min(
      plannerEndMinutes,
      Math.max(plannerStartMinutes, Math.round(rawMinutes / plannerMinuteStep) * plannerMinuteStep)
    );

    return {
      dayOfWeek: weekdays[dayIndex],
      minutes: roundedMinutes
    };
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const selection = getSelectionFromPointer(event);

    if (!selection) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragSelection({
      dayOfWeek: selection.dayOfWeek,
      anchorMinutes: selection.minutes,
      currentMinutes: Math.min(selection.minutes + plannerMinuteStep, plannerEndMinutes)
    });
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragSelection) {
      return;
    }

    const selection = getSelectionFromPointer(event);

    if (!selection || selection.dayOfWeek !== dragSelection.dayOfWeek) {
      return;
    }

    setDragSelection((current) => current ? { ...current, currentMinutes: selection.minutes } : current);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragSelection) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const startMinutes = Math.min(dragSelection.anchorMinutes, dragSelection.currentMinutes);
    const endMinutes = Math.max(dragSelection.anchorMinutes, dragSelection.currentMinutes);
    setDragSelection(null);

    if (endMinutes - startMinutes < plannerMinuteStep) {
      return;
    }

    setPendingTitle("");
    setPendingSchedule({
      dayOfWeek: dragSelection.dayOfWeek,
      startTime: formatMinutes(startMinutes),
      endTime: formatMinutes(endMinutes)
    });
  }

  function closeCreateModal() {
    setPendingSchedule(null);
    setPendingTitle("");
  }

  function createSchedule() {
    if (!pendingSchedule || !pendingTitle.trim()) {
      return;
    }

    const wasAdded = onAddSchedule({
      id: `personal-${Date.now()}`,
      userId,
      title: pendingTitle.trim(),
      dayOfWeek: pendingSchedule.dayOfWeek,
      startTime: pendingSchedule.startTime,
      endTime: pendingSchedule.endTime
    });

    if (wasAdded) {
      closeCreateModal();
    }
  }

  function deleteSchedule(schedule: PersonalSchedule) {
    setDeletingSchedule(schedule);
  }

  function confirmDeleteSchedule() {
    if (!deletingSchedule) {
      return;
    }

    onDeleteSchedule(deletingSchedule.id);
    setDeletingSchedule(null);
  }

  const visibleSchedules = personalSchedules.filter((item) => weekdays.includes(item.dayOfWeek as DayOfWeek) && isInPlannerTimeRange(item));
  const visibleClasses = classes.filter((item) => !isRecordedRemoteClass(item) && weekdays.includes(item.dayOfWeek) && isInPlannerTimeRange(item));

  return (
    <>
      <div
        className="personal-planner"
        ref={gridRef}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={() => setDragSelection(null)}
      >
        <div className="personal-planner-head">시간</div>
        {weekdays.map((day) => (
          <div className="personal-planner-head" key={day}>{dayLabels[day]}</div>
        ))}
        {plannerHours.map((hour) => (
          <Fragment key={hour}>
            <div className="personal-planner-time" key={`${hour}-time`}>{String(hour).padStart(2, "0")}:00</div>
            {weekdays.map((day) => <div className="personal-planner-cell" key={`${day}-${hour}`} />)}
          </Fragment>
        ))}
        {visibleClasses.map((classItem) => (
          <div
            className="personal-planner-block personal-planner-class-block"
            style={{ ...getPlannerOverlayStyle(classItem), background: classItem.color }}
            key={classItem.id}
          >
            <strong>{classItem.courseName}</strong>
            <span>{classItem.startTime}-{classItem.endTime}</span>
          </div>
        ))}
        {visibleSchedules.map((schedule) => (
          <button
            className="personal-planner-block"
            style={getPlannerOverlayStyle(schedule)}
            type="button"
            key={schedule.id}
            aria-label={`${schedule.title} 일정 삭제`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => deleteSchedule(schedule)}
          >
            <strong>{schedule.title}</strong>
            <span>{schedule.startTime}-{schedule.endTime}</span>
          </button>
        ))}
        {dragSelection ? (
          <div className="personal-planner-block personal-planner-draft" style={getPlannerSelectionStyle(dragSelection)}>
            <strong>새 일정</strong>
            <span>{formatMinutes(Math.min(dragSelection.anchorMinutes, dragSelection.currentMinutes))}-{formatMinutes(Math.max(dragSelection.anchorMinutes, dragSelection.currentMinutes))}</span>
          </div>
        ) : null}
      </div>
      {pendingSchedule ? (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeCreateModal();
        }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="create-personal-schedule-title">
            <div>
              <h2 id="create-personal-schedule-title">개인 일정 생성</h2>
              <p>{dayLabels[pendingSchedule.dayOfWeek]} {pendingSchedule.startTime}-{pendingSchedule.endTime}에 추가할 일정 이름을 입력하세요.</p>
            </div>
            <div className="field">
              <label htmlFor="personal-schedule-title">일정 이름</label>
              <input
                id="personal-schedule-title"
                autoFocus
                value={pendingTitle}
                onChange={(event) => setPendingTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    createSchedule();
                  }
                }}
              />
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={closeCreateModal}>취소</button>
              <button className="button" type="button" onClick={createSchedule} disabled={!pendingTitle.trim()}>생성</button>
            </div>
          </section>
        </div>
      ) : null}
      {deletingSchedule ? (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeletingSchedule(null);
        }}>
          <section className="confirm-modal yes-no-confirm delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-personal-schedule-title">
            <div className="yes-no-confirm-mark delete-confirm-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7" /></svg>
            </div>
            <div>
              <h2 id="delete-personal-schedule-title">개인 일정 삭제</h2>
              <p>{deletingSchedule.title} 일정을 삭제할까요?</p>
            </div>
            <div className="modal-actions">
              <button className="button" type="button" onClick={confirmDeleteSchedule}>예</button>
              <button className="ghost-button" type="button" onClick={() => setDeletingSchedule(null)}>아니오</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function formatMinutes(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getPlannerOverlayStyle(item: { dayOfWeek: string; startTime: string; endTime: string }) {
  const dayIndex = weekdays.indexOf(item.dayOfWeek as DayOfWeek);
  const start = Math.max(toMinutes(item.startTime), plannerStartMinutes);
  const end = Math.min(toMinutes(item.endTime), plannerEndMinutes);
  const startSlot = (start - plannerStartMinutes) / 60;
  const durationSlots = Math.max((end - start) / 60, 0.5);

  return {
    "--day-index": dayIndex,
    "--start-slot": startSlot,
    "--duration-slots": durationSlots
  } as CSSProperties;
}

function isInPlannerTimeRange(item: { startTime: string; endTime: string }) {
  const start = Math.max(toMinutes(item.startTime), plannerStartMinutes);
  const end = Math.min(toMinutes(item.endTime), plannerEndMinutes);
  return end > start;
}

function classOverlapsPersonalSchedule(classItem: ClassSchedule, personalSchedules: PersonalSchedule[]) {
  if (isRecordedRemoteClass(classItem)) {
    return false;
  }

  return personalSchedules.some((schedule) => overlaps(classItem, schedule));
}

function getPlannerSelectionStyle(selection: PersonalDragSelection) {
  const start = Math.min(selection.anchorMinutes, selection.currentMinutes);
  const end = Math.max(selection.anchorMinutes, selection.currentMinutes);

  return {
    "--day-index": weekdays.indexOf(selection.dayOfWeek),
    "--start-slot": (start - plannerStartMinutes) / 60,
    "--duration-slots": Math.max((end - start) / 60, 0.5)
  } as CSSProperties;
}
