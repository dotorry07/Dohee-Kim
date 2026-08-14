"use client";

import { useEffect, useMemo, useState } from "react";
import { BannerTagIcon } from "@/components/BannerTagIcon";
import { getStoredUser } from "@/lib/auth/client";
import {
  getDepartmentNotificationPreferences,
  getNewDepartmentNotificationItems,
  getSubscribedDepartments,
  loadDepartmentNotificationPreferences,
  markDepartmentNoticesNotified,
  subscribeToDepartmentNotificationPreferences
} from "@/lib/department-notifications";
import { markNoticeRead } from "@/lib/notice-reads";
import { sungshinDepartments } from "@/lib/sungshin-departments";
import type { Notice } from "@/lib/types";

type DepartmentNoticeCategory = "curriculum" | "graduation" | "campus" | "event";
type NoticeCategoryFilter = Notice["category"] | DepartmentNoticeCategory | "all";
type NoticeSortOrder = "latest" | "oldest";
type DepartmentNotificationAlert = {
  department: string;
  count: number;
  latestNotice: Notice;
};


const categoryLabels: Record<Notice["category"], string> = {
  academic: "학사",
  scholarship: "장학",
  registration: "수강신청",
  event: "행사",
  career: "취업/진로",
  general: "일반"
};

const departmentCategoryLabels: Record<DepartmentNoticeCategory, string> = {
  curriculum: "교육과정",
  graduation: "졸업",
  campus: "교내공지",
  event: "행사"
};

const portalGuideSlides = [
  {
    title: "성신포탈 로그인",
    imageUrl: "/images/notices/portal-guide-1.png"
  },
  {
    title: "통합정보 메뉴 선택",
    imageUrl: "/images/notices/portal-guide-2.png"
  },
  {
    title: "로그인 후 왼쪽 메뉴에서 필요한 기능 선택",
    imageUrl: "/images/notices/portal-guide-3.png"
  }
];

const studentNumberGuideImageUrl = "/images/notices/student-number-guide.jpg";

const officialStudentNotices: Notice[] = [
  {
    id: "official-tuition-2026-2",
    category: "registration",
    title: "2026학년도 2학기 등록금 납부 안내",
    summary: "재학생 등록금 납부는 8월 24일부터 28일까지이며, 분납 신청은 8월 3일부터 14일까지입니다.",
    sourceUrl: "https://www.sungshin.ac.kr/bbs/main_kor/3181/157785/artclView.do",
    isPinned: false,
    publishedAt: "2026-07-27T09:00:00.000Z",
    createdAt: "2026-07-27T09:00:00.000Z"
  },
  {
    id: "official-young-career-challenge-2026",
    category: "event",
    title: "서울영커리언스 실무형 직무혁신 성과 팀 공모전 가을학기 모집",
    summary: "팀 프로젝트를 통해 실무 직무 경험과 성과 발표 기회를 얻을 수 있는 학생 참여형 공모전입니다.",
    sourceUrl: "https://www.sungshin.ac.kr/bbs/main_kor/3181/157681/artclView.do",
    isPinned: false,
    publishedAt: "2026-07-22T09:00:00.000Z",
    createdAt: "2026-07-22T09:00:00.000Z"
  },
  {
    id: "official-young-career-camp-2026",
    category: "career",
    title: "서울영커리언스 캠프 가을학기 참여자 모집",
    summary: "현직자 멘토링과 직무 부트캠프를 무료로 제공하는 5주 온라인 진로 프로그램입니다.",
    applicationUrl: "https://buly.kr/31Vc98v",
    applicationDeadline: "2026-08-21T18:00:00.000+09:00",
    sourceUrl: "https://www.sungshin.ac.kr/bbs/main_kor/3181/157680/artclView.do",
    isPinned: false,
    publishedAt: "2026-07-22T09:00:00.000Z",
    createdAt: "2026-07-22T09:00:00.000Z"
  },
  {
    id: "official-tokushima-visit-2026",
    category: "event",
    title: "일본 도쿠시마현 초청 방문 학생 추가 모집",
    summary: "항공권 지원과 함께 일본 전통문화를 체험하고 SNS 활동에 참여하는 재학생 국제교류 프로그램입니다.",
    sourceUrl: "https://www.sungshin.ac.kr/bbs/main_kor/3181/157584/artclView.do",
    isPinned: false,
    publishedAt: "2026-07-16T09:00:00.000Z",
    createdAt: "2026-07-16T09:00:00.000Z"
  },
  {
    id: "official-course-registration-2026-2",
    category: "registration",
    title: "2026학년도 2학기 수강신청 안내(학부)",
    summary: "학부생의 관심강좌 신청, 수강신청, 정정 및 철회 일정을 확인할 수 있는 필수 학사 안내입니다.",
    sourceUrl: "https://www.sungshin.ac.kr/bbs/main_kor/3181/157409/artclView.do",
    isPinned: false,
    publishedAt: "2026-07-08T09:00:00.000Z",
    createdAt: "2026-07-08T09:00:00.000Z"
  },
  {
    id: "official-s2-day-2026",
    category: "event",
    title: "2026 S2-DAY 성신 창업 네트워킹 데이",
    summary: "창업에 관심 있는 학생이 교내 창업팀과 교류하고 창업 정보를 얻을 수 있는 네트워킹 행사입니다.",
    sourceUrl: "https://www.sungshin.ac.kr/bbs/main_kor/3181/157391/artclView.do",
    isPinned: false,
    publishedAt: "2026-07-08T09:00:00.000Z",
    createdAt: "2026-07-08T09:00:00.000Z"
  },
  {
    id: "official-scholarships-2026",
    category: "scholarship",
    title: "2026학년도 장학생 모집 공고",
    summary: "교내외 장학금별 신청 대상과 마감일을 모아 확인할 수 있으며, 세부 내용은 성신포탈 학부장학 공지에서 확인합니다.",
    sourceUrl: "https://www.sungshin.ac.kr/main_kor/18962/subview.do",
    isPinned: false,
    publishedAt: "2026-03-16T09:00:00.000Z",
    createdAt: "2026-03-16T09:00:00.000Z"
  }
];

type DepartmentNoticeSeed = Pick<Notice, "category" | "title" | "sourceUrl" | "publishedAt"> & {
  isPinned?: boolean;
};

function createOfficialDepartmentNotices(
  departmentName: string,
  seeds: DepartmentNoticeSeed[]
): Notice[] {
  return seeds.map((seed) => ({
    ...seed,
    id: `official-department-${departmentName}-${seed.sourceUrl}`.replace(/[^가-힣a-zA-Z0-9]+/g, "-"),
    summary: `${departmentName} 공식 사이트에서 제공하는 ${departmentCategoryLabels[getDepartmentNoticeCategory({ ...seed, id: "", summary: "", createdAt: seed.publishedAt, isPinned: Boolean(seed.isPinned) })]} 공지입니다.`,
    isPinned: Boolean(seed.isPinned),
    createdAt: seed.publishedAt
  }));
}

