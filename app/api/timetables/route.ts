import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type { ClassSchedule, PersonalSchedule, Timetable, UserProfile } from "@/lib/types";

interface TimetableRequestBody {
  action?: "list" | "save" | "delete" | "select-monthly";
  user?: UserProfile;
  timetable?: Timetable;
  timetableId?: string;
  semester?: string;
}

interface RemoteTimetableRow {
  id: string;
  user_id: string;
  semester: string;
  title: string;
  is_selected: boolean;
  score: number;
  created_at: string;
  class_schedules?: RemoteClassScheduleRow[];
  personal_schedules?: RemotePersonalScheduleRow[];
}

interface RemoteClassScheduleRow {
  id: string;
  timetable_id: string;
  course_id: string | null;
  course_name: string;
  professor_name: string;
  day_of_week: ClassSchedule["dayOfWeek"];
  start_time: string;
  end_time: string;
  building_name: string;
  room_name: string;
  lesson_type_name: string | null;
  credits: string | null;
  color: string;
  memo: string | null;
}

interface RemotePersonalScheduleRow {
  id: string;
  user_id: string;
  timetable_id?: string | null;
  title: string;
  day_of_week: PersonalSchedule["dayOfWeek"];
  start_time: string;
  end_time: string;
  memo: string | null;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json() as TimetableRequestBody;

