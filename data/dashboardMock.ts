import type { AcademicEvent, ChecklistItem, MealMenu, TodayScheduleItem } from "@/types/dashboard";

// TODO: 학사일정 API가 준비되면 이 mock을 서버 응답으로 교체합니다.
export const academicEvents: AcademicEvent[] = [
  { id: "registration", title: "수강신청", startDate: "2026-08-03", displayDate: "2026. 8. 3. (월) 09:00" },
  { id: "semester", title: "2학기 개강", startDate: "2026-08-31", displayDate: "2026. 8. 31. (월)" },
  { id: "midterm", title: "중간고사", startDate: "2026-10-19", endDate: "2026-10-23", displayDate: "2026. 10. 19. ~ 10. 23." },
  { id: "final", title: "기말고사", startDate: "2026-12-14", endDate: "2026-12-18", displayDate: "2026. 12. 14. ~ 12. 18." }
];

// TODO: 사용자별 체크리스트 API가 준비되면 storage adapter만 교체합니다.
export const freshmanChecklist: ChecklistItem[] = [
  { id: "student-card", label: "학생증 발급 신청", completed: false },
  { id: "library-card", label: "도서관 모바일 열람증 등록", completed: false },
  { id: "course-cart", label: "수강신청 장바구니 담기", completed: false },
  { id: "lms-login", label: "LMS 최초 로그인", completed: false },
  { id: "campus-wifi", label: "교내 Wi-Fi 연결", completed: false }
];

// TODO: 학식 API가 준비되면 이 mock을 서버 응답으로 교체합니다.
export const todayMeal: MealMenu | null = {
  cafeteria: "학생식당",
  menus: ["돈육김치찌개", "계란말이", "제철 나물"],
  hours: "11:00 - 14:00",
  price: "5,500원",
  status: "AVAILABLE"
};

// TODO: 개인 일정 API가 준비되면 이 예시 일정을 사용자 일정으로 교체합니다.
export const personalTodaySchedules: TodayScheduleItem[] = [
  { id: "club-orientation", type: "CLUB", title: "새내기 OT 준비", startTime: "13:00", endTime: "15:00", location: "학생회관", subtitle: "동아리 운영진 모임" },
  { id: "part-time-cafe", type: "PART_TIME", title: "카페 근무", startTime: "18:00", endTime: "22:00", location: "성신여대입구점", subtitle: "저녁 근무" }
];
