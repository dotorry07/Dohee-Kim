import type { BoardPost, ClassSchedule, Notice, Timetable, UserProfile } from "@/lib/types";

export type DashboardUser = UserProfile;
export type DashboardClass = ClassSchedule;
export type DashboardNotice = Notice;
export type DashboardPost = BoardPost;

export interface DashboardData {
  timetables: Timetable[];
  notices: Notice[];
  posts: BoardPost[];
  academicEvents: AcademicEvent[];
  personalTodaySchedules: TodayScheduleItem[];
  campusMeals: Record<MealCampus, MealMenu>;
}

export interface DashboardViewData {
  user: DashboardUser;
  data: DashboardData;
  checklistItems: ChecklistItem[];
  databaseUserId: string | null;
}

export interface AcademicEvent { id: string; title: string; startDate: string; endDate?: string; displayDate: string }
export interface ChecklistItem { id: string; label: string; completed: boolean }
export type MealCampus = "sujeong" | "unjeong";
export type MealWeekday = "MON" | "TUE" | "WED" | "THU" | "FRI";
export interface MealMenu { cafeteria: string; menusByDay: Partial<Record<MealWeekday, string[]>>; hours: string; price: string }
export type ScheduleType = "CLASS" | "PART_TIME" | "CLUB" | "PERSONAL" | "OTHER";
export interface TodayScheduleItem { id: string; type: ScheduleType; title: string; startTime: string; endTime?: string; location?: string; subtitle?: string }
export type DashboardIconName = "calendar" | "notice" | "user" | "chat" | "clock" | "meal";
