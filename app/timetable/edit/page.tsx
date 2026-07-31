"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { WeeklyTimetable } from "@/components/WeeklyTimetable";
import { courses, personalSchedules as seedPersonalSchedules, timetables } from "@/lib/data";
import { dayLabels, generateTimetableCandidates, isRecordedRemoteClass, overlaps, timetableColors, toMinutes, weekdays } from "@/lib/timetable";
import type { ClassSchedule, Course, DayOfWeek, PersonalSchedule, Timetable } from "@/lib/types";

const savedTimetablesKey = "newbie-on:timetables";
const plannerHours = Array.from({ length: 14 }, (_, index) => 9 + index);
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
  courseQuery: string;
}

const yearOptions = [2023, 2024, 2025, 2026];
const semesterOptions = [
  { value: "1", label: "1학기" },
  { value: "summer", label: "여름 계절학기" },
  { value: "2", label: "2학기" },
  { value: "winter", label: "겨울 계절학기" }
] as const;
const supportedSemesterOrder = ["1", "summer", "2", "winter"] as const;
const localSemesterRangeLabel = "2023년 1학기 - 2026년 여름 계절학기";
const professorMergedRequiredCourses = ["비판적 사고와 토론", "창의적 사고와 글쓰기"];
const commonRequiredCourses = [...professorMergedRequiredCourses, "전공별 진로 탐색"];
const defaultRequiredCourses = ["파이썬프로그래밍", "기초통계학", "미적분과 벡터해석 기초"];
const requiredCourseAliases: Record<string, string[]> = {
  기초통계학: ["기초통계학", "기초통계실습", "기초통계"],
  "일반화학 Ⅰ": ["일반화학 Ⅰ", "일반화학 I", "일반화학 1"],
  "일반화학 Ⅱ": ["일반화학 Ⅱ", "일반화학 II", "일반화학 2"],
  "일반생물학 Ⅰ": ["일반생물학 Ⅰ", "일반생물학 I", "일반생물학 1"],
  "일반생물학 Ⅱ": ["일반생물학 Ⅱ", "일반생물학 II", "일반생물학 2"],
  "일반물리학 Ⅰ": ["일반물리학 Ⅰ", "일반물리학 I", "일반물리학 1"]
};
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
      {(user) => <TimetableEditWorkspace userId={user.id} department={user.department} grade={user.grade} />}
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

function getRequiredClassId(courseName: string) {
  return `required-common-${courseName}`;
}

function getRequiredOptionId(course: SungshinCourse, displayCourseName = course.courseName) {
  const professorPart = professorMergedRequiredCourses.includes(displayCourseName) ? "" : course.professorName;
  return `${displayCourseName}-${course.courseCode}-${course.scheduleText}-${course.campusName}-${professorPart}`;
}

function getRequiredCoursesForDepartment(department: string) {
  return Array.from(new Set([...commonRequiredCourses, ...(departmentRequiredCourses[department] ?? [])]));
}

function getRequiredCourseSearchNames(courseName: string) {
  return requiredCourseAliases[courseName] ?? [courseName];
}

function getRequiredCourseDisplayName(courseName: string, requiredCourses: string[]) {
  return requiredCourses.find((requiredCourse) => getRequiredCourseSearchNames(requiredCourse).includes(courseName)) ?? courseName;
}

