"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { getTodayClasses } from "@/lib/timetable";
import type { ChecklistItem, DashboardData, DashboardIconName, DashboardUser, ScheduleType, TodayScheduleItem } from "@/types/dashboard";
import { formatKoreanDate, getDdayLabel, getRelativeTime } from "@/utils/date";
import { FreshmanChecklist } from "./FreshmanChecklist";
import styles from "@/app/dashboard/Dashboard.module.css";

const noticeLabels = { academic: "학사", scholarship: "장학", registration: "수강", event: "행사", career: "취업/진로", general: "일반" } as const;
const postLabels = { freshman: "새내기 Q&A", free: "자유게시판", department: "학과", info: "정보 공유" } as const;
const scheduleLabels: Record<ScheduleType, string> = { CLASS: "수업", PART_TIME: "알바", CLUB: "동아리", PERSONAL: "개인 약속", OTHER: "기타" };

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

function ScheduleItem({ item, state }: { item: TodayScheduleItem; state?: "current" | "next" }) {
  return <li className={`${styles.scheduleItem} ${state ? styles[state] : ""}`}>
    <div className={styles.scheduleTime}><strong>{item.startTime}</strong><span>{item.endTime ? `–${item.endTime}` : ""}</span></div>
    <span className={`${styles.scheduleBadge} ${styles[`schedule_${item.type}`]}`}>{scheduleLabels[item.type]}</span>
    <div className={styles.scheduleContent}><h3>{item.title}</h3>{item.location && <p>{item.location}</p>}{item.subtitle && <small>{item.subtitle}</small>}</div>
    {state && <span className={styles.scheduleState}>{state === "current" ? "진행 중" : "다음 일정"}</span>}
  </li>;
}

