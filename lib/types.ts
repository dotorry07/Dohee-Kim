export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI";
export type AnyDayOfWeek = DayOfWeek | "SAT" | "SUN";
export type Role = "user" | "admin";

export interface UserProfile {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  nickname: string;
  department: string;
  secondaryDepartment?: string;
  studentNumber?: string;
  grade: 1 | 2 | 3 | 4;
  role: Role;
  createdAt: string;
}

export interface Course {
  id: string;
  department: string;
  grade: number;
  courseName: string;
  professorName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  buildingName: string;
  roomName: string;
  requiredType: "required" | "elective";
  createdAt: string;
}

export interface ClassSchedule {
  id: string;
  timetableId: string;
  courseId?: string;
  courseName: string;
  professorName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  buildingName: string;
  roomName: string;
  lessonTypeName?: string;
  color: string;
  memo?: string;
}

export interface PersonalSchedule {
  id: string;
  userId: string;
  title: string;
  dayOfWeek: AnyDayOfWeek;
  startTime: string;
  endTime: string;
  memo?: string;
}

export interface Timetable {
  id: string;
  userId: string;
  semester: string;
  title: string;
  isSelected: boolean;
  score: number;
  classes: ClassSchedule[];
  personalSchedules?: PersonalSchedule[];
  createdAt: string;
}

export interface CampusPlace {
  id: string;
  campus: "donam" | "unjeong";
  name: string;
  category: "lecture" | "library" | "student" | "food" | "admin" | "facility";
  description: string;
  buildingName: string;
  floor: string;
  mapX: number;
  mapY: number;
  latitude: number;
  longitude: number;
  tags: string[];
}

export interface CampusShortcutEndpoint {
  label: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}

export interface CampusShortcut {
  id: string;
  campus: CampusPlace["campus"];
  endpoints: [CampusShortcutEndpoint, CampusShortcutEndpoint];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface BoardPost {
  id: string;
  userId: string;
  authorName: string;
  category: "freshman" | "free" | "department" | "info";
  title: string;
  content: string;
  viewCount: number;
  recommendCount: number;
  recommendedUserIds: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  category: "academic" | "scholarship" | "registration" | "event" | "career" | "general";
  title: string;
  summary: string;
  imageUrl?: string;
  applicationUrl?: string;
  applicationDeadline?: string;
  isExpired?: boolean;
  sourceUrl?: string;
  isPinned: boolean;
  publishedAt: string;
  createdAt: string;
}
