import type { BoardPost, CampusPlace, Course, CourseReview, Notice, PersonalSchedule, Timetable, UserProfile } from "@/lib/types";

export const departments = ["컴퓨터공학과", "AI융합학부", "경영학과", "미디어커뮤니케이션학과", "간호학과"];
export const grades = [1, 2, 3, 4] as const;

export const demoUser: UserProfile = {
  id: "user-1",
  authUserId: "auth-demo",
  email: "freshman@sungshin.ac.kr",
  name: "김새내",
  nickname: "새내기",
  department: "컴퓨터공학과",
  grade: 1,
  role: "user",
  createdAt: "2026-03-01T09:00:00.000Z"
};

export const courses: Course[] = [
  {
    id: "course-1",
    department: "컴퓨터공학과",
    grade: 1,
    courseName: "컴퓨팅사고",
    professorName: "박지현",
    dayOfWeek: "MON",
    startTime: "09:00",
    endTime: "10:30",
    buildingName: "수정관",
    roomName: "304",
    requiredType: "required",
    reviewAverage: 4.7,
    createdAt: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "course-2",
    department: "컴퓨터공학과",
    grade: 1,
    courseName: "프로그래밍기초",
    professorName: "이도윤",
    dayOfWeek: "TUE",
    startTime: "10:30",
    endTime: "12:00",
    buildingName: "성신관",
    roomName: "210",
    requiredType: "required",
    reviewAverage: 4.9,
    createdAt: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "course-3",
    department: "컴퓨터공학과",
    grade: 1,
    courseName: "이산수학",
    professorName: "정하은",
    dayOfWeek: "WED",
    startTime: "13:00",
    endTime: "14:30",
    buildingName: "수정관",
    roomName: "502",
    requiredType: "required",
    reviewAverage: 4.4,
    createdAt: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "course-4",
    department: "컴퓨터공학과",
    grade: 1,
    courseName: "신입생세미나",
    professorName: "최민서",
    dayOfWeek: "THU",
    startTime: "15:00",
    endTime: "16:00",
    buildingName: "난향관",
    roomName: "101",
    requiredType: "required",
    reviewAverage: 4.6,
    createdAt: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "course-5",
    department: "컴퓨터공학과",
    grade: 1,
    courseName: "데이터와사회",
    professorName: "문서연",
    dayOfWeek: "FRI",
    startTime: "11:00",
    endTime: "12:30",
    buildingName: "성신관",
    roomName: "407",
    requiredType: "elective",
    reviewAverage: 4.2,
    createdAt: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "course-6",
    department: "컴퓨터공학과",
    grade: 1,
    courseName: "기초통계",
    professorName: "서유진",
    dayOfWeek: "MON",
    startTime: "14:00",
    endTime: "15:30",
    buildingName: "수정관",
    roomName: "412",
    requiredType: "elective",
    reviewAverage: 4.1,
    createdAt: "2026-02-01T00:00:00.000Z"
  }
];

export const personalSchedules: PersonalSchedule[] = [
  {
    id: "personal-1",
    userId: demoUser.id,
    title: "통학 고정 시간",
    dayOfWeek: "FRI",
    startTime: "16:00",
    endTime: "18:00",
    memo: "금요일은 일찍 출발"
  }
];

export const timetables: Timetable[] = [
  {
    id: "timetable-1",
    userId: demoUser.id,
    semester: "2026-1",
    title: "1학년 1학기 추천안",
    isSelected: true,
    score: 4.58,
    classes: courses.slice(0, 4).map((course, index) => ({
      id: `class-${course.id}`,
      timetableId: "timetable-1",
      courseId: course.id,
      courseName: course.courseName,
      professorName: course.professorName,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      buildingName: course.buildingName,
      roomName: course.roomName,
      color: ["#582f82", "#7350a0", "#8b5fbf", "#442363"][index],
      memo: course.requiredType === "required" ? "필수 이수" : ""
    })),
    createdAt: "2026-03-02T09:00:00.000Z"
  }
];

export const campusPlaces: CampusPlace[] = [
  {
    id: "place-1",
    name: "수정관",
    category: "lecture",
    description: "컴퓨터공학과 전공 수업과 실습실이 많은 강의동입니다.",
    buildingName: "수정관",
    floor: "1F-7F",
    mapX: 35,
    mapY: 42,
    tags: ["강의동", "실습실", "전공"]
  },
  {
    id: "place-2",
    name: "성신관",
    category: "lecture",
    description: "교양 수업과 대형 강의가 자주 열리는 중심 강의동입니다.",
    buildingName: "성신관",
    floor: "B1-8F",
    mapX: 55,
    mapY: 35,
    tags: ["강의동", "교양", "대형강의"]
  },
  {
    id: "place-3",
    name: "중앙도서관",
    category: "library",
    description: "열람실, 자료실, 스터디룸을 이용할 수 있습니다.",
    buildingName: "중앙도서관",
    floor: "1F-6F",
    mapX: 70,
    mapY: 56,
    tags: ["도서관", "열람실", "스터디룸"]
  },
  {
    id: "place-4",
    name: "학생회관",
    category: "student",
    description: "동아리방, 학생지원 부서, 휴게 공간이 모여 있습니다.",
    buildingName: "학생회관",
    floor: "1F-5F",
    mapX: 43,
    mapY: 68,
    tags: ["동아리", "학생지원", "휴게"]
  },
  {
    id: "place-5",
    name: "난향관 카페",
    category: "food",
    description: "수업 사이에 간단히 식사하거나 음료를 마시기 좋은 공간입니다.",
    buildingName: "난향관",
    floor: "1F",
    mapX: 24,
    mapY: 61,
    tags: ["카페", "식당", "휴식"]
  }
];

