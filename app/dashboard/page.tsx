"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { courses, notices, posts } from "@/lib/data";
import { dayLabels, getTodayClasses } from "@/lib/timetable";
import { loadRemoteTimetables } from "@/lib/timetable-storage";
import type { Timetable, UserProfile } from "@/lib/types";

const savedTimetablesKey = "newbie-on:timetables";

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getMinutesUntil(time: string, now = new Date()) {
  return toMinutes(time) - (now.getHours() * 60 + now.getMinutes());
}

function formatRelativePostTime(createdAt: string, now = new Date()) {
  const diffMinutes = Math.max(1, Math.floor((now.getTime() - Date.parse(createdAt)) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  return `${Math.floor(diffHours / 24)}일 전`;
}

const categoryLabels = {
  freshman: "새내기 Q&A",
  free: "자유게시판",
  department: "학과",
  info: "정보 공유"
} as const;

const noticeLabels = {
  academic: "학사",
  scholarship: "장학",
  registration: "수강",
  event: "행사",
  career: "진로",
  general: "일반"
} as const;

const courseTags = ["전공", "교양", "전공"] as const;
const courseNotes = ["실습이 체계적이고 교수님이 친절해요!", "과제 부담이 적고 글쓰기 능력 향상에 좋아요.", "전공의 기초가 되는 강의! 이해하기 쉽게 설명해요."];

function DashboardIcon({ name }: { name: "calendar" | "megaphone" | "star" | "chat" | "bolt" | "map" | "book" | "chevron" }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.3
  };

  return (
    <svg aria-hidden="true" className="dashboard-icon" viewBox="0 0 24 24">
      {name === "calendar" ? (
        <>
          <rect height="16" rx="2.5" width="18" x="3" y="5" {...common} />
          <path d="M8 3v4M16 3v4M3 10h18" {...common} />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" {...common} />
        </>
      ) : null}
      {name === "megaphone" ? (
        <>
          <path d="M4 13h3l9 5V6l-9 5H4v2Z" {...common} />
          <path d="M7 13v5M19 9.5a4 4 0 0 1 0 5" {...common} />
        </>
      ) : null}
      {name === "star" ? (
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" {...common} />
      ) : null}
      {name === "chat" ? (
        <path d="M21 11.5a8.4 8.4 0 0 1-8.7 8.2 9.6 9.6 0 0 1-3.2-.5L4 21l1.7-4.1A7.8 7.8 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.2 8.4 8.4 0 0 1 9 8.2Z" {...common} />
      ) : null}
      {name === "bolt" ? (
        <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" fill="currentColor" />
      ) : null}
      {name === "map" ? (
        <>
          <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" {...common} />
          <path d="M9 3v15M15 6v15" {...common} />
        </>
      ) : null}
      {name === "book" ? (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" {...common} />
          <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" {...common} />
        </>
      ) : null}
      {name === "chevron" ? <path d="m9 5 7 7-7 7" {...common} /> : null}
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(user) => <DashboardWorkspace user={user} />}
    </AuthGuard>
  );
}