const officialDepartmentNotices: Record<string, Notice[]> = {
  "영어영문학과": createOfficialDepartmentNotices("영어영문학과", [
    { category: "career", title: "[인재개발팀] 비교과 프로그램 AI 역량검사 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/english/3223/157976/artclView.do", publishedAt: "2026-07-30T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 2027학년도 로스쿨 입시 대비 자기소개서 특강 및 면담 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/english/3223/157798/artclView.do", publishedAt: "2026-07-27T09:00:00.000+09:00" },
    { category: "event", title: "[연산기획평가팀] 연구자 대상 연구보안 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/english/3223/157440/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 비교과 프로그램 취업 성공 스터디 STEP 2 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/english/3223/157253/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 2026학년도 여름방학 졸업(예정)자를 위한 현직자 직무 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/english/3223/157250/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "academic", title: "[융합연계학부] 2026학년도 1학기 융합연계부·복수전공 변경 및 포기, 신규 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/english/3223/153354/artclView.do", publishedAt: "2026-03-30T09:00:00.000+09:00", isPinned: true },
    { category: "registration", title: "[학부] 2026학년도 여름계절수업 개설희망강좌 신청방법 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/english/3223/154000/artclView.do", publishedAt: "2026-04-08T09:00:00.000+09:00" },
    { category: "academic", title: "영어영문학과 전공교육과정 로드맵 및 학년별 추천과목 안내", sourceUrl: "https://www.sungshin.ac.kr/english/17760/subview.do", publishedAt: "2026-03-01T09:00:00.000+09:00" }
  ]),
  "독일어문·문화학과": createOfficialDepartmentNotices("독일어문·문화학과", [
    { category: "career", title: "2027학년도 로스쿨 입시 대비 자기소개서 특강 및 면담 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/german/3232/157789/artclView.do", publishedAt: "2026-07-27T09:00:00.000+09:00" },
    { category: "event", title: "[연산기획평가팀] 연구자 대상 연구보안 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/german/3232/157441/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 비교과 프로그램 취업 성공 스터디 STEP 2 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/german/3232/157286/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 2026학년도 여름방학 졸업(예정)자를 위한 현직자 직무 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/german/3232/157285/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "event", title: "[홍보] 제3회 한일미래세대 포럼 대학생 발표자 공모", sourceUrl: "https://www.sungshin.ac.kr/bbs/german/3232/157124/artclView.do", publishedAt: "2026-07-01T09:00:00.000+09:00" },
    { category: "academic", title: "[학부] 독일어문·문화학과 전공 교육과정 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/german/3232/138682/artclView.do", publishedAt: "2025-01-06T09:00:00.000+09:00", isPinned: true },
    { category: "academic", title: "[졸업] ★[졸업가이드] 재학생 졸업필수요건 안내★", sourceUrl: "https://www.sungshin.ac.kr/bbs/german/3232/92377/artclView.do", publishedAt: "2020-05-28T09:00:00.000+09:00", isPinned: true }
  ]),
  "중국어문·문화학과": createOfficialDepartmentNotices("중국어문·문화학과", [
    { category: "event", title: "[연산기획평가팀] 연구자 대상 연구보안 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/chinese/3270/157443/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 비교과 프로그램 '취업 성공 스터디 STEP 2' 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/chinese/3270/157299/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 2026학년도 여름방학 졸업(예정)자를 위한 현직자 직무 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/chinese/3270/157298/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "event", title: "[홍보] 제3회 한일미래세대 포럼 대학생 발표자 공모", sourceUrl: "https://www.sungshin.ac.kr/bbs/chinese/3270/157122/artclView.do", publishedAt: "2026-07-01T09:00:00.000+09:00" },
    { category: "general", title: "2026학년도 하계 방학기간 단축근무 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/chinese/3270/156991/artclView.do", publishedAt: "2026-06-24T09:00:00.000+09:00" },
    { category: "academic", title: "인문융합예술대학 개설 교과목 <인문콘텐츠의 이해> 전공인정 관련 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/chinese/3270/151702/artclView.do", publishedAt: "2026-02-11T09:00:00.000+09:00", isPinned: true },
    { category: "academic", title: "[졸업] ★[졸업가이드] 재학생 졸업필수요건 안내★", sourceUrl: "https://www.sungshin.ac.kr/bbs/chinese/3270/92466/artclView.do", publishedAt: "2020-06-01T09:00:00.000+09:00", isPinned: true }
  ]),
  "사학과": createOfficialDepartmentNotices("사학과", [
    { category: "event", title: "[연산기획평가팀] 연구자 대상 연구보안 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/history/3278/157433/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00" },
    { category: "general", title: "[학부] 2026년 제3차 평생교육사 자격증 발급 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/history/3278/156764/artclView.do", publishedAt: "2026-06-18T09:00:00.000+09:00" },
    { category: "academic", title: "[학부] 2026학년도 2학기 대학원 학·석사 연계과정 선발 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/history/3278/156430/artclView.do", publishedAt: "2026-06-10T09:00:00.000+09:00" },
    { category: "academic", title: "2026학년도 2학기 부·복수전공 및 교직 복수전공 선발 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/history/3278/156124/artclView.do", publishedAt: "2026-06-04T09:00:00.000+09:00", isPinned: true },
    { category: "academic", title: "★[졸업가이드] 재학생 졸업필수요건 안내★ ver.260325", sourceUrl: "https://www.sungshin.ac.kr/bbs/history/3278/92388/artclView.do", publishedAt: "2020-05-28T09:00:00.000+09:00", isPinned: true },
    { category: "career", title: "[학부] 2026-2학기 현장실습학기제(Co-op) 참여학생 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/history/3278/156940/artclView.do", publishedAt: "2026-06-24T09:00:00.000+09:00" }
  ]),
  "문화예술경영학과": createOfficialDepartmentNotices("문화예술경영학과", [
    { category: "academic", title: "[융합연계학부] 2026-1학기 융합연계전공 홍보", sourceUrl: "https://www.sungshin.ac.kr/bbs/cultureart/3665/154267/artclView.do", publishedAt: "2026-04-17T09:00:00.000+09:00" },
    { category: "event", title: "[학생지원팀] 2026 성장통 스토리 공모전 수상자 발표회 및 멘티 모집", sourceUrl: "https://www.sungshin.ac.kr/bbs/cultureart/3665/153692/artclView.do", publishedAt: "2026-04-02T09:00:00.000+09:00" },
    { category: "scholarship", title: "[교내장학] 2026-1학기 활동성 장학금 신청 안내(~7. 9.(목)까지)", sourceUrl: "https://www.sungshin.ac.kr/bbs/cultureart/3665/153440/artclView.do", publishedAt: "2026-03-30T09:00:00.000+09:00", isPinned: true },
    { category: "event", title: "[문화예술경영학과] 2025학년도 학회인의 밤", sourceUrl: "https://www.sungshin.ac.kr/bbs/cultureart/3665/151931/artclView.do", publishedAt: "2026-02-20T09:00:00.000+09:00" },
    { category: "event", title: "[문화예술경영학과] 2025-2학기 SCAF 학회 <익명씨네클럽>", sourceUrl: "https://www.sungshin.ac.kr/bbs/cultureart/3665/151928/artclView.do", publishedAt: "2026-02-20T09:00:00.000+09:00" },
    { category: "academic", title: "융합문화예술대학 기초전공 이수의무 해제 및 기초전공 폐지 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/cultureart/3665/150891/artclView.do", publishedAt: "2026-01-20T09:00:00.000+09:00", isPinned: true },
    { category: "academic", title: "2025학년도 전기 학위수여식 단상 참여자 및 축사교수 사전 신청 접수", sourceUrl: "https://www.sungshin.ac.kr/bbs/cultureart/3665/151057/artclView.do", publishedAt: "2026-01-26T09:00:00.000+09:00" }
  ]),
  "미디어영상연기학과": createOfficialDepartmentNotices("미디어영상연기학과", [
    { category: "academic", title: "[융합연계학부] 2026-1학기 융합연계전공 홍보", sourceUrl: "https://www.sungshin.ac.kr/bbs/vmacting/3675/154259/artclView.do", publishedAt: "2026-04-16T09:00:00.000+09:00" },
    { category: "event", title: "[학생지원팀] 2026 성장통 스토리 공모전 수상자 발표회 및 멘티 모집", sourceUrl: "https://www.sungshin.ac.kr/bbs/vmacting/3675/153697/artclView.do", publishedAt: "2026-04-02T09:00:00.000+09:00" },
    { category: "academic", title: "2025학년도 전기 학위수여식 단상 참여자 및 축사교수 사전 신청 접수", sourceUrl: "https://www.sungshin.ac.kr/bbs/vmacting/3675/151058/artclView.do", publishedAt: "2026-01-26T09:00:00.000+09:00" },
    { category: "academic", title: "융합문화예술대학 기초전공 이수의무 해제 및 기초전공 폐지 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/vmacting/3675/150892/artclView.do", publishedAt: "2026-01-20T09:00:00.000+09:00", isPinned: true },
    { category: "career", title: "[진로취업처] 2025-2학기 현장실습학기제(Co-op) 프로그램 참여학생 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/vmacting/3675/144064/artclView.do", publishedAt: "2025-06-24T09:00:00.000+09:00" },
    { category: "general", title: "미디어영상연기학과 실습실 사용방법 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/vmacting/3675/111623/artclView.do", publishedAt: "2022-06-27T09:00:00.000+09:00", isPinned: true }
  ]),
  "현대실용음악학과": createOfficialDepartmentNotices("현대실용음악학과", [
    { category: "academic", title: "[전공실기] 2026학년도 2학기 전공실기 교강사진 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/157926/artclView.do", publishedAt: "2026-07-29T09:00:00.000+09:00" },
    { category: "academic", title: "2026학년도 2학기 전공 개설 과목 시간표", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/157073/artclView.do", publishedAt: "2026-06-30T09:00:00.000+09:00", isPinned: true },
    { category: "general", title: "2026학년도 하계 방학 현대실용음악학과 TA 근무시간 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/157064/artclView.do", publishedAt: "2026-06-29T09:00:00.000+09:00" },
    { category: "event", title: "[공지] 2026-1 Music Labs 투표 결과", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/156868/artclView.do", publishedAt: "2026-06-23T09:00:00.000+09:00" },
    { category: "event", title: "2026 운정 플리마켓 행사 버스킹 참가 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/155411/artclView.do", publishedAt: "2026-05-12T09:00:00.000+09:00" },
    { category: "event", title: "2026학년도 Music Presentation 뮤직 프레젠테이션 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/154099/artclView.do", publishedAt: "2026-04-10T09:00:00.000+09:00" },
    { category: "event", title: "2026학년도 MusicLabs 뮤직랩스 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/154091/artclView.do", publishedAt: "2026-04-10T09:00:00.000+09:00" },
    { category: "general", title: "[중요공지] 학과 실습실(연습실) 이용 방법 및 주의 사항", sourceUrl: "https://www.sungshin.ac.kr/bbs/ctpmusic/3686/145717/artclView.do", publishedAt: "2025-08-22T09:00:00.000+09:00", isPinned: true }
  ]),
  "무용예술학과": createOfficialDepartmentNotices("무용예술학과", [
    { category: "academic", title: "[융합연계학부] 2026-1학기 융합연계전공 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/danceart/3691/154268/artclView.do", publishedAt: "2026-04-17T09:00:00.000+09:00" },
    { category: "event", title: "[무용예술학과] 2026-1학기 한국무용 1차 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/danceart/3691/152429/artclView.do", publishedAt: "2026-03-06T09:00:00.000+09:00" },
    { category: "event", title: "[무용예술학과] 2026-1학기 무용예술학과 1차 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/danceart/3691/152428/artclView.do", publishedAt: "2026-03-06T09:00:00.000+09:00" },
    { category: "event", title: "[무용예술학과] 2025-2학기 생활무용 겨울방학 1차 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/danceart/3691/151929/artclView.do", publishedAt: "2026-02-20T09:00:00.000+09:00" },
    { category: "event", title: "[무용예술학과] 2025-2학기 발레 겨울방학 1차 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/danceart/3691/151927/artclView.do", publishedAt: "2026-02-20T09:00:00.000+09:00" },
    { category: "academic", title: "융합문화예술대학 기초전공 이수의무 해제 및 기초전공 폐지 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/danceart/3691/150894/artclView.do", publishedAt: "2026-01-20T09:00:00.000+09:00", isPinned: true },
    { category: "event", title: "2026년 제12회 성신여자대학교 총장배 전국무용경연대회 발레 심사 결과", sourceUrl: "https://www.sungshin.ac.kr/bbs/danceart/3696/155814/artclView.do", publishedAt: "2026-05-25T09:00:00.000+09:00" }
  ]),
  "정치외교학과": createOfficialDepartmentNotices("정치외교학과", [
    { category: "career", title: "[홍보] 2026년 제3회 계약관리사 자격시험 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/politics/3290/158026/artclView.do", publishedAt: "2026-08-03T09:00:00.000+09:00" },
    { category: "career", title: "[홍보] 2027학년도 로스쿨 입시 대비 자기소개서 특강 및 면담 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/politics/3290/157830/artclView.do", publishedAt: "2026-07-27T09:00:00.000+09:00" },
    { category: "event", title: "[홍보] [한국매니페스토실천본부] 2026년 대학생 및 청년 주민배심원 참여 희망자 등록", sourceUrl: "https://www.sungshin.ac.kr/bbs/politics/3290/157676/artclView.do", publishedAt: "2026-07-22T09:00:00.000+09:00" },
    { category: "event", title: "[행사/홍보] 외교부 2026 동아시아협력포럼 개최 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/politics/3290/157618/artclView.do", publishedAt: "2026-07-20T09:00:00.000+09:00" },
    { category: "academic", title: "[교내 공지] 2026학년도 2학기 부·복수전공 및 교직 복수전공 합격자 발표 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/politics/3290/157609/artclView.do", publishedAt: "2026-07-20T09:00:00.000+09:00", isPinned: true },
    { category: "career", title: "[교내 공지] [현장실습운영팀] 2026-2학기 현장실습학기제(Co-op) 참여학생 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/politics/3290/157448/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00" },
    { category: "event", title: "[성신여대 동아시아연구소] 『국가와 정치』 제32집 2호 논문 투고자 모집", sourceUrl: "https://www.sungshin.ac.kr/bbs/politics/3290/157489/artclView.do", publishedAt: "2026-07-13T09:00:00.000+09:00" },
    { category: "academic", title: "정치외교학과 전공교육과정 로드맵 및 학년별 추천과목 안내", sourceUrl: "https://www.sungshin.ac.kr/politics/17724/subview.do", publishedAt: "2026-03-01T09:00:00.000+09:00" }
  ]),
  "심리학과": createOfficialDepartmentNotices("심리학과", [
    { category: "event", title: "[홍보] [사교육걱정없는세상] '노워리 기자단 6기' 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/psy/3295/157530/artclView.do", publishedAt: "2026-07-14T09:00:00.000+09:00" },
    { category: "event", title: "[홍보] 2026년 연구산학협력단 주관 연구보안 전문가 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/psy/3295/157469/artclView.do", publishedAt: "2026-07-10T09:00:00.000+09:00" },
    { category: "career", title: "[현장실습운영팀] 2026-2학기 현장실습학기제(Co-op) 참여학생 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/psy/3295/157450/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00", isPinned: true },
    { category: "career", title: "[홍보] 2026년 제3회 계약관리사 자격 시험 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/psy/3295/157408/artclView.do", publishedAt: "2026-07-08T09:00:00.000+09:00" },
    { category: "career", title: "[비교과 홍보] 취업 성공 스터디 STEP 2", sourceUrl: "https://www.sungshin.ac.kr/bbs/psy/3295/157324/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "career", title: "[비교과 홍보] 2026학년도 여름방학 졸업(예정)자를 위한 현직자 직무 멘토링", sourceUrl: "https://www.sungshin.ac.kr/bbs/psy/3295/157311/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "event", title: "[홍보] 한국교육&심리연구소 2026 하계 연구방법론 워크숍 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/psy/3295/156807/artclView.do", publishedAt: "2026-06-19T09:00:00.000+09:00" },
    { category: "academic", title: "심리학과 전공교육과정 로드맵 및 학년별 추천과목 안내", sourceUrl: "https://www.sungshin.ac.kr/psy/17726/subview.do", publishedAt: "2026-03-01T09:00:00.000+09:00" }
  ]),
  "지리학과": createOfficialDepartmentNotices("지리학과", [
    { category: "career", title: "[인재개발팀] AI 역량검사 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/geographic/3305/157947/artclView.do", publishedAt: "2026-07-30T09:00:00.000+09:00" },
    { category: "career", title: "[국가고시반] 2027학년도 로스쿨 입시 대비 자기소개서 특강 및 면담 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/geographic/3305/157825/artclView.do", publishedAt: "2026-07-27T09:00:00.000+09:00" },
    { category: "general", title: "2026년 8월 졸업자 성신우수사범인상 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/geographic/3305/157628/artclView.do", publishedAt: "2026-07-20T09:00:00.000+09:00" },
    { category: "event", title: "[외교부] 2026 동아시아협력포럼 개최 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/geographic/3305/157621/artclView.do", publishedAt: "2026-07-20T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 대학 1학년 '나를 위한' 진로·취업 설정법 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/geographic/3305/145676/artclView.do", publishedAt: "2025-08-21T09:00:00.000+09:00" },
    { category: "general", title: "2025학년도 2학기 휴학 및 복학 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/geographic/3305/143122/artclView.do", publishedAt: "2025-06-24T09:00:00.000+09:00" },
    { category: "academic", title: "지리학과 전공교육과정 로드맵 및 학년별 추천과목 안내", sourceUrl: "https://www.sungshin.ac.kr/geographic/17728/subview.do", publishedAt: "2026-03-01T09:00:00.000+09:00" }
  ]),
  "미디어커뮤니케이션학과": createOfficialDepartmentNotices("미디어커뮤니케이션학과", [
    { category: "career", title: "[인재개발팀] AI 역량검사 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/mediacomm/3330/157948/artclView.do", publishedAt: "2026-07-30T09:00:00.000+09:00" },
    { category: "event", title: "[신문박물관] 영화로 보는 신문 위에 차려진 프로그램 진행 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/mediacomm/3330/157880/artclView.do", publishedAt: "2026-07-28T09:00:00.000+09:00" },
    { category: "career", title: "[국가고시반] 2027학년도 로스쿨 입시 대비 자기소개서 특강 및 면담 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/mediacomm/3330/157828/artclView.do", publishedAt: "2026-07-27T09:00:00.000+09:00" },
    { category: "event", title: "[외교부] 2026 동아시아협력포럼 개최 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/mediacomm/3330/157622/artclView.do", publishedAt: "2026-07-20T09:00:00.000+09:00" },
    { category: "general", title: "★미디어라이브러리 사용규칙★ (방문 전 필독)", sourceUrl: "https://www.sungshin.ac.kr/bbs/mediacomm/3330/99453/artclView.do", publishedAt: "2021-03-02T09:00:00.000+09:00" },
    { category: "career", title: "[현장실습운영팀] 2026-2학기 현장실습학기제(Co-op) 참여학생 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/mediacomm/3330/157450/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00" },
    { category: "academic", title: "미디어커뮤니케이션학과 전공교육과정 로드맵 및 학년별 추천과목 안내", sourceUrl: "https://www.sungshin.ac.kr/mediacomm/17736/subview.do", publishedAt: "2026-03-01T09:00:00.000+09:00" }
  ]),
  "경영학과": createOfficialDepartmentNotices("경영학과", [
    { category: "career", title: "[홍보] 2026년 제3회 계약관리사 자격시험 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/bizadm/4501/158025/artclView.do", publishedAt: "2026-08-03T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 비교과 프로그램 홍보 요청", sourceUrl: "https://www.sungshin.ac.kr/bbs/bizadm/4501/157943/artclView.do", publishedAt: "2026-07-30T09:00:00.000+09:00" },
    { category: "career", title: "[국가고시반] 2027학년도 로스쿨 입시 대비 자기소개서 특강 및 면담 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/bizadm/4501/157823/artclView.do", publishedAt: "2026-07-27T09:00:00.000+09:00" },
    { category: "event", title: "[홍보] 외교부 2026 동아시아협력포럼 개최 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/bizadm/4501/157615/artclView.do", publishedAt: "2026-07-20T09:00:00.000+09:00" },
    { category: "academic", title: "2026학년도 1학기 부·복수전공 및 교직 복수전공 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/bizadm/4501/149844/artclView.do", publishedAt: "2025-12-11T09:00:00.000+09:00" },
    { category: "career", title: "[현장실습운영팀] 2026-1학기 현장실습학기제(Co-op) 참여학생 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/bizadm/4501/150401/artclView.do", publishedAt: "2026-01-09T09:00:00.000+09:00" },
    { category: "academic", title: "경영학과 분야별 전공교육과정 로드맵 및 추천과목 안내", sourceUrl: "https://www.sungshin.ac.kr/bizadm/20815/subview.do", publishedAt: "2026-03-01T09:00:00.000+09:00" }
  ]),
  "사회복지학과": createOfficialDepartmentNotices("사회복지학과", [
    { category: "event", title: "[연산기획평가팀] 2026년 연구산학협력단 연구보안 전문가 특강 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/welfare/3472/157428/artclView.do", publishedAt: "2026-07-09T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 취업 성공 스터디 STEP 2", sourceUrl: "https://www.sungshin.ac.kr/bbs/welfare/3472/157297/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] 2026학년도 여름방학 졸업(예정)자를 위한 현직자 직무 멘토링", sourceUrl: "https://www.sungshin.ac.kr/bbs/welfare/3472/157295/artclView.do", publishedAt: "2026-07-07T09:00:00.000+09:00" },
    { category: "career", title: "2026-2학기 현장실습학기제(Co-op) 참여학생 모집 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/welfare/3472/156922/artclView.do", publishedAt: "2026-06-24T09:00:00.000+09:00" },
    { category: "academic", title: "★[학과] 사회복지사 2급 자격 수강강의 목록", sourceUrl: "https://www.sungshin.ac.kr/bbs/welfare/3472/123952/artclView.do", publishedAt: "2023-09-26T09:00:00.000+09:00" },
    { category: "academic", title: "★[실습] 사회복지실습 관련 필수 안내사항", sourceUrl: "https://www.sungshin.ac.kr/bbs/welfare/3472/123951/artclView.do", publishedAt: "2023-09-26T09:00:00.000+09:00" }
  ]),
  "법학부": createOfficialDepartmentNotices("법학부", [
    { category: "general", title: "[법원도서관] 외국 법률도서 지원사업 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/solaw/4539/158066/artclView.do", publishedAt: "2026-08-04T09:00:00.000+09:00" },
    { category: "career", title: "2026년 제3회 계약관리사 자격시험 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/solaw/4539/158023/artclView.do", publishedAt: "2026-08-03T09:00:00.000+09:00" },
    { category: "career", title: "[인재개발팀] AI 역량검사 특강", sourceUrl: "https://www.sungshin.ac.kr/bbs/solaw/4539/157945/artclView.do", publishedAt: "2026-07-30T09:00:00.000+09:00" },
    { category: "career", title: "[국가고시반] 2027학년도 로스쿨 입시 대비 자기소개서 특강 및 면담 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/solaw/4539/157821/artclView.do", publishedAt: "2026-07-27T09:00:00.000+09:00" },
    { category: "academic", title: "2026학년도 1학기 법학부 일부 과목 시간표 변경 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/solaw/4539/151200/artclView.do", publishedAt: "2026-01-28T09:00:00.000+09:00" },
    { category: "event", title: "[교내특강] 법학공부방법론 & 사례형 답안작성법", sourceUrl: "https://www.sungshin.ac.kr/bbs/solaw/4539/150802/artclView.do", publishedAt: "2026-01-16T09:00:00.000+09:00" }
  ]),
  "수리통계데이터사이언스학부": createOfficialDepartmentNotices("수리통계데이터사이언스학부", [
    { category: "event", title: "2026 제4회 수학/핀테크 분석 경진대회 결과 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/math-statistics/4475/157737/artclView.do", publishedAt: "2026-07-24T09:00:00.000+09:00" },
    { category: "event", title: "국립광주과학관 2026 매스&사이언스 아트 작품공모전 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/stat-math/5271/157475/artclView.do", publishedAt: "2026-07-10T09:00:00.000+09:00" },
    { category: "registration", title: "2026학년도 1학기 수리통계데이터사이언스학부 수강신청기간 추가 증원 안내", sourceUrl: "https://www.sungshin.ac.kr/bbs/math-statistics/4475/151739/artclView.do", publishedAt: "2026-03-04T09:00:00.000+09:00" },
    { category: "registration", title: "2026-1학기 공통교양 수강예외자 지정 관련 안내 (미적분과벡터해석기초, 기초통계학, 파이썬프로그래밍)", sourceUrl: "https://www.sungshin.ac.kr/bbs/math-statistics/4475/151446/artclView.do", publishedAt: "2026-02-02T09:00:00.000+09:00" },
    { category: "academic", title: "수리통계데이터사이언스학부 전공교육과정 로드맵", sourceUrl: "https://www.sungshin.ac.kr/stat-math/22117/subview.do", publishedAt: "2026-03-01T09:00:00.000+09:00" },
    { category: "academic", title: "2026학년도 2학기 학부 전공 배정 및 변경 신청 안내", sourceUrl: "https://www.sungshin.ac.kr/math-statistics/17397/subview.do", publishedAt: "2026-06-23T09:00:00.000+09:00" }
  ])
};

export default function NoticesPage() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [category, setCategory] = useState<NoticeCategoryFilter>("all");
  const [sortOrder, setSortOrder] = useState<NoticeSortOrder>("latest");
  const [importantPage, setImportantPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStudentNumberGuideOpen, setIsStudentNumberGuideOpen] = useState(false);
  const [isPortalGuideOpen, setIsPortalGuideOpen] = useState(false);
  const [activePortalGuideIndex, setActivePortalGuideIndex] = useState(0);
  const [departmentNotificationAlerts, setDepartmentNotificationAlerts] = useState<DepartmentNotificationAlert[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadNotices() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (query.trim()) {
          params.set("q", query.trim());
        }

        if (department !== "all") {
          params.set("department", department);
        }

        if (category !== "all") {
          params.set("category", category);
        }

        const response = await fetch(`/api/notices${params.size ? `?${params.toString()}` : ""}`);

        if (!response.ok) {
          throw new Error("request failed");
        }

        const data = await response.json() as { notices: Notice[] };
        if (!ignore) {
          setNotices(
            department === "all"
              ? mergeOfficialNotices(data.notices)
              : mergeDepartmentNotices(data.notices, officialDepartmentNotices[department] ?? [])
          );
        }
      } catch {
        if (!ignore) {
          setError("공지사항을 불러오지 못했습니다.");
          setNotices(
            department === "all"
              ? officialStudentNotices
              : applyDepartmentImportantNotices(officialDepartmentNotices[department] ?? [])
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadNotices();

    return () => {
      ignore = true;
    };
  }, [category, department, query]);

  useEffect(() => {
    setImportantPage(1);
    setCurrentPage(1);
  }, [category, department, query, sortOrder]);

  useEffect(() => {
    let ignore = false;

    async function checkDepartmentNotifications() {
      const user = getStoredUser();
      if (!user) {
        if (!ignore) setDepartmentNotificationAlerts([]);
        return;
      }

      let preferences = await loadDepartmentNotificationPreferences(user);
      const subscribedDepartments = getSubscribedDepartments(user, preferences);

      if (subscribedDepartments.length === 0) {
        if (!ignore) setDepartmentNotificationAlerts([]);
        return;
      }

      const alerts: DepartmentNotificationAlert[] = [];
      const nextNotifiedNoticeIds: string[] = [];

      for (const subscribedDepartment of subscribedDepartments) {
        try {
          const params = new URLSearchParams({ department: subscribedDepartment.name });
          const response = await fetch(`/api/notices?${params.toString()}`);

          if (!response.ok) {
            throw new Error("department notice request failed");
          }

          const data = await response.json() as { notices: Notice[] };
          const departmentNotices = mergeDepartmentNotices(
            data.notices,
            officialDepartmentNotices[subscribedDepartment.name] ?? []
          );
          const newItems = getNewDepartmentNotificationItems(
            departmentNotices,
            subscribedDepartment.enabledAt,
            preferences
          ).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

          if (newItems.length > 0) {
            const latestNotice = newItems[0];
            alerts.push({
              department: subscribedDepartment.name,
              count: newItems.length,
              latestNotice
            });
            nextNotifiedNoticeIds.push(...newItems.map((notice) => notice.id));

            if ("Notification" in window && window.Notification.permission === "granted") {
              new window.Notification(`${subscribedDepartment.name} 새 공지`, {
                body: latestNotice.title
              });
            }
          }
        } catch {
          const fallbackNotices = mergeDepartmentNotices(
            [],
            officialDepartmentNotices[subscribedDepartment.name] ?? []
          );
          const newItems = getNewDepartmentNotificationItems(
            fallbackNotices,
            subscribedDepartment.enabledAt,
            preferences
          ).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

          if (newItems.length > 0) {
            alerts.push({
              department: subscribedDepartment.name,
              count: newItems.length,
              latestNotice: newItems[0]
            });
            nextNotifiedNoticeIds.push(...newItems.map((notice) => notice.id));
          }
        }

        preferences = getDepartmentNotificationPreferences(user.id);
      }

      if (nextNotifiedNoticeIds.length > 0) {
        markDepartmentNoticesNotified(user.id, nextNotifiedNoticeIds);
      }

      if (!ignore) {
        setDepartmentNotificationAlerts(alerts);
      }
    }

    void checkDepartmentNotifications();
    const unsubscribe = subscribeToDepartmentNotificationPreferences(() => {
      void checkDepartmentNotifications();
    });
    const intervalId = window.setInterval(() => {
      void checkDepartmentNotifications();
    }, 5 * 60 * 1000);

    return () => {
      ignore = true;
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isStudentNumberGuideOpen && !isPortalGuideOpen) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsStudentNumberGuideOpen(false);
        setIsPortalGuideOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isPortalGuideOpen, isStudentNumberGuideOpen]);

  const activePortalGuide = portalGuideSlides[activePortalGuideIndex];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const selectedDepartment = department === "all" ? "" : department;
    const isDepartmentSelected = Boolean(selectedDepartment);

    return notices
      .filter((notice) => {
        if (category === "all") {
          return true;
        }

        return isDepartmentSelected
          ? getDepartmentNoticeCategory(notice) === category
          : notice.category === category;
      })
      .filter((notice) => !normalized || `${notice.title} ${notice.summary}`.toLowerCase().includes(normalized))
      .sort((a, b) => (
        Number(b.isPinned) - Number(a.isPinned) ||
        Number(Boolean(a.isExpired)) - Number(Boolean(b.isExpired)) ||
        (sortOrder === "latest"
          ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
          : Date.parse(a.publishedAt) - Date.parse(b.publishedAt))
      ));
  }, [category, department, notices, query, sortOrder]);

  const departmentOptions = useMemo(() => ["전체", ...sungshinDepartments], []);
  const selectedDepartmentLabel = department === "all" ? "전체" : department;
  const activeCategoryLabels = department === "all" ? categoryLabels : departmentCategoryLabels;

  function selectDepartment(departmentName: string) {
    setDepartment(departmentName === "전체" ? "all" : departmentName);
    setCategory("all");
    setIsDepartmentOpen(false);
  }

  const pinned = filtered.filter((notice) => notice.isPinned);
  const regular = filtered.filter((notice) => !notice.isPinned);
  const noticesPerPage = 5;
  const importantTotalPages = Math.max(1, Math.ceil(pinned.length / noticesPerPage));
  const activeImportantPage = Math.min(importantPage, importantTotalPages);
  const paginatedPinned = pinned.slice(
    (activeImportantPage - 1) * noticesPerPage,
    activeImportantPage * noticesPerPage
  );
  const importantPaginationItems = getPaginationItems(activeImportantPage, importantTotalPages);
  const totalPages = Math.max(1, Math.ceil(regular.length / noticesPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedRegular = regular.slice(
    (activePage - 1) * noticesPerPage,
    activePage * noticesPerPage
  );
  const paginationItems = getPaginationItems(activePage, totalPages);
  const handleNoticeRead = (noticeId: string) => {
    const user = getStoredUser();
    if (user) void markNoticeRead(user, noticeId);
  };

  return (
    <main className="notices-page">
      <section className="notices-hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>공지사항</h1>
            <p>학교의 중요한 소식과 안내사항을 확인하세요!</p>
            <div className="hero-tags" aria-hidden="true">
              <span><BannerTagIcon icon="calendar" />학사 일정</span>
              <span><BannerTagIcon icon="checklist" />수강신청</span>
              <span><BannerTagIcon icon="scholarship" />장학</span>
              <span><BannerTagIcon icon="party" />행사</span>
              <span><BannerTagIcon icon="briefcase" />취업/진로</span>
              <span><BannerTagIcon icon="pin" />기타 안내</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <img
              className="megaphone-image"
              src="/images/notices/logo_notice.png"
              alt=""
            />
          </div>
        </div>
      </section>

      <div className="notices-content">
        <div className="notices-main-column">
      {departmentNotificationAlerts.length > 0 ? (
        <section className="department-alert-panel" aria-live="polite">
          <div>
            <strong>구독한 학과 새 공지가 있습니다.</strong>
            {departmentNotificationAlerts.map((alert) => (
              <button
                type="button"
                key={`${alert.department}-${alert.latestNotice.id}`}
                onClick={() => {
                  setDepartment(alert.department);
                  setCategory("all");
                  setQuery("");
                }}
              >
                <span>{alert.department}</span>
                {alert.count > 1 ? `${alert.count}건의 새 공지` : alert.latestNotice.title}
              </button>
            ))}
          </div>
          <button type="button" aria-label="학과 공지 알림 닫기" onClick={() => setDepartmentNotificationAlerts([])}>×</button>
        </section>
      ) : null}

      <section className="notice-filter-panel">
        <form className="notice-filter-form" onSubmit={(event) => event.preventDefault()}>
          <div className="notice-search-row">
            <div
              className="notice-department-combobox"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDepartmentOpen(false);
                }
              }}
            >
              <button
                aria-expanded={isDepartmentOpen}
                aria-haspopup="listbox"
                className="notice-department-button"
                role="combobox"
                type="button"
                onClick={() => setIsDepartmentOpen((current) => !current)}
              >
                <span>{selectedDepartmentLabel}</span>
              </button>
              {isDepartmentOpen ? (
                <div className="notice-department-options" role="listbox">
                  {departmentOptions.map((departmentName) => (
                    <button
                      aria-selected={department === (departmentName === "전체" ? "all" : departmentName)}
                      className={(
                        department === (departmentName === "전체" ? "all" : departmentName)
                          ? "notice-department-option active"
                          : "notice-department-option"
                      )}
                      key={departmentName}
                      role="option"
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectDepartment(departmentName)}
                    >
                      {departmentName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="notice-search-box">
              <input
                aria-label="공지 검색"
                placeholder="공지 제목 또는 내용을 검색하세요"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="submit">
                <span className="search-icon" aria-hidden="true" />
                검색
              </button>
            </div>
          </div>
          <div className="notice-category-tabs">
            <button className={category === "all" ? "active" : ""} type="button" onClick={() => setCategory("all")}>전체</button>
            {Object.entries(activeCategoryLabels).map(([key, label]) => (
              <button
                className={category === key ? "active" : ""}
                key={key}
                type="button"
                onClick={() => setCategory(key as NoticeCategoryFilter)}
              >
                {label}
              </button>
            ))}
          </div>
        </form>
      </section>

      {isLoading ? <section className="success" style={{ marginTop: 16 }}>성신여대 공식 사이트 공지사항을 불러오는 중입니다.</section> : null}
      {error ? <section className="error" style={{ marginTop: 16 }}>{error}</section> : null}
      {isLoading ? <section className="notice-state">학과 공지사항에서 대회 관련 공지를 불러오는 중입니다.</section> : null}
      {error ? <section className="notice-state error-state">{error}</section> : null}

      <section className="important-notices">
        <div className="notice-section-heading">
          <div className="heading-copy">
            <span className="heading-icon" aria-hidden="true">●</span>
            <h2>중요 공지</h2>
          </div>
          <span className="heading-count">{pinned.length}개</span>
        </div>
        <div className="notice-table-head" aria-hidden="true">
          <span>번호</span>
          <span>분류</span>
          <span>제목</span>
          <span>작성일</span>
          <span />
        </div>
        <NoticeList
          notices={paginatedPinned}
          empty="고정된 공지사항이 없습니다."
          startNumber={(
            sortOrder === "latest"
              ? pinned.length - (activeImportantPage - 1) * noticesPerPage
              : (activeImportantPage - 1) * noticesPerPage + 1
          )}
          numberDirection={sortOrder === "latest" ? "descending" : "ascending"}
          onNoticeRead={handleNoticeRead}
        />
        {pinned.length > noticesPerPage ? (
          <nav className="notice-pagination" aria-label="중요 공지 페이지">
            <button
              type="button"
              aria-label="중요 공지 이전 페이지"
              disabled={activeImportantPage === 1}
              onClick={() => setImportantPage((page) => Math.max(1, page - 1))}
            >
              ‹
            </button>
            {importantPaginationItems.map((item) => (
              typeof item === "number" ? (
                <button
                  className={activeImportantPage === item ? "active" : ""}
                  type="button"
                  aria-current={activeImportantPage === item ? "page" : undefined}
                  key={item}
                  onClick={() => setImportantPage(item)}
                >
                  {item}
                </button>
              ) : (
                <span className="pagination-ellipsis" aria-hidden="true" key={item}>···</span>
              )
            ))}
            <button
              type="button"
              aria-label="중요 공지 다음 페이지"
              disabled={activeImportantPage === importantTotalPages}
              onClick={() => setImportantPage((page) => Math.min(importantTotalPages, page + 1))}
            >
              ›
            </button>
          </nav>
        ) : null}
      </section>

      <section className="all-notices">
        <div className="notice-section-heading all-heading">
          <div className="heading-copy">
            <h2>전체 공지</h2>
            <span className="total-count">총 {regular.length}건</span>
          </div>
          <div className="sort-options" aria-label="공지 정렬">
            <button
              className={sortOrder === "latest" ? "active" : ""}
              type="button"
              aria-pressed={sortOrder === "latest"}
              onClick={() => setSortOrder("latest")}
            >
              최신순
            </button>
            <button
              className={sortOrder === "oldest" ? "active" : ""}
              type="button"
              aria-pressed={sortOrder === "oldest"}
              onClick={() => setSortOrder("oldest")}
            >
              오래된 순
            </button>
          </div>
        </div>
        <div className="notice-table-head" aria-hidden="true">
          <span>번호</span>
          <span>분류</span>
          <span>제목</span>
          <span>작성일</span>
          <span />
        </div>
        <NoticeList
          notices={paginatedRegular}
          empty="등록된 공지사항이 없습니다."
          startNumber={(
            sortOrder === "latest"
              ? regular.length - (activePage - 1) * noticesPerPage
              : (activePage - 1) * noticesPerPage + 1
          )}
          numberDirection={sortOrder === "latest" ? "descending" : "ascending"}
          onNoticeRead={handleNoticeRead}
        />
        {regular.length > noticesPerPage ? (
          <nav className="notice-pagination" aria-label="전체 공지 페이지">
            <button
              type="button"
              aria-label="이전 페이지"
              disabled={activePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ‹
            </button>
            {paginationItems.map((item) => (
              typeof item === "number" ? (
                <button
                  className={activePage === item ? "active" : ""}
                  type="button"
                  aria-current={activePage === item ? "page" : undefined}
                  key={item}
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </button>
              ) : (
                <span className="pagination-ellipsis" aria-hidden="true" key={item}>···</span>
              )
            ))}
            <button
              type="button"
              aria-label="다음 페이지"
              disabled={activePage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              ›
            </button>
          </nav>
        ) : null}
      </section>
        </div>

        <aside className="notice-sidebar" aria-label="새내기 안내">
          <section className="sidebar-panel shortcut-panel">
            <h2>신입생을 위한 바로가기 <span aria-hidden="true">🎉</span></h2>
            <div className="shortcut-grid">
              <a
                className="shortcut-card"
                href="https://www.sungshin.ac.kr/main_kor/11000/subview.do"
                target="_blank"
                rel="noreferrer"
              >
                <span className="shortcut-icon" aria-hidden="true">
                  <img src="/images/notices/academic-calendar.png" alt="학사일정" />
                </span>
                <strong>학사일정</strong>
              </a>
              <a
                className="shortcut-card"
                href="https://everytime.kr/369374/v/400108251"
                target="_blank"
                rel="noreferrer"
              >
                <span className="shortcut-icon" aria-hidden="true">
                  <img src="/images/notices/course-registration.png" alt="수강신청 가이드" />
                </span>
                <strong>수강신청 가이드</strong>
              </a>
              <a
                className="shortcut-card"
                href="https://www.sungshin.ac.kr/main_kor/14211/subview.do"
                target="_blank"
                rel="noreferrer"
              >
                <span className="shortcut-icon" aria-hidden="true">
                  <img src="/images/notices/student-id-card.png" alt="학생증 발급 안내" />
                </span>
                <strong>학생증 발급 안내</strong>
              </a>
              <a
                className="shortcut-card"
                href="https://www.sungshin.ac.kr/dormitory/index..do"
                target="_blank"
                rel="noreferrer"
              >
                <span className="shortcut-icon" aria-hidden="true">
                  <img src="/images/notices/dormitory.png" alt="기숙사 안내" />
                </span>
                <strong>기숙사 안내</strong>
              </a>
            </div>
          </section>

          <section className="sidebar-panel frequent-panel">
            <h2>자주 찾는 안내</h2>
            <div className="frequent-list">
              <a href="https://www.sungshin.ac.kr/main_kor/11005/subview.do" target="_blank" rel="noreferrer">
                수강신청 방법 <span aria-hidden="true">›</span>
              </a>
              <button type="button" onClick={() => setIsStudentNumberGuideOpen(true)}>
                학번 조회 방법 <span aria-hidden="true">›</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePortalGuideIndex(0);
                  setIsPortalGuideOpen(true);
                }}
              >
                포털 시스템 이용 안내 <span aria-hidden="true">›</span>
              </button>
              <div>증명서 발급 안내 <span aria-hidden="true">›</span></div>
              <a href="https://www.sungshin.ac.kr/main_kor/11035/subview.do" target="_blank" rel="noreferrer">
                등록금 납부 안내 <span aria-hidden="true">›</span>
              </a>
            </div>
          </section>

          <section className="sidebar-panel contact-panel">
            <h2>문의 안내</h2>
            <p>궁금한 점이 있다면 언제든 문의하세요!</p>
            <div className="contact-list">
              <div><span>☎</span><strong>02-920-5114</strong><small>학사 관련 문의</small></div>
              <div><span>✉</span><strong>freshman@sungshin.ac.kr</strong><small>새내기ON 문의</small></div>
              <div><span>●</span><strong>1:1 상담 바로가기</strong><small>빠른 답변 도와드려요!</small></div>
            </div>
          </section>
        </aside>
      </div>

      {isStudentNumberGuideOpen ? (
        <div
          className="portal-guide-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsStudentNumberGuideOpen(false);
            }
          }}
        >
          <section
            aria-labelledby="student-number-guide-title"
            aria-modal="true"
            className="portal-guide-dialog student-number-guide-dialog"
            role="dialog"
          >
            <div className="portal-guide-header">
              <div>
                <p>01 학번 조회 방법</p>
                <h2 id="student-number-guide-title">신입생 학번 조회 방법</h2>
              </div>
              <button
                aria-label="학번 조회 안내 닫기"
                type="button"
                onClick={() => setIsStudentNumberGuideOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="portal-guide-frame student-number-guide-frame">
              <img
                src={studentNumberGuideImageUrl}
                alt="신입생 학번 조회 방법 안내 이미지"
                className="student-number-guide-image"
              />
            </div>
            <div className="portal-guide-controls" aria-label="학번 조회 방법 안내 페이지">
              <button type="button" disabled>이전</button>
              <span>1 / 1</span>
              <button type="button" onClick={() => setIsStudentNumberGuideOpen(false)}>닫기</button>
            </div>
          </section>
        </div>
      ) : null}

      {isPortalGuideOpen ? (
        <div
          className="portal-guide-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsPortalGuideOpen(false);
            }
          }}
        >
          <section
            aria-labelledby="portal-guide-title"
            aria-modal="true"
            className="portal-guide-dialog"
            role="dialog"
          >
            <div className="portal-guide-header">
              <div>
                <p>{String(activePortalGuideIndex + 1).padStart(2, "0")} 포털 시스템 이용 안내</p>
                <h2 id="portal-guide-title">{activePortalGuide.title}</h2>
              </div>
              <button
                aria-label="포털 시스템 이용 안내 닫기"
                type="button"
                onClick={() => setIsPortalGuideOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="portal-guide-frame">
              <img src={activePortalGuide.imageUrl} alt={`${activePortalGuide.title} 안내 이미지`} />
            </div>
            <div className="portal-guide-controls" aria-label="포털 시스템 이용 안내 페이지">
              <button
                type="button"
                disabled={activePortalGuideIndex === 0}
                onClick={() => setActivePortalGuideIndex((index) => Math.max(0, index - 1))}
              >
                이전
              </button>
              <span>{activePortalGuideIndex + 1} / {portalGuideSlides.length}</span>
              <button
                type="button"
                disabled={activePortalGuideIndex === portalGuideSlides.length - 1}
                onClick={() => (
                  setActivePortalGuideIndex((index) => Math.min(portalGuideSlides.length - 1, index + 1))
                )}
              >
                다음
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="notice-footnote">
        <span aria-hidden="true">●</span>
        공지 내용은 변경될 수 있으니 수시로 확인해주세요!
      </div>

      <style jsx>{`
        .notices-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 56px 24px 80px;
          font-family: "NanumSquareRound", Arial, Helvetica, sans-serif;
        }

        .notices-hero {
          position: relative;
          display: flex;
          min-height: 132px;
          align-items: flex-start;
          justify-content: space-between;
          overflow: hidden;
        }

        .notices-hero h1 {
          margin: 0 0 14px;
          color: #21192b;
          font-size: clamp(34px, 4vw, 46px);
          line-height: 1.15;
          letter-spacing: -0.04em;
        }

        .notices-hero p {
          margin: 0;
          color: #716a7b;
          font-size: 16px;
          line-height: 1.7;
        }

        .hero-art {
          position: relative;
          width: 210px;
          height: 112px;
          margin: -8px 14px 0 0;
          opacity: 0.88;
        }

        .hero-art::before {
          position: absolute;
          inset: 18px 10px 0 30px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(126, 78, 205, 0.18), transparent 67%);
          content: "";
          filter: blur(8px);
        }

        .megaphone {
          position: absolute;
          top: 28px;
          right: 36px;
          color: #6b2fb7;
          font-size: 84px;
          font-weight: 900;
          line-height: 1;
          text-shadow: 14px 10px 18px rgba(88, 47, 130, 0.18);
          transform: rotate(-18deg);
        }

        .sound-wave {
          position: absolute;
          top: 8px;
          right: 19px;
          color: #d8c5f5;
          font-size: 72px;
          line-height: 1;
          transform: rotate(34deg);
        }

        .hero-dot {
          position: absolute;
          display: block;
          border-radius: 50%;
          background: #9b67df;
        }

        .dot-one {
          top: 16px;
          left: 38px;
          width: 18px;
          height: 18px;
          opacity: 0.18;
        }

        .dot-two {
          bottom: 22px;
          left: 62px;
          width: 7px;
          height: 7px;
        }

        .notice-filter-panel,
        .important-notices,
        .all-notices {
          border: 1px solid #e5dfea;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 6px 22px rgba(61, 39, 83, 0.035);
        }

        .notice-filter-panel {
          padding: 22px;
        }

        .notice-filter-form {
          display: grid;
          gap: 20px;
        }

        .notice-search-row {
          display: grid;
          grid-template-columns: minmax(180px, 250px) minmax(0, 1fr);
          gap: 18px;
        }

        .notice-department-combobox {
          position: relative;
          min-width: 0;
        }

        .notice-department-button {
          display: flex;
          width: 100%;
          min-height: 58px;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #ded7e5;
          border-radius: 10px;
          background: #fff;
          color: #28202f;
          padding: 0 16px;
          font-weight: 800;
          text-align: left;
        }

        .notice-department-button:hover,
        .notice-department-button:focus-visible {
          border-color: #7b42bd;
          outline: none;
        }

        .notice-department-options {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 30;
          display: grid;
          width: min(430px, calc(100vw - 48px));
          max-height: 300px;
          gap: 5px;
          overflow-y: auto;
          border: 1px solid #ded7e5;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 18px 42px rgba(35, 24, 45, 0.16);
          padding: 8px;
        }

        .notice-department-option {
          min-height: 40px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #38303f;
          padding: 9px 11px;
          text-align: left;
          font-weight: 700;
        }

        .notice-department-option:hover,
        .notice-department-option.active {
          background: #f2e9ff;
          color: #5d269f;
        }

        .notice-search-box {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 112px;
          gap: 14px;
        }

        .notice-search-box input {
          width: 100%;
          min-width: 0;
          min-height: 58px;
          border: 1px solid #d9d2df;
          border-radius: 10px;
          background: #fff;
          color: #2f2836;
          padding: 0 17px;
          outline: none;
        }

        .notice-search-box input::placeholder {
          color: #a19aa8;
        }

        .notice-search-box input:focus {
          border-color: #7b42bd;
          box-shadow: 0 0 0 3px rgba(123, 66, 189, 0.09);
        }

        .notice-search-box button {
          display: flex;
          min-height: 58px;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, #6c2eb3, #52218f);
          color: #fff;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(88, 47, 130, 0.18);
        }

        .notice-search-box button:hover {
          background: linear-gradient(135deg, #5c24a0, #431979);
        }

        .search-icon {
          position: relative;
          width: 16px;
          height: 16px;
          border: 2px solid currentColor;
          border-radius: 50%;
        }

        .search-icon::after {
          position: absolute;
          right: -6px;
          bottom: -4px;
          width: 7px;
          height: 2px;
          border-radius: 2px;
          background: currentColor;
          content: "";
          transform: rotate(45deg);
        }

        .notice-category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .notice-category-tabs button {
          min-width: 82px;
          min-height: 44px;
          border: 1px solid #e0d9e7;
          border-radius: 999px;
          background: #fff;
          color: #39313f;
          padding: 9px 21px;
          font-size: 14px;
          font-weight: 750;
        }

        .notice-category-tabs button:hover {
          border-color: #8c59c5;
          color: #5c2796;
        }

        .notice-category-tabs button.active {
          border-color: #6830aa;
          background: linear-gradient(135deg, #7135b9, #572292);
          color: #fff;
          box-shadow: 0 6px 14px rgba(88, 47, 130, 0.16);
        }

        .notice-state {
          margin-top: 18px;
          border: 1px solid #ded1ed;
          border-radius: 10px;
          background: #f8f2ff;
          color: #5c2a91;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 700;
        }

        .error-state {
          border-color: #f0cccc;
          background: #fff4f4;
          color: #b43838;
        }

        .important-notices {
          margin-top: 22px;
          border-color: #ded0ec;
          background: linear-gradient(135deg, rgba(251, 248, 255, 0.97), rgba(246, 239, 253, 0.8));
          padding: 22px;
        }

        .notice-section-heading {
          display: flex;
          min-height: 42px;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .heading-copy {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notice-section-heading h2 {
          margin: 0;
          color: #2b2035;
          font-family: "NanumSquareRound", Arial, Helvetica, sans-serif;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .important-notices .notice-section-heading h2 {
          color: #5d269b;
        }

        .heading-icon {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 50%;
          background: #fff;
          color: #6d32ad;
          box-shadow: 0 4px 13px rgba(88, 47, 130, 0.12);
          font-size: 10px;
        }

        .heading-count,
        .total-count {
          color: #6d32ad;
          font-size: 13px;
          font-weight: 800;
        }

        .all-notices {
          margin-top: 18px;
          overflow: hidden;
          padding: 22px 26px 26px;
        }

        .all-heading {
          margin-bottom: 10px;
        }

        .sort-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          min-width: 214px;
          min-height: 46px;
          border: 1px solid #e3dce8;
          border-radius: 9px;
          background: #f7f4f9;
          overflow: hidden;
          padding: 3px;
        }

        .sort-options button {
          min-height: 38px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #766d7e;
          padding: 0 15px;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
        }

        .sort-options button:hover {
          color: #5d269b;
        }

        .sort-options button:focus-visible {
          outline: 2px solid rgba(123, 66, 189, 0.45);
          outline-offset: -2px;
        }

        .sort-options button.active {
          background: #fff;
          color: #5d269b;
          box-shadow: 0 2px 8px rgba(61, 39, 83, 0.12);
        }

        .notice-table-head {
          display: grid;
          grid-template-columns: 60px 90px minmax(0, 1fr) 110px 24px;
          align-items: center;
          min-height: 48px;
          border-top: 1px solid #ece7ef;
          border-bottom: 1px solid #ece7ef;
          color: #4f4656;
          padding: 0 16px;
          font-size: 12px;
          font-weight: 800;
        }

        /* Reference-layout refinements */
        .notices-page {
          max-width: none;
          padding: 0 0 34px;
          background: #fff;
        }

        .notices-hero {
          min-height: 218px;
          background: linear-gradient(105deg, #fbf8ff 0%, #f6efff 57%, #eee2ff 100%);
          overflow: hidden;
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 1180px;
          min-height: 218px;
          align-items: center;
          justify-content: space-between;
          margin: 0 auto;
          padding: 28px 38px;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
        }

        .notices-hero h1 {
          margin-bottom: 10px;
          font-family: "NanumSquareRoundExtraBold", "NanumSquareRound", Arial, Helvetica, sans-serif;
          font-size: clamp(44px, 5vw, 62px);
          font-weight: 900;
        }

        .notices-hero p {
          color: #4e435d;
          font-size: 16px;
          font-weight: 750;
        }

        .hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 17px;
        }

        .hero-tags > span {
          display: inline-flex;
          min-height: 32px;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(103, 50, 171, 0.08);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #41334e;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 5px 14px rgba(86, 44, 133, 0.05);
        }

        .hero-art {
          width: 350px;
          height: 190px;
          margin: 0 34px 0 0;
          opacity: 1;
        }

        .hero-art::after {
          position: absolute;
          right: 37px;
          bottom: 28px;
          width: 76px;
          height: 22px;
          border-radius: 50%;
          background: rgba(72, 29, 137, 0.18);
          content: "";
          filter: blur(8px);
        }

        .megaphone-image {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 28px;
          object-fit: contain;
          object-position: center;
          mix-blend-mode: multiply;
          transform: scale(1.08);
        }

        .megaphone {
          top: 49px;
          right: 69px;
          z-index: 2;
          color: #6626c9;
          font-size: 118px;
          text-shadow: 18px 15px 20px rgba(73, 26, 149, 0.22);
        }

        .sound-wave {
          top: 21px;
          right: 48px;
          font-size: 94px;
        }

        .bell {
          position: absolute;
          top: 25px;
          right: 14px;
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(145deg, #8144e5, #5121b8);
          color: #fff;
          box-shadow: 0 10px 20px rgba(89, 38, 177, 0.2);
          font-size: 9px;
        }

        .notices-content {
          display: grid;
          grid-template-columns: minmax(0, 2.15fr) minmax(290px, 1fr);
          width: 100%;
          max-width: 1180px;
          align-items: start;
          gap: 20px;
          margin: 0 auto;
          padding: 20px 28px 0;
        }

        .notices-main-column {
          min-width: 0;
        }

        .department-alert-panel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 14px;
          margin-bottom: 16px;
          border: 1px solid #d9cbf4;
          border-radius: 10px;
          background: linear-gradient(135deg, #fbf8ff, #f2eaff);
          box-shadow: 0 10px 24px rgba(88, 47, 130, 0.08);
          padding: 15px 16px;
        }

        .department-alert-panel > div {
          display: grid;
          min-width: 0;
          gap: 9px;
        }

        .department-alert-panel strong {
          color: #251a36;
          font-size: 15px;
          line-height: 1.35;
        }

        .department-alert-panel div button {
          display: grid;
          min-width: 0;
          gap: 4px;
          border: 0;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.72);
          color: #332941;
          padding: 10px 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.4;
        }

        .department-alert-panel div button:hover {
          background: #fff;
        }

        .department-alert-panel div button span {
          color: #6d35d0;
          font-size: 12px;
          font-weight: 900;
        }

        .department-alert-panel > button {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border: 1px solid #ded1ed;
          border-radius: 8px;
          background: #fff;
          color: #7f7296;
          font-size: 20px;
          line-height: 1;
        }

        .notice-filter-panel,
        .important-notices,
        .all-notices,
        .sidebar-panel {
          border-radius: 8px;
          box-shadow: none;
        }

        .notice-filter-panel {
          padding: 14px 16px 16px;
        }

        .notice-filter-form {
          gap: 14px;
        }

        .notice-search-row {
          grid-template-columns: 154px minmax(0, 1fr);
          gap: 14px;
        }

        .notice-department-button,
        .notice-search-box input,
        .notice-search-box button {
          min-height: 46px;
          border-radius: 7px;
        }

        .notice-search-box {
          grid-template-columns: minmax(0, 1fr) 102px;
          gap: 10px;
        }

        .notice-category-tabs {
          gap: 10px;
        }

        .notice-category-tabs button {
          min-width: 73px;
          min-height: 38px;
          padding: 7px 17px;
        }

        .important-notices {
          margin-top: 16px;
          padding: 14px 12px 12px;
        }

        .notice-section-heading {
          min-height: 34px;
          margin-bottom: 10px;
        }

        .notice-section-heading h2 {
          font-size: 19px;
        }

        .heading-icon {
          width: 29px;
          height: 29px;
          background: #eee4ff;
        }

        .all-notices {
          margin-top: 16px;
          padding: 14px 16px 18px;
        }

        .sort-options {
          min-width: 184px;
          min-height: 40px;
        }

        .sort-options button {
          min-height: 32px;
          font-size: 12px;
        }

        .notice-sidebar {
          display: grid;
          gap: 16px;
        }

        .sidebar-panel {
          border: 1px solid #e5dfea;
          background: #fff;
          padding: 20px;
        }

        .sidebar-panel h2 {
          margin: 0 0 16px;
          color: #241b2d;
          font-family: "NanumSquareRound", Arial, Helvetica, sans-serif;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .shortcut-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .shortcut-card {
          display: grid;
          min-height: 102px;
          place-items: center;
          align-content: center;
          gap: 10px;
          border: 1px solid #e6dfee;
          border-radius: 8px;
          background: #fff;
          color: #2d2434;
          padding: 10px 5px;
          text-align: center;
        }

        .shortcut-card:hover {
          border-color: #bfa6dc;
          background: #fbf8ff;
          box-shadow: 0 7px 18px rgba(84, 35, 145, 0.1);
          transform: translateY(-1px);
        }

        .shortcut-card:focus-visible {
          border-color: #6b2db5;
          outline: 3px solid rgba(107, 45, 181, 0.14);
          outline-offset: 2px;
        }

        .shortcut-card > .shortcut-icon {
          display: grid;
          width: 44px;
          height: 44px;
          overflow: hidden;
          place-items: center;
          color: #5f24bc;
          line-height: 1;
        }

        .shortcut-icon img {
          display: block;
          width: 44px;
          height: 44px;
        }

        .shortcut-icon img {
          border-radius: 9px;
          object-fit: cover;
        }

        .shortcut-card strong {
          font-size: 11px;
          line-height: 1.35;
        }

        .frequent-panel h2 {
          color: #5b20ba;
        }

        .frequent-list {
          display: grid;
        }

        .frequent-list div,
        .frequent-list a,
        .frequent-list button {
          display: flex;
          width: 100%;
          min-height: 35px;
          align-items: center;
          justify-content: space-between;
          border: 0;
          background: transparent;
          color: #514859;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          text-decoration: none;
        }

        .frequent-list a:hover,
        .frequent-list button:hover,
        .frequent-list a:focus-visible,
        .frequent-list button:focus-visible {
          color: #5b20ba;
          outline: none;
        }

        .frequent-list span {
          color: #2e2536;
          font-size: 22px;
        }

        .contact-panel > p {
          margin: -7px 0 14px;
          color: #62586a;
          font-size: 12px;
        }

        .portal-guide-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          align-items: center;
          justify-items: center;
          place-items: center;
          background: rgba(30, 20, 40, 0.52);
          padding: 18px;
          animation: modalBackdropFade 180ms ease both;
        }

        .portal-guide-dialog {
          display: grid;
          width: min(980px, 92vw);
          max-height: 84vh;
          grid-template-rows: auto minmax(0, 1fr) auto;
          overflow: hidden;
          border: 1px solid #ddd3e7;
          border-radius: 16px;
          background: #fbf9ff;
          box-shadow: 0 26px 70px rgba(34, 20, 48, 0.28);
          animation: modalCenteredDialogEnter 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .portal-guide-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #ebe5f0;
          background: #fff;
          padding: 18px 22px 16px;
        }

        .portal-guide-header h2,
        .portal-guide-header p {
          margin: 0;
        }

        .portal-guide-header h2 {
          color: #2b2035;
          font-size: 20px;
          line-height: 1.35;
        }

        .portal-guide-header p {
          margin-bottom: 5px;
          color: #6f42bf;
          font-size: 13px;
          font-weight: 800;
        }

        .portal-guide-header button {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: #f1e9f8;
          color: #5b20ba;
          font-size: 25px;
          line-height: 1;
        }

        .portal-guide-frame {
          overflow: auto;
          background: #f6f1fb;
          padding: 18px;
        }

        .portal-guide-frame img {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 10px;
          background: #fff;
        }

        .student-number-guide-frame {
          min-height: min(720px, 72vh);
        }

        .student-number-guide-image {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 10px;
          background: #fff;
        }

        .portal-guide-controls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid #ebe5f0;
          background: #fff;
          padding: 14px 22px;
        }

        .portal-guide-controls button {
          min-width: 74px;
          min-height: 38px;
          border: 1px solid #d8c7eb;
          border-radius: 8px;
          background: #fff;
          color: #4d2c80;
          font-size: 13px;
          font-weight: 800;
        }

        .portal-guide-controls button:last-child {
          border-color: #6f42bf;
          background: #6f42bf;
          color: #fff;
        }

        .portal-guide-controls button:disabled {
          border-color: #e6deef;
          background: #f7f2fb;
          color: #a69aae;
          cursor: not-allowed;
        }

        .portal-guide-controls span {
          min-width: 52px;
          color: #6a6072;
          font-size: 13px;
          font-weight: 800;
          text-align: center;
        }

        .contact-list {
          display: grid;
          gap: 8px;
        }

        .contact-list div {
          display: grid;
          grid-template-columns: 25px minmax(0, 1fr) auto;
          min-height: 45px;
          align-items: center;
          gap: 7px;
          border-radius: 7px;
          background: #f8f4fd;
          color: #5220b2;
          padding: 8px 10px;
        }

        .contact-list strong {
          overflow: hidden;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .contact-list small {
          color: #6d6474;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
        }

        .notice-footnote {
          display: flex;
          width: calc(100% - 56px);
          max-width: 1124px;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin: 20px auto 0;
          border-radius: 7px;
          background: linear-gradient(90deg, #f7f2fc, #f2ebfb);
          color: #847b8d;
          font-size: 12px;
          font-weight: 700;
        }

        .notice-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 20px;
        }

        .notice-pagination button {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 1px solid transparent;
          border-radius: 7px;
          background: #fff;
          color: #30263a;
          font-family: inherit;
          font-size: 13px;
          font-weight: 800;
        }

        .notice-pagination button:hover:not(:disabled) {
          border-color: #d8c7e9;
          background: #faf7fd;
          color: #5c20b5;
        }

        .notice-pagination button.active {
          border-color: #6327b8;
          background: linear-gradient(145deg, #7132c0, #511d9d);
          color: #fff;
          box-shadow: 0 5px 12px rgba(83, 30, 155, 0.2);
        }

        .notice-pagination button:disabled {
          color: #c4bdca;
          cursor: default;
        }

        .notice-pagination button:first-child,
        .notice-pagination button:last-child {
          border-color: #e4ddea;
          font-size: 22px;
          font-weight: 500;
        }

        .pagination-ellipsis {
          display: grid;
          width: 28px;
          height: 34px;
          place-items: center;
          color: #7b7282;
          font-size: 13px;
          font-weight: 900;
        }

        @media (max-width: 760px) {
          .notices-page {
            padding: 0 0 30px;
          }

          .notices-hero {
            min-height: 210px;
          }

          .hero-inner {
            padding: 28px 20px;
          }

          .hero-art {
            position: absolute;
            top: 0;
            right: -72px;
            width: 210px;
            height: 150px;
            margin: 0;
            opacity: 0.4;
          }

          .notices-hero p {
            max-width: calc(100% - 55px);
            font-size: 14px;
          }

          .hero-tags {
            max-width: calc(100% - 70px);
          }

          .hero-tags > span {
            min-height: 28px;
            padding: 5px 9px;
            font-size: 10px;
          }

          .notices-content {
            grid-template-columns: 1fr;
            padding: 16px 14px 0;
          }

          .notice-filter-panel,
          .important-notices,
          .all-notices {
            padding: 16px;
          }

          .notice-search-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .notice-search-box {
            grid-template-columns: minmax(0, 1fr) 88px;
            gap: 8px;
          }

          .notice-category-tabs {
            gap: 8px;
          }

          .notice-category-tabs button {
            min-width: 0;
            min-height: 40px;
            padding: 8px 15px;
          }

          .notice-table-head {
            display: none;
          }

          .all-heading {
            align-items: flex-start;
          }

          .sort-options {
            min-width: 178px;
            min-height: 40px;
          }

          .sort-options button {
            min-height: 34px;
            padding: 0 10px;
            font-size: 13px;
          }

          .notice-sidebar {
            grid-template-columns: 1fr;
          }

          .portal-guide-backdrop {
            padding: 12px;
          }

          .portal-guide-dialog {
            width: 100%;
            max-height: calc(100vh - 24px);
            border-radius: 12px;
          }

          .portal-guide-header {
            padding: 15px 16px 13px;
          }

          .portal-guide-header h2 {
            font-size: 17px;
          }

          .portal-guide-frame {
            padding: 10px;
          }

          .portal-guide-controls {
            justify-content: space-between;
            padding: 12px 14px;
          }

          .notice-footnote {
            width: calc(100% - 28px);
            padding: 10px 14px;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}

function NoticeList({
  notices: items,
  empty,
  featured = false,
  startNumber,
  numberDirection = "descending",
  onNoticeRead
}: {
  notices: Notice[];
  empty: string;
  featured?: boolean;
  startNumber?: number;
  numberDirection?: "ascending" | "descending";
  onNoticeRead?: (noticeId: string) => void;
}) {
  if (items.length === 0) {
    return <div className="notice-empty">{empty}</div>;
  }

  return (
    <div className={featured ? "notice-list featured-list" : "notice-list"}>
      {items.map((notice, index) => (
        <article className={notice.isExpired ? "notice-row expired" : "notice-row"} key={notice.id}>
          {!featured ? (
            <span className="notice-number">
              {(startNumber ?? items.length) + (numberDirection === "ascending" ? index : -index)}
            </span>
          ) : null}
          <span className="notice-badge">{getNoticeBadgeLabel(notice)}</span>
          {notice.imageUrl ? (
            <img
              className="notice-thumb"
              src={notice.imageUrl}
              alt=""
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <div className="notice-copy">
            <div className="notice-title-line">
              <strong>{notice.title}</strong>
              {notice.isPinned ? <span className="new-badge">중요</span> : null}
              {!notice.isPinned && isRecentNotice(notice) ? <span className="latest-badge">최신</span> : null}
            </div>
            <span className="notice-summary">{notice.summary}</span>
            {notice.applicationDeadline ? (
              <span className="notice-deadline">신청 마감 {formatNoticeDate(notice.applicationDeadline)}</span>
            ) : null}
            <div className="notice-actions">
              {notice.isExpired ? (
                <span className="closed-badge">신청기간 마감</span>
              ) : notice.applicationUrl ? (
                <a href={notice.applicationUrl} target="_blank" rel="noreferrer" onClick={() => onNoticeRead?.(notice.id)}>신청 링크</a>
              ) : null}
            </div>
          </div>
          <time dateTime={notice.publishedAt}>{formatNoticeDate(notice.publishedAt)}</time>
          {notice.sourceUrl ? (
            <a className="row-arrow" href={notice.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${notice.title} 원문 보기`} onClick={() => onNoticeRead?.(notice.id)}>
              ›
            </a>
          ) : (
            <span className="row-arrow disabled" aria-hidden="true">›</span>
          )}
        </article>
      ))}
      <style jsx>{`
        .notice-list {
          display: grid;
        }

        .featured-list {
          overflow: hidden;
          border: 1px solid #e0d8e8;
          border-radius: 10px;
          background: #fff;
        }

        .notice-row {
          display: grid;
          grid-template-columns: 60px 90px minmax(0, 1fr) 110px 24px;
          align-items: center;
          min-height: 76px;
          border-bottom: 1px solid #ece7ef;
          padding: 11px 16px;
          color: #2d2633;
        }

        .notice-row:last-child {
          border-bottom: 0;
        }

        .notice-row:hover {
          background: #fcfaff;
        }

        .featured-list .notice-row {
          grid-template-columns: 108px minmax(0, 1fr) 130px 28px;
          min-height: 88px;
          padding: 14px 22px;
        }

        .notice-number {
          color: #4f4656;
          font-size: 14px;
        }

        .notice-badge {
          display: inline-flex;
          width: fit-content;
          min-width: 56px;
          min-height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #f0e5ff;
          color: #6330a0;
          padding: 6px 11px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .notice-copy {
          display: grid;
          min-width: 0;
          gap: 5px;
        }

        .notice-title-line {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 9px;
        }

        .notice-title-line strong {
          overflow: hidden;
          font-size: 15px;
          line-height: 1.35;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .featured-list .notice-title-line strong {
          font-size: 16px;
        }

        .new-badge {
          flex: 0 0 auto;
          border-radius: 5px;
          background: #f1e7ff;
          color: #6b2fb0;
          padding: 3px 6px;
          font-size: 9px;
          font-weight: 900;
        }

        .latest-badge {
          flex: 0 0 auto;
          border-radius: 5px;
          background: #e8f5ff;
          color: #156fa8;
          padding: 3px 6px;
          font-size: 9px;
          font-weight: 900;
        }

        .notice-summary {
          overflow: hidden;
          color: #746c7a;
          font-size: 13px;
          line-height: 1.45;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .notice-deadline {
          color: #6c4c88;
          font-size: 11px;
          font-weight: 700;
        }

        .notice-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .notice-actions:empty {
          display: none;
        }

        .notice-actions a,
        .closed-badge {
          display: inline-flex;
          width: fit-content;
          min-height: 26px;
          align-items: center;
          border: 1px solid #ddd1e9;
          border-radius: 6px;
          background: #fff;
          color: #5e288e;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
        }

        .notice-actions a:hover {
          border-color: #7135ad;
          background: #f7f0ff;
        }

        .closed-badge {
          border-color: #d9d5dc;
          background: #f1f0f2;
          color: #77717b;
        }

        .notice-row time {
          color: #665e6d;
          font-size: 13px;
          text-align: left;
          white-space: nowrap;
        }

        .row-arrow {
          display: inline-grid;
          width: 24px;
          height: 32px;
          place-items: center;
          color: #6f6877;
          font-size: 27px;
          font-weight: 300;
          text-align: right;
        }

        .row-arrow:hover {
          color: #5e288e;
        }

        .row-arrow:focus-visible {
          outline: 3px solid #cfc0ff;
          outline-offset: 3px;
        }

        .row-arrow.disabled {
          opacity: 0.35;
        }

        .notice-thumb {
          display: none;
        }

        .notice-row.expired {
          background: #f8f8f8;
          color: #817b84;
        }

        .notice-empty {
          display: grid;
          min-height: 110px;
          place-items: center;
          border: 1px dashed #ded6e5;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.7);
          color: #82798a;
          font-size: 14px;
        }

        @media (max-width: 760px) {
          .notice-row,
          .featured-list .notice-row {
            grid-template-columns: auto minmax(0, 1fr) auto;
            min-height: 96px;
            gap: 10px;
            padding: 14px 10px;
          }

          .notice-number {
            display: none;
          }

          .notice-badge {
            min-width: 50px;
            padding: 5px 8px;
          }

          .notice-row time {
            grid-column: 2;
            font-size: 11px;
            text-align: left;
          }

          .row-arrow {
            grid-column: 3;
            grid-row: 1 / span 2;
          }

          .notice-title-line {
            align-items: flex-start;
          }

          .notice-title-line strong,
          .featured-list .notice-title-line strong,
          .notice-summary {
            white-space: normal;
          }

          .notice-summary {
            display: -webkit-box;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }
        }
      `}</style>
    </div>
  );
}

function formatNoticeDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(date));
}