export const notices: Notice[] = [
  {
    id: "notice-1",
    category: "registration",
    title: "2026학년도 1학기 수강신청 안내",
    summary: "신입생 수강신청 일정과 장바구니 이용 시간을 확인하세요.",
    sourceUrl: "https://www.sungshin.ac.kr",
    isPinned: true,
    publishedAt: "2026-02-12T09:00:00.000Z",
    createdAt: "2026-02-12T09:00:00.000Z"
  },
  {
    id: "notice-2",
    category: "academic",
    title: "신입생 오리엔테이션 자료 배포",
    summary: "학사 일정, 캠퍼스 이용, 학생증 발급 안내 자료가 등록되었습니다.",
    sourceUrl: "https://www.sungshin.ac.kr",
    isPinned: true,
    publishedAt: "2026-02-20T09:00:00.000Z",
    createdAt: "2026-02-20T09:00:00.000Z"
  },
  {
    id: "notice-3",
    category: "scholarship",
    title: "교내 장학금 신청 일정",
    summary: "성적, 가계곤란, 봉사 장학금 신청 요건과 마감일을 확인하세요.",
    sourceUrl: "https://www.sungshin.ac.kr",
    isPinned: false,
    publishedAt: "2026-03-04T09:00:00.000Z",
    createdAt: "2026-03-04T09:00:00.000Z"
  },
  {
    id: "notice-4",
    category: "event",
    title: "동아리 박람회 부스 안내",
    summary: "학생회관 앞 광장에서 진행되는 동아리 박람회 위치와 시간을 안내합니다.",
    sourceUrl: "https://www.sungshin.ac.kr",
    isPinned: false,
    publishedAt: "2026-03-10T09:00:00.000Z",
    createdAt: "2026-03-10T09:00:00.000Z"
  }
];

export const posts: BoardPost[] = [
  {
    id: "post-1",
    userId: demoUser.id,
    authorName: "새내기",
    category: "freshman",
    title: "수정관 304호는 어느 입구가 빠른가요?",
    content: "첫 수업이 수정관 304호인데 지하철역에서 어떻게 가는 게 빠른지 궁금합니다.",
    viewCount: 42,
    comments: [
      {
        id: "comment-1",
        postId: "post-1",
        userId: "user-2",
        authorName: "컴공선배",
        content: "정문에서 오른쪽 계단으로 올라가면 바로 수정관 쪽으로 이어져요.",
        createdAt: "2026-03-03T11:00:00.000Z"
      }
    ],
    createdAt: "2026-03-03T10:30:00.000Z",
    updatedAt: "2026-03-03T10:30:00.000Z"
  },
  {
    id: "post-2",
    userId: "user-2",
    authorName: "컴공선배",
    category: "info",
    title: "프로그래밍기초 실습 전 준비하면 좋은 것",
    content: "노트북 개발환경과 GitHub 계정을 미리 준비하면 첫 실습이 편합니다.",
    viewCount: 77,
    comments: [],
    createdAt: "2026-03-04T14:00:00.000Z",
    updatedAt: "2026-03-04T14:00:00.000Z"
  },
  {
    id: "post-3",
    userId: "user-3",
    authorName: "미컴새내기",
    category: "free",
    title: "공강 때 공부하기 좋은 곳 추천해주세요",
    content: "도서관 말고 조용한 공간이 있으면 알려주세요.",
    viewCount: 31,
    comments: [],
    createdAt: "2026-03-05T16:10:00.000Z",
    updatedAt: "2026-03-05T16:10:00.000Z"
  }
];

export const courseReviews: CourseReview[] = [
  {
    id: "review-1",
    userId: demoUser.id,
    courseName: "프로그래밍기초",
    professorName: "이도윤",
    semester: "2026-1",
    rating: 5,
    assignmentLevel: "medium",
    examLevel: "medium",
    attendanceType: "전자출결",
    content: "실습 설명이 명확하고 초보자도 따라가기 좋았습니다.",
    createdAt: "2026-06-20T09:00:00.000Z"
  },
  {
    id: "review-2",
    userId: "user-2",
    courseName: "컴퓨팅사고",
    professorName: "박지현",
    semester: "2026-1",
    rating: 4.5,
    assignmentLevel: "low",
    examLevel: "medium",
    attendanceType: "호명",
    content: "팀 활동이 많고 새내기에게 학교 적응 팁도 많이 줍니다.",
    createdAt: "2026-06-22T09:00:00.000Z"
  },
  {
    id: "review-3",
    userId: "user-4",
    courseName: "이산수학",
    professorName: "정하은",
    semester: "2026-1",
    rating: 4,
    assignmentLevel: "high",
    examLevel: "high",
    attendanceType: "전자출결",
    content: "과제가 꾸준하지만 시험 대비에는 도움이 됩니다.",
    createdAt: "2026-06-24T09:00:00.000Z"
  }
];