function getRequiredCourseOptions(courses: SungshinCourse[], requiredCourses: string[]) {
  const grouped = new Map<string, RequiredCourseTimeOption>();
  const searchableNames = new Set(requiredCourses.flatMap(getRequiredCourseSearchNames));

  courses
    .filter((course) => searchableNames.has(course.courseName))
    .forEach((course) => {
      const courseName = getRequiredCourseDisplayName(course.courseName, requiredCourses);
      const professorName = professorMergedRequiredCourses.includes(courseName) ? "" : course.professorName;
      const key = getRequiredOptionId(course, courseName);
      const previous = grouped.get(key);

      if (previous) {
        grouped.set(key, {
          ...previous,
          count: previous.count + 1,
          roomLabel: previous.roomLabel === getCourseRoomLabel(course) ? previous.roomLabel : "분반별 강의실 상이"
        });
        return;
      }

      grouped.set(key, {
        id: key,
        courseName,
        courseCode: course.courseCode,
        professorName,
        scheduleText: course.scheduleText,
        campusName: course.campusName,
        lessonTypeName: course.lessonTypeName,
        roomLabel: getCourseRoomLabel(course),
        count: 1,
        course
      });
    });

  return [...grouped.values()].sort((left, right) => {
    if (left.courseName !== right.courseName) {
      return requiredCourses.indexOf(left.courseName) - requiredCourses.indexOf(right.courseName);
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

  if (normalized.includes("여름")) {
    return "COMM063.15";
  }

  if (normalized.includes("겨울")) {
    return "COMM063.25";
  }

  return "COMM063.10";
}

function splitSemester(semester: string) {
  const [year = "2026", semesterPart = "1"] = semester.split("-");
  return {
    year: yearOptions.includes(Number(year)) ? year : "2026",
    semesterPart: supportedSemesterOrder.includes(semesterPart as (typeof supportedSemesterOrder)[number]) ? semesterPart : "1"
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
    return semesterOptions.filter((option) => option.value === "1" || option.value === "summer");
  }

  return semesterOptions;
}

function isDraft(value: unknown): value is TimetableEditDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<TimetableEditDraft>;
  return typeof draft.title === "string" && typeof draft.semester === "string" && Array.isArray(draft.classes) && Array.isArray(draft.personalSchedules);
}

function TimetableEditWorkspace({
  userId,
  department,
  grade
}: {
  userId: string;
  department: string;
  grade: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const initialTitle = searchParams.get("title");
  const draftStorageKey = `newbie-on:timetable-edit-draft:${editingId ?? initialTitle ?? "new"}`;
  const [title, setTitle] = useState("새 시간표");
  const [semester, setSemester] = useState("2026-1");
  const selectedSemester = splitSemester(semester);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [personalSchedules, setPersonalSchedules] = useState<PersonalSchedule[]>(seedPersonalSchedules);
  const [selectedRequiredCourseIds, setSelectedRequiredCourseIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState<Timetable[]>([]);
  const [courseQuery, setCourseQuery] = useState("");
  const [sungshinCourses, setSungshinCourses] = useState<SungshinCourse[]>([]);
  const [sungshinCourseCount, setSungshinCourseCount] = useState(0);
  const [hasNoExactCourseMatch, setHasNoExactCourseMatch] = useState(false);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [requiredCourseOptions, setRequiredCourseOptions] = useState<RequiredCourseTimeOption[]>([]);
  const [isRequiredCourseLoading, setIsRequiredCourseLoading] = useState(false);
  const [isSungshinDropdownOpen, setIsSungshinDropdownOpen] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [pendingSemester, setPendingSemester] = useState<string | null>(null);
  const sungshinSearchRef = useRef<HTMLDivElement | null>(null);
  const requiredCourses = useMemo(() => getRequiredCoursesForDepartment(department), [department]);
  const requiredCourseOptionsByName = useMemo(
    () => requiredCourses.map((courseName) => ({
      courseName,
      options: requiredCourseOptions.filter((option) => option.courseName === courseName)
    })),
    [requiredCourseOptions, requiredCourses]
  );

  useEffect(() => {
    let nextTitle = "새 시간표";
    let nextSemester = "2026-1";
    let nextClasses: ClassSchedule[] = [];
    let nextPersonalSchedules: PersonalSchedule[] = seedPersonalSchedules;
    let nextSelectedRequiredCourseIds: string[] = [];
    let nextCourseQuery = "";

    if (!editingId && initialTitle?.trim()) {
      nextTitle = initialTitle.trim();
    }

    if (editingId) {
      const saved = window.localStorage.getItem(savedTimetablesKey);
      let savedTimetables: Timetable[] = [];

      try {
        savedTimetables = saved ? (JSON.parse(saved) as Timetable[]) : [];
      } catch {
        savedTimetables = [];
      }

      const existing = [...savedTimetables, ...timetables].find((item) => item.id === editingId);

      if (!existing) {
        setError("수정할 시간표를 찾을 수 없습니다.");
      } else {
        nextTitle = existing.title;
        nextSemester = normalizeSupportedSemester(existing.semester);
        nextClasses = existing.classes;
        nextPersonalSchedules = existing.personalSchedules ?? seedPersonalSchedules;
        nextSelectedRequiredCourseIds = existing.classes
          .filter((item) => item.id.startsWith("required-common-"))
          .map((item) => item.courseName)
          .filter((courseName, index, names) => requiredCourses.includes(courseName) && names.indexOf(courseName) === index);
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
        nextCourseQuery = parsedDraft.courseQuery ?? "";
      }
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }

    nextClasses = nextClasses.filter((item) => !item.id.startsWith("required-common-") || requiredCourses.includes(item.courseName));

    setTitle(nextTitle);
    setSemester(nextSemester);
    setClasses(nextClasses);
    setPersonalSchedules(nextPersonalSchedules);
    setSelectedRequiredCourseIds(nextSelectedRequiredCourseIds);
    setCourseQuery(nextCourseQuery);
    setIsDraftReady(true);
  }, [draftStorageKey, editingId, initialTitle, requiredCourses]);

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
      courseQuery
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [classes, courseQuery, draftStorageKey, isDraftReady, personalSchedules, selectedRequiredCourseIds, semester, title]);

  useEffect(() => {
    function closeDropdowns(event: globalThis.PointerEvent) {
      const target = event.target as Node;

      if (sungshinSearchRef.current?.contains(target)) {
        return;
      }

      setIsSungshinDropdownOpen(false);
    }

    document.addEventListener("pointerdown", closeDropdowns);
    return () => document.removeEventListener("pointerdown", closeDropdowns);
  }, []);

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

        setRequiredCourseOptions(getRequiredCourseOptions(responses.flatMap((response) => response.courses), requiredCourses));
      } catch {
        setRequiredCourseOptions([]);
      } finally {
        setIsRequiredCourseLoading(false);
      }
    }

    void loadRequiredCourses();
  }, [isDraftReady, selectedSemester.year, semester, requiredCourses]);

  function completeTimetable() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("시간표 이름은 필수입니다.");
      return;
    }

    if (!classes.length) {
      setError("강의를 직접 추가하거나 추천 후보를 선택한 뒤 저장하세요.");
      return;
    }

    const newTimetable: Timetable = {
      id: editingId?.startsWith("saved-") ? editingId : `saved-${Date.now()}`,
      userId,
      semester: semester.trim() || "2026-1",
      title: trimmedTitle,
      isSelected: false,
      score: classes.length ? 0 : 0,
      classes,
      personalSchedules,
      createdAt: new Date().toISOString()
    };

    const saved = window.localStorage.getItem(savedTimetablesKey);
    let savedTimetables: Timetable[] = [];

    try {
      savedTimetables = saved ? (JSON.parse(saved) as Timetable[]) : [];
    } catch {
      savedTimetables = [];
    }

    const withoutCurrent = savedTimetables.filter((item) => item.id !== newTimetable.id);
    window.localStorage.setItem(savedTimetablesKey, JSON.stringify([newTimetable, ...withoutCurrent]));
    window.localStorage.removeItem(draftStorageKey);
    router.push("/timetable");
  }

  function toClassSchedule(course: Course, colorOffset: number): ClassSchedule {
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
      memo: "필수 이수"
    };
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
      setError("선택한 필수 이수 강의가 기존 강의 시간과 겹칩니다.");
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
      setClasses((current) => current.filter((item) => !item.id.startsWith(classId)));
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
      setError("선택한 필수 이수 강의 시간이 기존 강의 시간과 겹칩니다.");
      return;
    }

    setSelectedRequiredCourseIds((current) => current.includes(courseName) ? current : [...current, courseName]);
    setClasses([...existingOtherClasses, ...newClasses]);
    setError("");
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
            && item.professorName === selectedClass.professorName
          ));
        })
      : null;

    return selectedOption?.id ?? "";
  }

  function generateCandidates() {
    const generated = generateTimetableCandidates({
      userId,
      department,
      grade,
      requiredCourseIds: selectedRequiredCourseIds,
      courses,
      personalSchedules
    });

    setCandidates(generated);
    setError(generated.length ? "" : "조건에 맞는 추천 시간표가 없습니다. 개인 일정이나 필수 강의를 조정해보세요.");
  }

  async function searchSungshinCourses() {
    setIsCourseLoading(true);
    setError("");
    setIsSungshinDropdownOpen(true);

    try {
      const params = new URLSearchParams({
        q: courseQuery,
        yy: selectedSemester.year,
        semCd: toSungshinSemesterCode(semester),
        term: semester
      });
      const response = await fetch(`/api/sungshin-courses?${params.toString()}`);

      if (!response.ok) {
        throw new Error("request failed");
      }

      const data = await response.json() as SungshinCourseResponse;
      setSungshinCourses(data.courses);
      setSungshinCourseCount(data.filteredCount);
      setHasNoExactCourseMatch(Boolean(data.noExactMatch));
      setIsSungshinDropdownOpen(true);
      if (!data.courses.length) {
        setError("로컬 강의 DB에서 조건에 맞는 강좌를 찾지 못했습니다.");
      } else if (data.noExactMatch) {
        setError("");
      }
    } catch {
      setSungshinCourses([]);
      setSungshinCourseCount(0);
      setHasNoExactCourseMatch(false);
      setError("로컬 강의 DB를 불러오지 못했습니다. 개발 서버를 새로고침한 뒤 다시 시도해주세요.");
    } finally {
      setIsCourseLoading(false);
    }
  }

  function addSungshinCourse(course: SungshinCourse) {
    const parsedClasses = parseSungshinCourse(course, classes.length);

    if (!parsedClasses.length) {
      setError("이 강좌의 시간표 정보를 해석하지 못했습니다.");
      return;
    }

    if (parsedClasses.some((newClass) => !isRecordedRemoteClass(newClass) && classes.some((item) => !isRecordedRemoteClass(item) && overlaps(item, newClass)))) {
      setError("선택한 강좌가 기존 강의 시간과 겹칩니다.");
      return;
    }

    setClasses((current) => [...current, ...parsedClasses]);
    setIsSungshinDropdownOpen(false);
    setError("");
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
    setCourseQuery("");
    setSungshinCourses([]);
    setSungshinCourseCount(0);
    setHasNoExactCourseMatch(false);
    setIsSungshinDropdownOpen(false);
    setError("");
    setPendingSemester(null);
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>시간표 추가/수정</h1>
        <p>계획 단계에서 정한 필수 조건을 입력한 뒤 겹치지 않는 시간표를 구성합니다.</p>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="section-title">
            <h2>기본 정보</h2>
            <span className="badge">필수</span>
          </div>
          <div className="form">
            <div className="field">
              <label htmlFor="timetable-title">시간표 이름</label>
              <input id="timetable-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="semester-year">연도/학기</label>
              <div className="select-row">
                <select
                  id="semester-year"
                  value={selectedSemester.year}
                  onChange={(event) => {
                    const nextYear = event.target.value;
                    const nextOptions = getAvailableSemesterOptions(nextYear);
                    const nextSemesterPart = nextOptions.some((option) => option.value === selectedSemester.semesterPart)
                      ? selectedSemester.semesterPart
                      : nextOptions[0].value;
                    requestSemesterChange(joinSemester(nextYear, nextSemesterPart));
                  }}
                >
                  {yearOptions.map((year) => <option key={year} value={year}>{year}년</option>)}
                </select>
                <select
                  id="semester"
                  value={selectedSemester.semesterPart}
                  onChange={(event) => requestSemesterChange(joinSemester(selectedSemester.year, event.target.value))}
                >
                  {getAvailableSemesterOptions(selectedSemester.year).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <span className="field-help">로컬 강의 DB 지원 범위: {localSemesterRangeLabel}</span>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>필수 이수 강의</h2>
            <span className="badge">{selectedRequiredCourseIds.length}개 선택</span>
          </div>
          <p className="section-note">{department} 기준 필수 이수 과목 시간을 가져옵니다. 비판적 사고와 토론, 창의적 사고와 글쓰기는 같은 시간대를 하나로 묶고 나머지는 교수님별로 표시합니다.</p>
          {isRequiredCourseLoading ? (
            <div className="list">
              <div className="list-item">
                <strong>필수 이수 강의 시간을 불러오는 중입니다.</strong>
              </div>
            </div>
          ) : (
            <div className="checkbox-list">
              {requiredCourseOptionsByName.map(({ courseName, options }) => {
                const selectedOptionId = getSelectedRequiredOptionId(courseName);
                const isSelected = selectedRequiredCourseIds.includes(courseName);

                return (
                  <label className="checkbox-card" key={courseName}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!options.length}
                      onChange={(event) => setRequiredCommonCourse(courseName, event.target.checked ? options[0]?.id ?? "" : "")}
                    />
                    <span>
                      <strong>{courseName}</strong>
                      <select
                        aria-label={`${courseName} 수업 시간`}
                        disabled={!isSelected || !options.length}
                        value={selectedOptionId}
                        onChange={(event) => setRequiredCommonCourse(courseName, event.target.value)}
                      >
                        {!options.length ? (
                          <option value="">선택 학기 데이터 없음</option>
                        ) : (
                          <>
                            <option value="">시간 선택</option>
                            {options.map((option) => (
                              <option value={option.id} key={option.id}>
                                {[option.professorName, option.scheduleText, option.campusName, option.roomLabel, `${option.count}개 분반`].filter(Boolean).join(" · ")}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="grid two" style={{ marginTop: 16 }}>
        <article className="panel">
          <div className="section-title">
            <h2>강의 직접 추가</h2>
            <span className="badge">수강신청 강좌</span>
          </div>
          <div className="form">
            <div className="field">
              <label htmlFor="sungshin-course-query">강의 직접 추가</label>
              <div className="dropdown-field" ref={sungshinSearchRef}>
                <input
                  id="sungshin-course-query"
                  placeholder="예: 마케팅원론, 윤성욱, 경영학과"
                  value={courseQuery}
                  onFocus={() => setIsSungshinDropdownOpen(true)}
                  onChange={(event) => {
                    setCourseQuery(event.target.value);
                    setIsSungshinDropdownOpen(false);
                    setHasNoExactCourseMatch(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      searchSungshinCourses();
                    }
                  }}
                />
                {isSungshinDropdownOpen && sungshinCourses.length ? (
                  <div className="search-dropdown">
                    <div className="dropdown-summary">
                      {hasNoExactCourseMatch
                        ? `일치하는 강좌가 없어 ${selectedSemester.year}년 ${semesterOptions.find((option) => option.value === selectedSemester.semesterPart)?.label ?? "선택 학기"} 전체 강좌를 보여드립니다.`
                        : `검색 결과 ${sungshinCourseCount.toLocaleString("ko-KR")}개`}
                    </div>
                    {sungshinCourses.map((course) => (
                      <div className="dropdown-item" key={course.id}>
                        <strong>
                          [{course.courseName}] - {course.professorName || "교수 미정"}
                          {course.classNumber && course.classNumber !== "001" ? ` (${course.classNumber})` : ""}
                        </strong>
                        <span>{course.departmentName} · {course.scheduleText || "시간 미정"} · {getCourseRoomLabel(course)}</span>
                        <button className="dropdown-add-button" type="button" onClick={() => addSungshinCourse(course)}>강의 추가하기</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <button className="button" type="button" onClick={searchSungshinCourses} disabled={isCourseLoading}>
              {isCourseLoading ? "불러오는 중" : "강좌 불러오기"}
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>개인 일정</h2>
            <span className="badge">드래그로 추가</span>
          </div>
          <p className="section-note">원하는 시간대를 드래그한 뒤 놓으면 일정 이름을 정할 수 있습니다.</p>
          <PersonalSchedulePlanner
            personalSchedules={personalSchedules}
            userId={userId}
            onAddSchedule={(schedule) => {
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
        </article>
      </section>

      {error ? <div className="error" style={{ marginTop: 16 }}>{error}</div> : null}

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title">
          <h2>미리보기</h2>
          <div className="chip-row">
            <button className="ghost-button" type="button" onClick={generateCandidates}>추천 후보 생성</button>
            <button className="button" type="button" onClick={completeTimetable}>저장하고 완료</button>
          </div>
        </div>
        <WeeklyTimetable classes={classes} personalSchedules={personalSchedules} />
      </section>

      {candidates.length ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="section-title">
            <h2>추천 후보</h2>
            <span className="badge">평점순</span>
          </div>
          <div className="list">
            {candidates.map((candidate) => (
              <button className="list-item" style={{ textAlign: "left" }} type="button" key={candidate.id} onClick={() => setClasses(candidate.classes)}>
                <strong>{candidate.title}</strong>
                <span className="muted">평균 {candidate.score.toFixed(2)}점 · {candidate.classes.length}과목 · {title} / {semester}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {pendingSemester ? (
        <div className="modal-backdrop">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="change-semester-title">
            <div>
              <h2 id="change-semester-title">학기 변경</h2>
              <p>{getSemesterLabel(pendingSemester)}로 변경하겠습니까?</p>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setPendingSemester(null)}>아니오</button>
              <button className="button" type="button" onClick={confirmSemesterChange}>예</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function PersonalSchedulePlanner({
  personalSchedules,
  userId,
  onAddSchedule,
  onDeleteSchedule
}: {
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

  const visibleSchedules = personalSchedules.filter((item) => weekdays.includes(item.dayOfWeek as DayOfWeek));

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
        <div className="modal-backdrop">
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
        <div className="modal-backdrop">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-personal-schedule-title">
            <div>
              <h2 id="delete-personal-schedule-title">개인 일정 삭제</h2>
              <p>{deletingSchedule.title} 일정을 삭제할까요?</p>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setDeletingSchedule(null)}>아니오</button>
              <button className="button danger-button" type="button" onClick={confirmDeleteSchedule}>예</button>
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

function getPlannerSelectionStyle(selection: PersonalDragSelection) {
  const start = Math.min(selection.anchorMinutes, selection.currentMinutes);
  const end = Math.max(selection.anchorMinutes, selection.currentMinutes);

  return {
    "--day-index": weekdays.indexOf(selection.dayOfWeek),
    "--start-slot": (start - plannerStartMinutes) / 60,
    "--duration-slots": Math.max((end - start) / 60, 0.5)
  } as CSSProperties;
}