function DashboardWorkspace({ user }: { user: UserProfile }) {
  const [userTimetables, setUserTimetables] = useState<Timetable[]>([]);
  const now = new Date();
  const selected = userTimetables.find((item) => item.isSelected);
  const todayClasses = selected ? getTodayClasses(selected.classes) : [];
  const nextClass = todayClasses.find((item) => toMinutes(item.endTime) > now.getHours() * 60 + now.getMinutes());
  const minutesUntilNext = nextClass ? getMinutesUntil(nextClass.startTime, now) : null;
  const today = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(now);
  const pinnedNotices = notices.filter((notice) => notice.isPinned).slice(0, 2);
  const recommendedCourses = [...courses].sort((a, b) => b.reviewAverage - a.reviewAverage).slice(0, 3);
  const recentPosts = [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5);

  useEffect(() => {
    const saved = window.localStorage.getItem(savedTimetablesKey);

    if (saved) {
      try {
        setUserTimetables(JSON.parse(saved) as Timetable[]);
      } catch {
        window.localStorage.removeItem(savedTimetablesKey);
      }
    }

    async function loadRemote() {
      try {
        const remoteTimetables = await loadRemoteTimetables(user);
        if (remoteTimetables) {
          setUserTimetables(remoteTimetables);
        }
      } catch {
        // 로컬 저장 시간표가 있으면 그대로 사용합니다.
      }
    }

    void loadRemote();
  }, [user]);

  return (
    <main className="dashboard-page">
            <section className="dashboard-shell">
              <div className="dashboard-hero">
                <div>
                  <h1>안녕하세요, {user.nickname}님! <span aria-hidden="true">👋</span></h1>
                  <p>오늘도 즐거운 하루 되세요. 필요한 정보를 한눈에 확인해보세요.</p>
                </div>
                <aside className="dashboard-date-card" aria-label="오늘 요약">
                  <DashboardIcon name="calendar" />
                  <div>
                    <span>오늘은</span>
                    <strong>{today}</strong>
                    <p>
                      오늘 수업 {todayClasses.length}개
                      {minutesUntilNext !== null && minutesUntilNext > 0 ? <> · 다음 수업까지 <b>{minutesUntilNext}분</b></> : null}
                    </p>
                  </div>
                </aside>
              </div>

              <section className="dashboard-grid">
                <article className="dashboard-card">
                  <div className="dashboard-card-title">
                    <div>
                      <DashboardIcon name="calendar" />
                      <h2>오늘 수업</h2>
                    </div>
                    <Link href="/timetable">전체 시간표</Link>
                  </div>
                  {todayClasses.length > 0 ? (
                    <div className="dashboard-class-stack">
                      <div className="dashboard-current-class">
                        <div className="dashboard-class-time">
                          <strong>1교시</strong>
                          <span>{todayClasses[0].startTime}</span>
                          <em>~</em>
                          <span>{todayClasses[0].endTime}</span>
                        </div>
                        <div className="dashboard-class-detail">
                          <h3>{todayClasses[0].courseName}</h3>
                          <p>{todayClasses[0].buildingName} {todayClasses[0].roomName}</p>
                          <span>{todayClasses[0].professorName} 교수</span>
                        </div>
                      </div>
                      {todayClasses[1] ? (
                        <Link className="dashboard-next-class" href="/timetable">
                          <span>다음 수업</span>
                          <strong>{todayClasses[1].courseName}</strong>
                          <p>{todayClasses[1].startTime} - {todayClasses[1].endTime} · {todayClasses[1].buildingName} {todayClasses[1].roomName}</p>
                          <DashboardIcon name="chevron" />
                        </Link>
                      ) : (
                        <Link className="dashboard-next-class" href="/timetable">
                          <span>다음 수업</span>
                          <strong>{nextClass?.courseName ?? "오늘 남은 수업이 없습니다"}</strong>
                          <p>{nextClass ? `${nextClass.startTime} - ${nextClass.endTime} · ${nextClass.buildingName} ${nextClass.roomName}` : "시간표에서 이번 주 일정을 확인해보세요."}</p>
                          <DashboardIcon name="chevron" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="dashboard-empty">
                      <strong>오늘 수업이 없습니다.</strong>
                      <span>시간표를 선택하면 오늘 일정이 표시됩니다.</span>
                    </div>
                  )}
                </article>

                <article className="dashboard-card">
                  <div className="dashboard-card-title">
                    <div>
                      <DashboardIcon name="megaphone" />
                      <h2>중요 공지</h2>
                    </div>
                    <Link href="/notices">전체 보기</Link>
                  </div>
                  <div className="dashboard-notice-list">
                    {pinnedNotices.map((notice) => (
                      <Link className="dashboard-notice-item" href="/notices" key={notice.id}>
                        <span>{noticeLabels[notice.category]}</span>
                        <div>
                          <strong>{notice.title}</strong>
                          <p>{notice.summary}</p>
                          <time>{new Intl.DateTimeFormat("ko-KR").format(new Date(notice.publishedAt))}</time>
                        </div>
                      </Link>
                    ))}
                  </div>
                </article>

                <article className="dashboard-card">
                  <div className="dashboard-card-title">
                    <div>
                      <DashboardIcon name="star" />
                      <h2>추천 강의</h2>
                    </div>
                    <Link href="/reviews">전체 보기</Link>
                  </div>
                  <div className="dashboard-course-list">
                    {recommendedCourses.map((course, index) => (
                      <Link className="dashboard-course-card" href="/reviews" key={course.id}>
                        <span className={index === 1 ? "dashboard-course-chip green" : "dashboard-course-chip"}>{courseTags[index]}</span>
                        <strong>{course.courseName}</strong>
                        <p className="dashboard-rating"><span aria-hidden="true">★</span> {course.reviewAverage.toFixed(1)}</p>
                        <p>{courseNotes[index]}</p>
                        <small>{course.requiredType === "required" ? "전공 필수" : "교양 만족도 높음"}</small>
                        <div className="dashboard-avatars" aria-label="추천 학생 수">
                          <i />
                          <i />
                          <i />
                          <i />
                          <b>+{[32, 18, 27][index]}</b>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="dashboard-course-pager" aria-hidden="true">
                    <button type="button"><DashboardIcon name="chevron" /></button>
                    <span className="active" />
                    <span />
                    <span />
                    <span />
                    <button type="button"><DashboardIcon name="chevron" /></button>
                  </div>
                </article>

                <article className="dashboard-card">
                  <div className="dashboard-card-title">
                    <div>
                      <DashboardIcon name="chat" />
                      <h2>최근 게시글</h2>
                    </div>
                    <Link href="/board">전체 보기</Link>
                  </div>
                  <div className="dashboard-post-list">
                    {recentPosts.map((post) => (
                      <Link className="dashboard-post-item" href={`/board/${post.id}`} key={post.id}>
                        <span className={`dashboard-post-chip ${post.category}`}>{categoryLabels[post.category]}</span>
                        <div>
                          <strong>{post.title}</strong>
                          <p>댓글 {post.comments.length} · 조회 {post.viewCount} · {formatRelativePostTime(post.createdAt, now)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </article>

                <article className="dashboard-card dashboard-quick-card">
                  <div className="dashboard-quick-title">
                    <DashboardIcon name="bolt" />
                    <h2>바로가기</h2>
                    <p>자주 사용하는 기능을 빠르게 이용해보세요.</p>
                  </div>
                  <div className="dashboard-quick-list">
                    <Link href="/timetable"><DashboardIcon name="calendar" /><span>시간표</span></Link>
                    <Link href="/map"><DashboardIcon name="map" /><span>캠퍼스 지도</span></Link>
                    <Link href="/reviews"><DashboardIcon name="star" /><span>강의평</span></Link>
                    <Link href="/board"><DashboardIcon name="chat" /><span>게시판</span></Link>
                    <Link href="/must-read"><DashboardIcon name="book" /><span>새내기 필독</span></Link>
                  </div>
                </article>
              </section>
            </section>
          </main>
  );
}
