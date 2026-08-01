import type { BoardPost, ClassSchedule, Notice, UserProfile } from "@/lib/types";

export type DashboardUser = UserProfile;
export type DashboardClass = ClassSchedule;
export type DashboardNotice = Notice;
export type DashboardPost = BoardPost;

export interface AcademicEvent { id: string; title: string; startDate: string; endDate?: string; displayDate: string }
export interface ChecklistItem { id: string; label: string; completed: boolean }
export interface MealMenu { cafeteria: string; menus: string[]; hours: string; price: string; status: "AVAILABLE" | "CLOSING_SOON" | "CLOSED" }
export type ScheduleType = "CLASS" | "PART_TIME" | "CLUB" | "PERSONAL" | "OTHER";
export interface TodayScheduleItem { id: string; type: ScheduleType; title: string; startTime: string; endTime?: string; location?: string; subtitle?: string }
export type DashboardIconName = "calendar" | "notice" | "user" | "chat" | "clock" | "meal";