export function DashboardContent({ user, data, checklistItems, databaseUserId }: { user: DashboardUser; data: DashboardData; checklistItems: ChecklistItem[]; databaseUserId: string | null }) {
  const [mealCampus, setMealCampus] = useState<"sujeong" | "unjeong">("sujeong");
  const { academicEvents, notices, personalTodaySchedules, posts, timetables, todayMeal } = data;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const selected = timetables.find((item) => item.userId === user.id && item.isSelected);
  const classes = selected ? getTodayClasses(selected.classes) : [];
  const nextClass = classes.find((item) => minutes(item.startTime) > nowMinutes);
  const wait = nextClass ? minutes(nextClass.startTime) - nowMinutes : null;
  const displayName = user.nickname || user.name || "새내기";
  const studentNumber = user.id.replace(/\D/g, "").slice(-8) || "학번 미등록";
  const important = [...notices].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).slice(0, 4);
  const recent = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const todaySchedules: TodayScheduleItem[] = [
    ...classes.map((item) => ({ id: item.id, type: "CLASS" as const, title: item.courseName, startTime: item.startTime, endTime: item.endTime, location: `${item.buildingName} ${item.roomName}`, subtitle: `${item.professorName} 교수` })),
    ...personalTodaySchedules
  ].sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
  const currentSchedule = todaySchedules.find((item) => minutes(item.startTime) <= nowMinutes && item.endTime && minutes(item.endTime) > nowMinutes);
  const nextSchedule = todaySchedules.find((item) => minutes(item.startTime) > nowMinutes);
  const firstScheduleLocation = todaySchedules.find((item) => item.location)?.location ?? "학생회관";
  const campusMapLocation = mealCampus === "sujeong" ? "수정캠_학생식당" : "운정캠_학생식당";

  return <main className={styles.page}><div className={styles.container}>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>NEWBIE ON DASHBOARD</p><h1>안녕하세요, {displayName}님! <span aria-hidden="true">👋</span></h1><p>오늘도 즐거운 하루 되세요. 필요한 정보를 한눈에 확인해보세요.</p></div>
      <div className={styles.summary}><span className={styles.iconBox}><Icon name="calendar"/></span><div><small>오늘은</small><strong>{formatKoreanDate(now)}</strong></div><div className={styles.summaryStats}><span>오늘 일정 <b>{todaySchedules.length}개</b></span><span>{wait !== null ? <>다음 수업까지 <b>{wait}분</b></> : <b>오늘 수업 완료</b>}</span></div></div>
    </section>

    <section className={styles.twoGrid}>
      <article className={styles.card}><Heading icon="calendar" title="오늘의 일정" meta={`${todaySchedules.length}개`}/>
        {todaySchedules.length ? <><ol className={styles.scheduleList}>{todaySchedules.map((item) => <ScheduleItem item={item} key={item.id} state={item.id === currentSchedule?.id ? "current" : item.id === nextSchedule?.id ? "next" : undefined}/>)}</ol><div className={styles.actionArea}><Link className={styles.actionButton} href={`/map?location=${encodeURIComponent(firstScheduleLocation)}`}>캠퍼스 길찾기</Link><small>다음 일정 장소({firstScheduleLocation}) 위치 확인하기</small></div></> : <div className={styles.empty}><p>오늘 예정된 일정이 없습니다.</p></div>}
      </article>
      <article className={styles.card}><Heading icon="notice" title="중요 공지" href="/notices"/><div className={styles.noticeList}>{important.length ? important.map((notice) => <Link className={styles.noticeItem} href="/notices" key={notice.id}><span className={`${styles.badge} ${styles[`notice_${notice.category}`]}`}>{noticeLabels[notice.category]}</span><div><h3>{notice.isPinned && <i className={styles.unread} aria-label="읽지 않은 중요 공지"/>}{notice.title}</h3><p>{notice.summary}</p><time>{new Intl.DateTimeFormat("ko-KR").format(new Date(notice.publishedAt))}</time></div></Link>) : <div className={styles.empty}>표시할 공지가 없습니다.</div>}</div></article>
    </section>

    <section className={styles.mainGrid}>
      <div className={styles.sideStack}>
        <article className={styles.card}><Heading icon="user" title="학생 프로필"/><div className={styles.profileTop}><div className={styles.avatar} aria-label="기본 프로필 아바타"><Icon name="user"/></div><div><h3>{displayName}</h3><span className={styles.freshmanBadge}>신입생</span></div></div><dl className={styles.profileList}><div><dt>학번</dt><dd>{studentNumber}</dd></div><div><dt>소속</dt><dd>{user.department}</dd></div><div><dt>학년</dt><dd>{user.grade}학년</dd></div><div><dt>이메일</dt><dd title={user.email}>{user.email}</dd></div></dl><Link className={styles.profileButton} href="/timetable">내 시간표 관리</Link></article>
      </div>
      <article className={styles.card}><Heading icon="clock" title="D-DAY 학사일정" href="/notices"/><div className={styles.eventList}>{academicEvents.map((event) => <div className={styles.event} key={event.id}><span className={styles.iconBox}><Icon name="calendar"/></span><div><h3>{event.title}</h3><p>{event.displayDate}</p></div><strong>{getDdayLabel(now, event.startDate)}</strong></div>)}</div></article>
      <article className={styles.card}><Heading icon="chat" title="최근 게시글" href="/board"/><div className={styles.postList}>{recent.length ? recent.map((post) => { const isNew = now.getTime() - new Date(post.createdAt).getTime() <= 86_400_000; return <Link href={`/board/${post.id}`} className={styles.post} key={post.id}><div><span className={styles.postCategory}>{postLabels[post.category]}</span>{isNew && <span className={styles.newBadge}>NEW</span>}{post.viewCount >= 100 && <span className={styles.hotBadge}>HOT</span>}</div><h3>{post.title}</h3><p>댓글 {post.comments.length} · 조회 {post.viewCount} · {getRelativeTime(post.createdAt, now)}</p></Link>; }) : <div className={styles.empty}>최근 게시글이 없습니다.</div>}</div></article>
    </section>

    <section className={styles.bottomGrid}>
      <article className={styles.card}><Heading icon="meal" title="오늘의 학식"/>{todayMeal ? <div className={styles.meal}><div className={styles.mealCampusTabs} role="group" aria-label="학식 캠퍼스 선택"><button className={mealCampus === "sujeong" ? styles.activeMealCampusTab : styles.mealCampusTab} type="button" aria-pressed={mealCampus === "sujeong"} onClick={() => setMealCampus("sujeong")}>수정캠</button><button className={mealCampus === "unjeong" ? styles.activeMealCampusTab : styles.mealCampusTab} type="button" aria-pressed={mealCampus === "unjeong"} onClick={() => setMealCampus("unjeong")}>운정캠</button></div><div className={styles.mealTitle}><h3>{todayMeal.cafeteria}</h3><span className={styles.mealStatus}>{todayMeal.status === "AVAILABLE" ? "식사 가능" : todayMeal.status === "CLOSING_SOON" ? "마감 임박" : "운영 종료"}</span></div><ul>{todayMeal.menus.map((menu) => <li key={menu}>{menu}</li>)}</ul><div><span>{todayMeal.hours}</span><strong>{todayMeal.price}</strong></div><div className={styles.actionArea}><Link className={styles.actionButton} href={`/map?location=${encodeURIComponent(campusMapLocation)}`}>학식 자세히보기</Link><small>선택한 캠퍼스 식당 위치 확인</small></div></div> : <div className={styles.empty}>오늘 등록된 메뉴가 없습니다.</div>}</article>
      <FreshmanChecklist userId={user.id} databaseUserId={databaseUserId} initialItems={checklistItems}/>
    </section>
  </div></main>;
}
