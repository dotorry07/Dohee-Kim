import type { AcademicEvent, ChecklistItem, MealCampus, MealMenu, TodayScheduleItem } from "@/types/dashboard";

// TODO: 학사일정 API가 준비되면 이 mock을 서버 응답으로 교체합니다.
export const academicEvents: AcademicEvent[] = [
  { id: "registration", title: "수강신청", startDate: "2026-08-19", displayDate: "2026. 08. 19." },
  { id: "semester", title: "2학기 개강", startDate: "2026-09-01", displayDate: "2026. 09. 01." },
  { id: "midterm", title: "중간고사", startDate: "2026-10-19", displayDate: "2026. 10. 19." },
  { id: "final", title: "기말고사", startDate: "2026-12-14", displayDate: "2026. 12. 14." }
];

// TODO: 사용자별 체크리스트 API가 준비되면 storage adapter만 교체합니다.
export const freshmanChecklist: ChecklistItem[] = [
  { id: "campus-wifi", label: "교내 Wi-Fi 연결하기", completed: false },
  { id: "lms-login", label: "LMS 최초 로그인", completed: false },
  { id: "mobile-id", label: "성신 모바일 신분증 앱 설치 및 발급하기", completed: false },
  { id: "course-cart", label: "수강신청 장바구니 담기", completed: false },
  { id: "sujeong-shortcut", label: "수정캠 지름길 확인하기", completed: false },
  { id: "portal-password", label: "통합정보시스템 비밀번호 변경", completed: false },
  { id: "campus-food", label: "교내 식당/카페 위치 확인하기", completed: false }
];

// TODO: 학식 API가 준비되면 캠퍼스/요일 키를 유지한 채 서버 응답으로 교체합니다.
export const campusMeals: Record<MealCampus, MealMenu> = {
  sujeong: {
    cafeteria: "수정관 A동 10층 교내식당 1 (백반)",
    menusByDay: {
      MON: ["돈육김치찌개", "계란말이", "제철 나물"],
      TUE: ["닭갈비", "미역국", "두부조림"],
      WED: ["소불고기", "된장찌개", "잡채"],
      THU: ["고등어구이", "콩나물국", "감자조림"],
      FRI: ["제육볶음", "어묵국", "상추겉절이"]
    },
    hours: "11:00 - 14:00",
    price: "5,500원"
  },
  unjeong: {
    cafeteria: "P동 10층 교내식당",
    menusByDay: {
      MON: ["닭개장", "동그랑땡전", "오이무침"],
      TUE: ["돈가스", "크림스프", "양배추샐러드"],
      WED: ["불고기비빔밥", "유부장국", "만두튀김"],
      THU: ["순두부찌개", "떡갈비", "콩나물무침"],
      FRI: ["카레라이스", "치킨가라아게", "단무지무침"]
    },
    hours: "11:00 - 14:00",
    price: "5,500원"
  }
};

// TODO: 개인 일정 API가 준비되면 이 예시 일정을 사용자 일정으로 교체합니다.
export const personalTodaySchedules: TodayScheduleItem[] = [
  { id: "club-orientation", type: "CLUB", title: "새내기 OT 준비", startTime: "13:00", endTime: "15:00", location: "학생회관", subtitle: "동아리 운영진 모임" },
  { id: "part-time-cafe", type: "PART_TIME", title: "카페 근무", startTime: "18:00", endTime: "22:00", location: "성신여대입구점", subtitle: "저녁 근무" }
];