    if (!body.user) {
      return NextResponse.json({ error: "Missing user." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const userId = await ensureUserId(body.user);

    if (body.action === "list") {
      const { data: timetableRows, error } = await supabase
        .from("timetables")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const rows = timetableRows as RemoteTimetableRow[];
      const timetableIds = rows.map((item) => item.id);
      const classRows = await loadClassSchedules(timetableIds);
      const personalRows = await loadPersonalSchedules(timetableIds);
      const classesByTimetableId = groupByTimetableId(classRows);
      const personalByTimetableId = groupByTimetableId(personalRows);

      return NextResponse.json({
        timetables: rows.map((row) => toTimetable({
          ...row,
          class_schedules: classesByTimetableId.get(row.id) ?? [],
          personal_schedules: personalByTimetableId.get(row.id) ?? []
        }))
      });
    }

    if (body.action === "save") {
      if (!body.timetable) {
        return NextResponse.json({ error: "Missing timetable." }, { status: 400 });
      }

      const timetable = await saveTimetable(userId, body.timetable);
      return NextResponse.json({ timetable });
    }

    if (body.action === "delete") {
      if (!body.timetableId || !isUuid(body.timetableId)) {
        return NextResponse.json({ ok: true });
      }

      const { error } = await supabase.from("timetables").delete().eq("id", body.timetableId).eq("user_id", userId);

      if (error) {
        throw error;
      }

      return NextResponse.json({ ok: true });
    }

    if (body.action === "select-monthly") {
      if (!body.timetableId || !body.semester || !isUuid(body.timetableId)) {
        return NextResponse.json({ ok: true });
      }

      const reset = await supabase
        .from("timetables")
        .update({ is_selected: false })
        .eq("user_id", userId)
        .eq("semester", body.semester);

      if (reset.error) {
        throw reset.error;
      }

      const selected = await supabase
        .from("timetables")
        .update({ is_selected: true })
        .eq("id", body.timetableId)
        .eq("user_id", userId);

      if (selected.error) {
        throw selected.error;
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Timetable API failed", error);
    if (isMissingSchemaError(error)) {
      return NextResponse.json({
        error: "Supabase 시간표 테이블이 아직 생성되지 않았습니다. supabase/migrations의 SQL을 Supabase SQL Editor에 적용하세요.",
        timetables: []
      }, { status: 424 });
    }

    return NextResponse.json({ error: "Timetable request failed." }, { status: 500 });
  }
}

function isMissingSchemaError(error: unknown) {
  return Boolean(
    error
    && typeof error === "object"
    && "code" in error
    && (error as { code?: string }).code === "PGRST205"
  );
}

async function loadClassSchedules(timetableIds: string[]) {
  if (!timetableIds.length) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("class_schedules").select("*").in("timetable_id", timetableIds);

  if (error) {
    throw error;
  }

  return data as RemoteClassScheduleRow[];
}

async function loadPersonalSchedules(timetableIds: string[]) {
  if (!timetableIds.length) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("personal_schedules").select("*").in("timetable_id", timetableIds);

  if (error) {
    console.warn("Personal schedules are unavailable. Apply the timetable_id migration to enable them.", error);
    return [];
  }

  return data as RemotePersonalScheduleRow[];
}

function groupByTimetableId<T extends { timetable_id?: string | null }>(rows: T[]) {
  return rows.reduce<Map<string, T[]>>((grouped, row) => {
    if (!row.timetable_id) {
      return grouped;
    }

    grouped.set(row.timetable_id, [...(grouped.get(row.timetable_id) ?? []), row]);
    return grouped;
  }, new Map());
}

async function ensureUserId(user: UserProfile) {
  const supabase = createSupabaseAdminClient();
  const existing = await supabase.from("users").select("id").eq("email", user.email).maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const created = await supabase
    .from("users")
    .insert({
      auth_user_id: isUuid(user.authUserId) ? user.authUserId : null,
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      department: user.department,
      secondary_department: user.secondaryDepartment || null,
      grade: user.grade,
      role: user.role
    })
    .select("id")
    .single();

  if (created.error) {
    throw created.error;
  }

  return created.data.id as string;
}

async function saveTimetable(userId: string, timetable: Timetable) {
  const supabase = createSupabaseAdminClient();
  const existingRemoteId = isUuid(timetable.id) ? timetable.id : null;
  const title = await getUniqueTimetableTitle(userId, timetable.title, existingRemoteId);
  const payload = {
    user_id: userId,
    semester: timetable.semester,
    title,
    is_selected: timetable.isSelected,
    score: timetable.score
  };
  const result = existingRemoteId
    ? await supabase.from("timetables").update(payload).eq("id", existingRemoteId).eq("user_id", userId).select().single()
    : await supabase.from("timetables").insert(payload).select().single();

  if (result.error) {
    throw result.error;
  }

  const saved = result.data as RemoteTimetableRow;

  await replaceClassSchedules(saved.id, timetable.classes);
  await replacePersonalSchedules(userId, saved.id, timetable.personalSchedules ?? []);

  return {
    ...timetable,
    id: saved.id,
    userId,
    title: saved.title,
    createdAt: saved.created_at
  };
}

async function getUniqueTimetableTitle(userId: string, baseTitle: string, currentTimetableId: string | null) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("timetables")
    .select("id,title")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const existingTitles = new Set(
    ((data ?? []) as Pick<RemoteTimetableRow, "id" | "title">[])
      .filter((item) => item.id !== currentTimetableId)
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

async function replaceClassSchedules(timetableId: string, classes: ClassSchedule[]) {
  const supabase = createSupabaseAdminClient();
  const deleted = await supabase.from("class_schedules").delete().eq("timetable_id", timetableId);

  if (deleted.error) {
    throw deleted.error;
  }

  if (!classes.length) {
    return;
  }

  const rows = classes.map((item) => ({
    timetable_id: timetableId,
    course_id: item.courseId && isUuid(item.courseId) ? item.courseId : null,
    course_name: item.courseName,
    professor_name: item.professorName,
    day_of_week: item.dayOfWeek,
    start_time: item.startTime,
    end_time: item.endTime,
    building_name: item.buildingName,
    room_name: item.roomName,
    lesson_type_name: item.lessonTypeName ?? null,
    credits: item.credits ?? null,
    color: item.color,
    memo: item.memo ?? null
  }));

  await insertClassSchedulesWithSchemaFallback(rows);
}

async function insertClassSchedulesWithSchemaFallback(rows: Record<string, string | null>[]) {
  const optionalColumns = ["lesson_type_name", "credits"];
  let rowsToInsert = rows;

  for (let attempt = 0; attempt <= optionalColumns.length; attempt += 1) {
    const supabase = createSupabaseAdminClient();
    const inserted = await supabase.from("class_schedules").insert(rowsToInsert);

    if (!inserted.error) {
      return;
    }

    const missingColumn = getMissingOptionalColumn(inserted.error, optionalColumns);

    if (!missingColumn) {
      throw inserted.error;
    }

    rowsToInsert = rowsToInsert.map((row) => {
      const { [missingColumn]: _missing, ...rest } = row;
      return rest;
    });
  }
}

function getMissingOptionalColumn(error: unknown, optionalColumns: string[]) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code = "code" in error ? (error as { code?: string }).code : undefined;
  const message = "message" in error ? (error as { message?: string }).message ?? "" : "";

  if (code !== "PGRST204" && code !== "42703" && !message.includes("Could not find") && !message.includes("does not exist")) {
    return null;
  }

  return optionalColumns.find((column) => message.includes(column)) ?? null;
}

async function replacePersonalSchedules(userId: string, timetableId: string, personalSchedules: PersonalSchedule[]) {
  const supabase = createSupabaseAdminClient();
  const deleted = await supabase.from("personal_schedules").delete().eq("timetable_id", timetableId);

  if (deleted.error) {
    console.warn("Personal schedule delete skipped. Apply the timetable_id migration to enable it.", deleted.error);
    return;
  }

  if (!personalSchedules.length) {
    return;
  }

  const inserted = await supabase.from("personal_schedules").insert(personalSchedules.map((item) => ({
    user_id: userId,
    timetable_id: timetableId,
    title: item.title,
    day_of_week: item.dayOfWeek,
    start_time: item.startTime,
    end_time: item.endTime,
    memo: item.memo ?? null
  })));

  if (inserted.error) {
    throw inserted.error;
  }
}

function toTimetable(row: RemoteTimetableRow): Timetable {
  return {
    id: row.id,
    userId: row.user_id,
    semester: row.semester,
    title: row.title,
    isSelected: row.is_selected,
    score: Number(row.score),
    classes: (row.class_schedules ?? []).map(toClassSchedule),
    personalSchedules: (row.personal_schedules ?? []).map(toPersonalSchedule),
    createdAt: row.created_at
  };
}

function toClassSchedule(row: RemoteClassScheduleRow): ClassSchedule {
  return {
    id: row.id,
    timetableId: row.timetable_id,
    courseId: row.course_id ?? undefined,
    courseName: row.course_name,
    professorName: row.professor_name,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    buildingName: row.building_name,
    roomName: row.room_name,
    lessonTypeName: row.lesson_type_name ?? undefined,
    credits: row.credits ?? undefined,
    color: row.color,
    memo: row.memo ?? undefined
  };
}

function toPersonalSchedule(row: RemotePersonalScheduleRow): PersonalSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    memo: row.memo ?? undefined
  };
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}
