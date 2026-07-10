"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { courseReviews, notices, posts, timetables } from "@/lib/data";
import { dayLabels, getTodayClasses } from "@/lib/timetable";

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(user) => {
        const selected = timetables.find((item) => item.userId === user.id && item.isSelected);
        const todayClasses = selected ? getTodayClasses(selected.classes) : [];
        const today = new Intl.DateTimeFormat("ko-KR", {
          dateStyle: "full"
        }).format(new Date());

        return (
          <main className="page">
            <section className="page-header">
              <h1>{user.nickname}님의 대시보드</h1>
              <p>{today} · {user.department} {user.grade}학년</p>
            </section>
            <section className="grid two">
              <article className="panel">
                <div className="section-title">
                  <h2>오늘 수업</h2>
                  <Link href="/timetable" className="badge">시간표</Link>
                </div>
                {selected && todayClasses.length > 0 ? (
                  <div className="list">
                    {todayClasses.map((item) => (
                      <div className="list-item" key={item.id}>
                        <strong>{item.courseName}</strong>
                        <span className="muted">
                          {dayLabels[item.dayOfWeek]} {item.startTime}-{item.endTime} · {item.buildingName} {item.roomName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="list-item">
                    <strong>시간표를 먼저 만들어보세요</strong>
                    <span className="muted">대표 시간표를 선택하면 오늘 수업이 표시됩니다.</span>
                    <Link className="button" href="/timetable">시간표 생성</Link>
                  </div>
                )}
              </article>
              <article className="panel">
                <div className="section-title">
                  <h2>상단 고정 공지</h2>
                  <Link href="/notices" className="badge">공지</Link>
                </div>
                <div className="list">
                  {notices.filter((notice) => notice.isPinned).slice(0, 3).map((notice) => (
                    <div className="list-item" key={notice.id}>
                      <strong>{notice.title}</strong>
                      <span className="muted">{notice.summary}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel">
                <div className="section-title">
                  <h2>최근 게시글</h2>
                  <Link href="/board" className="badge">게시판</Link>
                </div>
                <div className="list">
                  {posts.slice(0, 5).map((post) => (
                    <div className="list-item" key={post.id}>
                      <strong>{post.title}</strong>
                      <span className="muted">{post.authorName} · 댓글 {post.comments.length} · 조회 {post.viewCount}</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel">
                <div className="section-title">
                  <h2>최근 강의평</h2>
                  <Link href="/reviews" className="badge">강의평</Link>
                </div>
                <div className="list">
                  {courseReviews.slice(0, 5).map((review) => (
                    <div className="list-item" key={review.id}>
                      <strong>{review.courseName}</strong>
                      <span className="muted">{review.professorName} · {review.rating.toFixed(1)}점 · {review.semester}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </main>
        );
      }}
    </AuthGuard>
  );
}
