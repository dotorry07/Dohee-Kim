"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { extractStudentNumber, getGradeFromStudentNumber } from "@/lib/student";
import { getTodayClasses } from "@/lib/timetable";
import type { Timetable } from "@/lib/types";
import type { ChecklistItem, DashboardData, DashboardIconName, DashboardUser, MealWeekday, ScheduleType, TodayScheduleItem } from "@/types/dashboard";
import { formatKoreanDate, getDdayLabel, getRelativeTime, normalizeDate } from "@/utils/date";
import { FreshmanChecklist } from "./FreshmanChecklist";
import styles from "@/app/dashboard/Dashboard.module.css";

const noticeLabels = { academic: "학사", scholarship: "장학", registration: "수강", event: "행사", career: "취업/진로", general: "일반" } as const;
const postLabels = { freshman: "새내기 Q&A", free: "자유게시판", department: "학과", info: "정보 공유" } as const;
const scheduleLabels: Record<ScheduleType, string> = { CLASS: "수업", PART_TIME: "알바", CLUB: "동아리", PERSONAL: "개인 약속", OTHER: "기타" };
const savedTimetablesKey = "newbie-on:timetables";
const importantTimetablesKey = "newbie-on:important-timetables";
const selectedTimetablesBySemesterKey = "newbie-on:selected-timetables-by-semester";
const legacyMonthlyTimetableKey = "newbie-on:monthly-timetable";
const currentSemester = "2026-2";
const dayCodes = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
type ScheduleState = "current" | "next" | "ended";