function isRecentNotice(notice: Notice) {
  const publishedAt = Date.parse(notice.publishedAt);
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  return Number.isFinite(publishedAt) && Date.now() - publishedAt <= thirtyDays;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | string> = [1];
  const rangeStart = Math.max(2, currentPage - 1);
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

  if (rangeStart > 2) {
    pages.push("ellipsis-start");
  }

  for (let page = rangeStart; page <= rangeEnd; page += 1) {
    pages.push(page);
  }

  if (rangeEnd < totalPages - 1) {
    pages.push("ellipsis-end");
  }

  pages.push(totalPages);
  return pages;
}

function mergeOfficialNotices(items: Notice[]) {
  const seen = new Set<string>();

  return [...items, ...officialStudentNotices].filter((notice) => {
    const key = notice.sourceUrl ?? `${notice.title}-${notice.publishedAt.slice(0, 10)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function mergeDepartmentNotices(items: Notice[], officialItems: Notice[]) {
  const seen = new Set<string>();

  const merged = [...officialItems, ...items].filter((notice) => {
    const key = notice.sourceUrl ?? `${notice.title}-${notice.publishedAt.slice(0, 10)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return applyDepartmentImportantNotices(merged);
}

function applyDepartmentImportantNotices(items: Notice[]) {
  return items.map((notice) => ({
    ...notice,
    isPinned: isRequiredDepartmentNotice(notice)
  }));
}

function isRequiredDepartmentNotice(notice: Notice) {
  const text = `${notice.title} ${notice.summary}`
    .toLowerCase()
    .replace(/\s+/g, " ");

  return [
    /졸업(가이드|필수|요건|이수|시험|논문)/,
    /학위.*(요건|이수|취득)/,
    /(전공|학과).*교육과정.*(안내|가이드|로드맵|개편|변경)/,
    /전공 개설 과목 시간표/,
    /(필수|기초전공).*(교과|과목|이수|요건|의무)/,
    /(교과목|과목).*(전공인정|이수구분)/,
    /(전공인정|이수구분).*(안내|변경|신청)/,
    /(분반|반배정|강좌배정|레벨테스트)/,
    /(수강|교과목|과목|강좌).*(유의|주의|필독)/,
    /(유의|주의|필독).*(수강|교과목|과목|강좌)/,
    /(수강|과목|강좌).*(신청|정정|철회|장바구니|관심강좌|예외|증원|시간표 변경)/,
    /(자격|실습).*(필수|수강강의|이수과목|관련 필수)/,
    /(필독.*교직|교직이수)/,
    /(대회|공모|공모전|경진|경연|해커톤|캠프).*(신청|접수|모집|참가|홍보|안내)/,
    /(신청|접수|모집|참가).*(대회|공모|공모전|경진|경연|해커톤|캠프)/
  ].some((pattern) => pattern.test(text));
}

function getDepartmentNoticeCategory(notice: Notice): DepartmentNoticeCategory {
  const text = `${notice.title} ${notice.summary}`.toLowerCase();

  if (/(졸업|학위|논문|캡스톤|인증|이수인증)/.test(text)) {
    return "graduation";
  }

  if (/(교육과정|교과|전공|수강|이수|교직|강의|수업|커리큘럼)/.test(text)) {
    return "curriculum";
  }

  if (/(행사|특강|세미나|설명회|대회|공모|공모전|경진|박람회|워크숍|워크샵|간담회|모집|프로그램)/.test(text)) {
    return "event";
  }

  return "campus";
}

function getNoticeBadgeLabel(notice: Notice) {
  if (notice.summary.includes("교육과정")) {
    return "교육과정";
  }

  if (notice.summary.includes("졸업")) {
    return "졸업";
  }

  if (notice.summary.includes("교내공지")) {
    return "교내공지";
  }

  return categoryLabels[notice.category];
}
