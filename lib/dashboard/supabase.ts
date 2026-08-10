import type { UserProfile } from "@/lib/types";
import type { ChecklistItem, DashboardData, TodayScheduleItem } from "@/types/dashboard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DashboardSupabaseResult = {
  user: UserProfile;
  data: DashboardData;
  checklistItems: ChecklistItem[];
  databaseUserId: string | null;
};

const dayCodes = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export async function loadDashboardFromSupabase(
  fallbackUser: UserProfile,
  fallbackData: DashboardData,
  fallbackChecklist: ChecklistItem[]
): Promise<DashboardSupabaseResult> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return { user: fallbackUser, data: fallbackData, checklistItems: fallbackChecklist, databaseUserId: null };
  }

  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("id, auth_user_id, email, name, nickname, department, grade, role, created_at")
      .eq("email", fallbackUser.email)
      .maybeSingle();

    if (error || !profile) {
      return { user: fallbackUser, data: fallbackData, checklistItems: fallbackChecklist, databaseUserId: null };
    }

    const databaseUser: UserProfile = {
      id: profile.id,
      authUserId: profile.auth_user_id ?? fallbackUser.authUserId,
      email: profile.email,
      name: profile.name,
      nickname: profile.nickname,
      department: profile.department,
      grade: profile.grade as UserProfile["grade"],
      role: profile.role as UserProfile["role"],
      createdAt: profile.created_at
    };

    const [timetableResult, personalResult, checklistResult] = await Promise.all([
      supabase
        .from("timetables")
        .select("id, user_id, semester, title, is_selected, score, created_at, class_schedules(id, timetable_id, course_id, course_name, professor_name, day_of_week, start_time, end_time, building_name, room_name, color, memo)")
        .eq("user_id", profile.id)
        .eq("is_selected", true),
      supabase
        .from("personal_schedules")
        .select("id, title, start_time, end_time, memo")
        .eq("user_id", profile.id)
        .eq("day_of_week", dayCodes[new Date().getDay()]),
      supabase
        .from("freshman_checklist_items")
        .select("item_key, label, completed")
        .eq("user_id", profile.id)
        .order("sort_order")
    ]);

    const timetables = !timetableResult.error && timetableResult.data?.length
      ? timetableResult.data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          semester: row.semester,
          title: row.title,
          isSelected: row.is_selected,
          score: Number(row.score),
          createdAt: row.created_at,
          classes: (row.class_schedules ?? []).map((item) => ({
            id: item.id,
            timetableId: item.timetable_id,
            courseId: item.course_id ?? undefined,
            courseName: item.course_name,
            professorName: item.professor_name,
            dayOfWeek: item.day_of_week,
            startTime: item.start_time,
            endTime: item.end_time,
            buildingName: item.building_name,
            roomName: item.room_name,
            color: item.color,
            memo: item.memo ?? undefined
          }))
        })) as DashboardData["timetables"]
      : fallbackData.timetables;

    const personalTodaySchedules: TodayScheduleItem[] = !personalResult.error && personalResult.data?.length
      ? personalResult.data.map((row) => ({
          id: row.id,
          type: "PERSONAL",
          title: row.title,
          startTime: row.start_time,
          endTime: row.end_time,
          subtitle: row.memo ?? undefined
        }))
      : fallbackData.personalTodaySchedules;

    const checklistItems: ChecklistItem[] = !checklistResult.error && checklistResult.data?.length
      ? checklistResult.data.map((row) => ({ id: row.item_key, label: row.label, completed: row.completed }))
      : fallbackChecklist;

    return {
      user: databaseUser,
      data: { ...fallbackData, timetables, personalTodaySchedules },
      checklistItems,
      databaseUserId: profile.id
    };
  } catch {
    return { user: fallbackUser, data: fallbackData, checklistItems: fallbackChecklist, databaseUserId: null };
  }
}

export async function saveChecklistItem(databaseUserId: string, item: ChecklistItem) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("freshman_checklist_items").upsert(
      {
        user_id: databaseUserId,
        item_key: item.id,
        label: item.label,
        completed: item.completed
      },
      { onConflict: "user_id,item_key" }
    );
    return !error;
  } catch {
    return false;
  }
}