function Icon({ name }: { name: DashboardIconName }) {
  const paths: Record<DashboardIconName, ReactNode> = {
    calendar: <><path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z"/><path d="M8 13h2M14 13h2M8 17h2"/></>,
    notice: <><path d="m4 13 3 1 9 4V6l-9 4-3 1v2Z"/><path d="m7 14 1 5h3l-1-4"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    chat: <path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.7-4.2A8.5 8.5 0 1 1 21 11.5Z"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    meal: <><path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c3 2 3 8 0 10"/></>
  };
  return <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Heading({ icon, title, href, meta }: { icon: DashboardIconName; title: string; href?: string; meta?: string }) {
  return <div className={styles.cardHeading}><div className={styles.headingTitle}><Icon name={icon}/><h2>{title}</h2></div>{href ? <Link className={styles.more} href={href}>전체 보기</Link> : meta ? <span className={styles.headingMeta}>{meta}</span> : null}</div>;
}
function minutes(time: string) { const [h, m] = time.split(":").map(Number); return h * 60 + m; }

function getNoticeHref(sourceUrl?: string) {
  return sourceUrl || "/notices";
}

function getTimetableSortValue(timetable: Timetable) {
  const [year = "0", semesterPart = ""] = timetable.semester.split("-");
  const semesterOrder: Record<string, number> = { "1": 1, summer: 2, "2": 3, winter: 4 };
  return Number(year) * 10 + (semesterOrder[semesterPart] ?? 0);
}

function ScheduleItem({ item, state }: { item: TodayScheduleItem; state: ScheduleState }) {
  const title = item.type === "CLASS" && item.subtitle ? `${item.title} · ${item.subtitle}` : item.title;

  return <li className={`${styles.scheduleItem} ${state ? styles[state] : ""}`}>
    <div className={styles.scheduleTime}><strong>{item.startTime}</strong><span>{item.endTime ? `–${item.endTime}` : ""}</span></div>
    <span className={`${styles.scheduleBadge} ${styles[`schedule_${item.type}`]}`}>{scheduleLabels[item.type]}</span>
    <div className={styles.scheduleContent}><h3>{title}</h3>{item.location && <p>{item.location}</p>}{item.type !== "CLASS" && item.subtitle ? <small>{item.subtitle}</small> : null}</div>
    <span className={styles.scheduleState}>{state === "current" ? (item.type === "CLASS" ? "수업 중" : "진행 중") : state === "next" ? "다음 일정" : "종료"}</span>
  </li>;
}

function DashboardLoadingState() {
  return (
    <div className={styles.cardLoading} role="status" aria-live="polite">
      <span className={styles.loadingSpinner} aria-hidden="true" />
      <span>로딩중입니다...</span>
    </div>
  );
}

export function DashboardContent({ user, data, checklistItems, databaseUserId, isLoading = false }: { user: DashboardUser; data: DashboardData; checklistItems: ChecklistItem[]; databaseUserId: string | null; isLoading?: boolean }) {
  const [mealCampus, setMealCampus] = useState<"sujeong" | "unjeong">("sujeong");
  const [now, setNow] = useState(() => new Date());
  const [dashboardTimetables, setDashboardTimetables] = useState<Timetable[]>(data.timetables);
  const [favoriteTimetableIds, setFavoriteTimetableIds] = useState<Set<string>>(new Set());
  const [selectedTimetableIdsBySemester, setSelectedTimetableIdsBySemester] = useState<Record<string, string>>({});
  const { academicEvents, campusMeals, notices, posts, timetables } = data;

  const syncFavoriteTimetables = useCallback(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(savedTimetablesKey) ?? "[]") as Timetable[];
      const favorites = JSON.parse(window.localStorage.getItem(importantTimetablesKey) ?? "[]") as string[];
      const savedSelectedTimetablesBySemester = window.localStorage.getItem(selectedTimetablesBySemesterKey);
      const legacyMonthlyTimetableId = window.localStorage.getItem(legacyMonthlyTimetableKey);
      const selectedBySemester = savedSelectedTimetablesBySemester
        ? JSON.parse(savedSelectedTimetablesBySemester) as Record<string, string>
        : legacyMonthlyTimetableId ? { [currentSemester]: legacyMonthlyTimetableId } : {};
      setDashboardTimetables([...new Map([...timetables, ...saved].map((item) => [item.id, item])).values()]);
      setFavoriteTimetableIds(new Set(favorites));
      setSelectedTimetableIdsBySemester(selectedBySemester);
    } catch {
      setDashboardTimetables(timetables);
      setFavoriteTimetableIds(new Set());
      setSelectedTimetableIdsBySemester({});
    }
  }, [timetables]);

  useEffect(() => {
    syncFavoriteTimetables();
    const clock = window.setInterval(() => setNow(new Date()), 60_000);
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === savedTimetablesKey
        || event.key === importantTimetablesKey
        || event.key === selectedTimetablesBySemesterKey
        || event.key === legacyMonthlyTimetableKey
      ) {
        syncFavoriteTimetables();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncFavoriteTimetables);
    return () => {
      window.clearInterval(clock);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncFavoriteTimetables);
    };
  }, [syncFavoriteTimetables]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDayKey = dayCodes[now.getDay()];
  const selectedTimetableIds = Object.values(selectedTimetableIdsBySemester);
  const selectedCurrentSemesterTimetableId = selectedTimetableIdsBySemester[currentSemester] ?? null;
  const userTimetables = dashboardTimetables.filter((item) => (
    item.userId === user.id
    || item.userId === databaseUserId
    || selectedTimetableIds.includes(item.id)
  ));
  const currentSemesterTimetables = userTimetables.filter((item) => item.semester === currentSemester);
  const selectedCurrentSemesterTimetables = selectedCurrentSemesterTimetableId
    ? currentSemesterTimetables.filter((item) => item.id === selectedCurrentSemesterTimetableId)
    : [];
  const selectedTimetables = selectedTimetableIds.length
    ? userTimetables.filter((item) => selectedTimetableIds.includes(item.id)).sort((a, b) => getTimetableSortValue(b) - getTimetableSortValue(a))
    : [];
  const selectedFlagCurrentSemesterTimetables = currentSemesterTimetables.filter((item) => item.isSelected);
  const selectedFlagTimetables = userTimetables.filter((item) => item.isSelected).sort((a, b) => getTimetableSortValue(b) - getTimetableSortValue(a));
  const favoriteCurrentSemesterTimetables = currentSemesterTimetables.filter((item) => favoriteTimetableIds.has(item.id));
  const activeTimetables = selectedCurrentSemesterTimetables.length
    ? selectedCurrentSemesterTimetables
    : selectedTimetables.length
      ? [selectedTimetables[0]]
    : selectedFlagCurrentSemesterTimetables.length
      ? selectedFlagCurrentSemesterTimetables
      : selectedFlagTimetables.length
        ? [selectedFlagTimetables[0]]
      : favoriteCurrentSemesterTimetables.length
        ? favoriteCurrentSemesterTimetables
        : currentSemesterTimetables;
  const classes = activeTimetables.flatMap((item) => getTodayClasses(item.classes));
  const nextClass = classes.find((item) => minutes(item.startTime) > nowMinutes);
  const wait = nextClass ? minutes(nextClass.startTime) - nowMinutes : null;
  const displayName = user.nickname || user.name || "새내기";
  const important = [...notices].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).slice(0, 4);
  const recent = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  const timetablePersonalSchedules = activeTimetables.flatMap((timetable) => (timetable.personalSchedules ?? [])
    .filter((item) => item.dayOfWeek === currentDayKey)
    .map((item) => ({ id: item.id, type: "PERSONAL" as const, title: item.title, startTime: item.startTime, endTime: item.endTime, subtitle: item.memo })));
  const todaySchedules: TodayScheduleItem[] = Array.from(new Map([
    ...classes.map((item) => ({ id: item.id, type: "CLASS" as const, title: item.courseName, startTime: item.startTime, endTime: item.endTime, location: `${item.buildingName} ${item.roomName}`, subtitle: `${item.professorName} 교수` })),
    ...timetablePersonalSchedules
  ].map((item) => [item.id, item])).values()).sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  const firstScheduleLocation = todaySchedules.find((item) => item.location)?.location ?? null;
  const storedStudentNumber = extractStudentNumber(user.id);
  const displayStudentNumber = storedStudentNumber || "학번 미등록";
  const displayGrade = storedStudentNumber ? getGradeFromStudentNumber(storedStudentNumber) : user.grade;
  const mealDay = [null, "MON", "TUE", "WED", "THU", "FRI", null][now.getDay()] as MealWeekday | null;
  const todayMeal = campusMeals[mealCampus];
  const todayMenus = mealDay ? todayMeal.menusByDay[mealDay] : undefined;
  const mealMapHref = mealCampus === "sujeong"
    ? "/map?campus=수정&category=식당&target=수정관10층"
    : "/map?campus=운정&category=식당&target=P동10층";

  return <main className={styles.page}><div className={styles.container}>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>NEWBIE ON DASHBOARD</p><h1>안녕하세요, {displayName}님! <span aria-hidden="true">👋</span></h1><p>오늘도 즐거운 하루 되세요. 필요한 정보를 한눈에 확인해보세요.</p></div>
      <div className={styles.summary}><span className={styles.iconBox}><Icon name="calendar"/></span><div><small>오늘은</small><strong>{formatKoreanDate(now)}</strong></div><div className={styles.summaryStats}><span>오늘 일정 <b>{isLoading ? "로딩 중" : `${todaySchedules.length}개`}</b></span><span>{isLoading ? <b>로딩 중</b> : wait !== null ? <>다음 수업까지 <b>{wait}분</b></> : <b>오늘 수업 완료</b>}</span></div></div>
    </section>

    <section className={styles.twoGrid}>
      <article className={styles.card}><Heading icon="calendar" title="오늘의 일정" meta={isLoading ? "로딩 중" : `${todaySchedules.length}개`}/>
        {isLoading ? <DashboardLoadingState /> : todaySchedules.length ? <><ol className={styles.scheduleList}>{todaySchedules.map((item) => { const state: ScheduleState = nowMinutes < minutes(item.startTime) ? "next" : item.endTime && nowMinutes < minutes(item.endTime) ? "current" : "ended"; return <ScheduleItem item={item} key={item.id} state={state}/>; })}</ol>{firstScheduleLocation ? <div className={styles.actionArea}><Link className={styles.actionButton} href={`/map?location=${encodeURIComponent(firstScheduleLocation)}`}>캠퍼스 길찾기</Link><small>다음 일정 장소({firstScheduleLocation}) 위치 확인하기</small></div> : null}</> : <div className={`${styles.empty} ${styles.scheduleEmpty}`}><span className={styles.emptyIcon} aria-hidden="true">☕</span><p>오늘은 예정된 일정이 없습니다. 편안한 휴식을 취하세요! ☕</p></div>}
      </article>
      <article className={styles.card}><Heading icon="notice" title="중요 공지" href="/notices"/><div className={styles.noticeList}>{isLoading ? <DashboardLoadingState /> : important.length ? important.map((notice) => <Link className={styles.noticeItem} href={getNoticeHref(notice.sourceUrl)} key={notice.id}><span className={`${styles.badge} ${styles[`notice_${notice.category}`]}`}>{noticeLabels[notice.category]}</span><div><h3>{notice.isPinned && <i className={styles.unread} aria-label="읽지 않은 중요 공지"/>}{notice.title}</h3><p>{notice.summary}</p><time>{new Intl.DateTimeFormat("ko-KR").format(new Date(notice.publishedAt))}</time></div></Link>) : <div className={styles.empty}>표시할 공지가 없습니다.</div>}</div></article>
    </section>

    <section className={styles.mainGrid}>
      <div className={styles.sideStack}>
        <article className={styles.card}>
          <Heading icon="user" title="학생 프로필"/>
          <div className={styles.profileTop}>
            <div className={styles.avatar} aria-label="기본 프로필 아바타"><Icon name="user"/></div>
            <div><h3>{displayName}</h3><span className={styles.freshmanBadge}>신입생</span></div>
          </div>
          <dl className={styles.profileList}>
            <div><dt>학번</dt><dd>{displayStudentNumber}</dd></div>
            <div><dt>소속</dt><dd>{user.department}</dd></div>
            {user.secondaryDepartment ? <div><dt>부/복수전공</dt><dd>{user.secondaryDepartment}</dd></div> : null}
            <div><dt>학년</dt><dd>{displayGrade}학년</dd></div>
            <div><dt>이메일</dt><dd title={user.email}>{user.email}</dd></div>
          </dl>
          <Link className={styles.profileButton} href="/mypage">내 정보 확인하기</Link>
        </article>
      </div>
      <article className={styles.card}><Heading icon="clock" title="D-DAY 학사일정" href="/notices"/><div className={styles.eventList}>{academicEvents.map((event) => { const isCompleted = normalizeDate(event.startDate).getTime() < normalizeDate(now).getTime(); return <div className={`${styles.event} ${isCompleted ? styles.eventCompleted : ""}`} key={event.id}><span className={styles.iconBox}><Icon name="calendar"/></span><div><h3>{event.title}</h3><p>{event.displayDate}</p></div><strong>{isCompleted ? "완료" : getDdayLabel(now, event.startDate)}</strong></div>; })}</div></article>
      <article className={styles.card}><Heading icon="chat" title="최근 게시글" href="/board"/><div className={styles.postList}>{isLoading ? <DashboardLoadingState /> : recent.length ? recent.map((post) => { const isNew = now.getTime() - new Date(post.createdAt).getTime() <= 86_400_000; return <Link href={`/board/${post.id}`} className={styles.post} key={post.id}><div><span className={styles.postCategory}>{postLabels[post.category]}</span>{isNew && <span className={styles.newBadge}>NEW</span>}{post.viewCount >= 100 && <span className={styles.hotBadge}>HOT</span>}</div><h3>{post.title}</h3><p>댓글 {post.comments.length} · 조회 {post.viewCount} · {getRelativeTime(post.createdAt, now)}</p></Link>; }) : <div className={styles.empty}>최근 게시글이 없습니다.</div>}</div></article>
    </section>

    <section className={styles.bottomGrid}>
      <article className={styles.card}><Heading icon="meal" title="오늘의 학식"/><div className={styles.meal}><div className={styles.mealCampusTabs} role="group" aria-label="학식 캠퍼스 선택"><button className={mealCampus === "sujeong" ? styles.activeMealCampusTab : styles.mealCampusTab} type="button" aria-pressed={mealCampus === "sujeong"} onClick={() => setMealCampus("sujeong")}>수정캠</button><button className={mealCampus === "unjeong" ? styles.activeMealCampusTab : styles.mealCampusTab} type="button" aria-pressed={mealCampus === "unjeong"} onClick={() => setMealCampus("unjeong")}>운정캠</button></div><div className={styles.mealTitle}><h3>{todayMeal.cafeteria}</h3><span className={`${styles.mealStatus} ${!todayMenus ? styles.mealClosed : ""}`}>{todayMenus ? "식사 가능" : "휴무일"}</span></div>{todayMenus ? <ul>{todayMenus.map((menu) => <li key={menu}>{menu}</li>)}</ul> : <p className={styles.mealClosedMessage}>오늘은 휴무입니다</p>}<div><span>{todayMeal.hours}</span><strong>{todayMeal.price}</strong></div><div className={styles.actionArea}><Link className={styles.actionButton} href={mealMapHref}>학식 자세히보기</Link><small>선택한 캠퍼스 식당 위치 확인</small></div></div></article>
      <FreshmanChecklist userId={user.id} databaseUserId={databaseUserId} initialItems={checklistItems} isLoading={isLoading}/>
    </section>
  </div></main>;
}
