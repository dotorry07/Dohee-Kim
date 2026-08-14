import type { UserProfile } from "@/lib/types";
import { loadRemoteTimetables } from "@/lib/timetable-storage";
import type { ChecklistItem, DashboardData } from "@/types/dashboard";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DashboardSupabaseResult = {
  user: UserProfile;
  data: DashboardData;
  checklistItems: ChecklistItem[];
  databaseUserId: string | null;
};

export async function loadDashboardFromSupabase(
  fallbackUser: UserProfile,
  fallbackData: DashboardData,
  fallbackChecklist: ChecklistItem[]
): Promise<DashboardSupabaseResult> {
  const remoteTimetables = await loadDashboardTimetables(fallbackUser, fallbackData);
  const remoteDatabaseUserId = remoteTimetables.find((timetable) => timetable.userId)?.userId ?? null;
  const supabase = createSupabaseBrowserClient();

  if (!supabase) {
    return {
      user: fallbackUser,
      data: { ...fallbackData, timetables: remoteTimetables, personalTodaySchedules: [] },
      checklistItems: fallbackChecklist,
      databaseUserId: remoteDatabaseUserId
    };
  }

  try {
      const { data: profile, error } = await supabase
      .from("users")
      .select("id, auth_user_id, email, name, nickname, users_nickname, department, secondary_department, student_number, profile_image_url, grade, role, created_at")
      .eq("email", fallbackUser.email)
      .maybeSingle();

    if (error || !profile) {
      return {
        user: fallbackUser,
        data: { ...fallbackData, timetables: remoteTimetables, personalTodaySchedules: [] },
        checklistItems: fallbackChecklist,
        databaseUserId: remoteDatabaseUserId
      };
    }

    const databaseUser: UserProfile = {
      id: profile.id,
      authUserId: profile.auth_user_id ?? fallbackUser.authUserId,
      email: profile.email,
      name: profile.name,
      nickname: profile.users_nickname || profile.nickname,
      department: profile.department,
      secondaryDepartment: profile.secondary_department ?? "",
      studentNumber: profile.student_number ?? "",
      profileImageUrl: profile.profile_image_url ?? "",
      grade: profile.grade as UserProfile["grade"],
      role: profile.role as UserProfile["role"],
      createdAt: profile.created_at
    };

    const checklistResult = await supabase
        .from("freshman_checklist_items")
        .select("item_key, label, completed")
        .eq("user_id", profile.id)
        .order("sort_order");

    const checklistItems: ChecklistItem[] = !checklistResult.error && checklistResult.data?.length
      ? checklistResult.data.map((row) => ({ id: row.item_key, label: row.label, completed: row.completed }))
      : fallbackChecklist;

    return {
      user: databaseUser,
      data: { ...fallbackData, timetables: remoteTimetables, personalTodaySchedules: [] },
      checklistItems,
      databaseUserId: profile.id
    };
  } catch {
    return {
      user: fallbackUser,
      data: { ...fallbackData, timetables: remoteTimetables, personalTodaySchedules: [] },
      checklistItems: fallbackChecklist,
      databaseUserId: remoteDatabaseUserId
    };
  }
}

async function loadDashboardTimetables(fallbackUser: UserProfile, fallbackData: DashboardData) {
  try {
    return await loadRemoteTimetables(fallbackUser);
  } catch {
    return fallbackData.timetables;
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
