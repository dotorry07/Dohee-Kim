"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { courseReviews, courses, notices, posts, timetables } from "@/lib/data";
import { dayLabels, getTodayClasses } from "@/lib/timetable";

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getTodayProgress(classes: ReturnType<typeof getTodayClasses>, now = new Date()) {
  if (classes.length === 0) {
    return 0;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const completed = classes.filter((item) => toMinutes(item.endTime) <= nowMinutes).length;
  const active = classes.find((item) => toMinutes(item.startTime) <= nowMinutes && nowMinutes < toMinutes(item.endTime));

  if (!active) {
    return Math.round((completed / classes.length) * 100);
  }

  const elapsed = nowMinutes - toMinutes(active.startTime);
  const duration = toMinutes(active.endTime) - toMinutes(active.startTime);

  return Math.min(100, Math.round(((completed + elapsed / duration) / classes.length) * 100));
}

const categoryLabels = {
  freshman: "새내기",
  free: "자유",
  department: "학과",
  info: "정보"
} as const;

const noticeLabels = {
  academic: "학사",
  scholarship: "장학",
  registration: "수강",
  event: "행사",
  career: "진로",
  general: "일반"
} as const;

const accentStyles = [
  "from-[#582f82] to-[#8b5fbf]",
  "from-[#0f766e] to-[#2dd4bf]",
  "from-[#a3472b] to-[#e8a85c]",
  "from-[#365f91] to-[#82a7d8]",
  "from-[#6f3a70] to-[#d8bd5f]",
  "from-[#3f6f46] to-[#a7c957]"
];

export default function DashboardPage() {
  const [carouselIndex, setCarouselIndex] = useState(0);

  return (
    <AuthGuard>
      {(user) => {
        const now = new Date();
        const selected = timetables.find((item) => item.userId === user.id && item.isSelected);
        const todayClasses = selected ? getTodayClasses(selected.classes) : [];
        const todayProgress = getTodayProgress(todayClasses, now);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const nextClass = todayClasses.find((item) => toMinutes(item.endTime) > nowMinutes);
        const completedClasses = todayClasses.filter((item) => toMinutes(item.endTime) <= nowMinutes).length;
        const recommendedCourses = [...courses].sort((a, b) => b.reviewAverage - a.reviewAverage).slice(0, 6);
        const pinnedNotices = notices.filter((notice) => notice.isPinned).slice(0, 3);
        const averageRating = courseReviews.length
          ? courseReviews.reduce((sum, review) => sum + review.rating, 0) / courseReviews.length
          : 0;
        const today = new Intl.DateTimeFormat("ko-KR", {
          dateStyle: "full"
        }).format(now);

        const carouselCourse = recommendedCourses[carouselIndex] ?? recommendedCourses[0];

        const showPreviousCourse = () => {
          setCarouselIndex((current) => (current === 0 ? recommendedCourses.length - 1 : current - 1));
        };

        const showNextCourse = () => {
          setCarouselIndex((current) => (current === recommendedCourses.length - 1 ? 0 : current + 1));
        };

        return (
          <main className="min-h-[calc(100vh-65px)] bg-[linear-gradient(180deg,#fffdf8_0%,#faf9f6_42%,#f3f6fb_100%)]">
            <section className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10 lg:py-20">
              <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-normal text-[#0f766e]">Student Dashboard</p>
                  <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-normal text-ink sm:text-5xl">
                    {user.nickname}님, 오늘의 수업과 캠퍼스 소식을 정리했어요.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#706477]">
                    {today} · {user.department} {user.grade}학년
                  </p>
                </div>
                <div className="rounded-lg border border-[#e7dfeb] bg-white px-6 py-5 shadow-dashboard">
                  <p className="text-sm font-black text-[#706477]">대표 시간표</p>
                  <strong className="mt-2 block text-xl font-black text-ink">{selected?.title ?? "선택된 시간표 없음"}</strong>
                  <span className="mt-2 block text-sm font-bold text-[#8a7d91]">
                    {selected ? `${selected.semester} · 추천 점수 ${selected.score.toFixed(2)}` : "시간표를 생성해 주세요."}
                  </span>
                </div>
              </div>

              <section className="grid gap-7 xl:grid-cols-12">
                <article className="rounded-lg border border-[#e7dfeb] bg-white p-7 shadow-dashboard xl:col-span-8">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#e9f7f4] px-3 py-1 text-xs font-black text-[#0f766e]">오늘의 수업</span>
                        <span className="text-sm font-bold text-[#8a7d91]">
                          {completedClasses}/{todayClasses.length} 완료
                        </span>
                      </div>
                      <h2 className="mt-5 text-3xl font-black tracking-normal text-ink">수업 진행률 {todayProgress}%</h2>
                      <div className="mt-6 h-4 overflow-hidden rounded-full bg-[#edf1f4]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0f766e] via-[#8b5fbf] to-[#d8bd5f] transition-all duration-500"
                          style={{ width: `${todayProgress}%` }}
                        />
                      </div>
                      <p className="mt-5 text-base font-semibold leading-7 text-[#706477]">
                        {nextClass ? `${nextClass.courseName} · ${nextClass.startTime} 시작 · ${nextClass.buildingName} ${nextClass.roomName}` : "오늘 남은 수업이 없습니다."}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#23182d] p-6 text-white">
                      <p className="text-sm font-black text-[#d8bd5f]">NEXT</p>
                      <strong className="mt-3 block text-2xl font-black">{nextClass?.courseName ?? "자유 시간"}</strong>
                      <span className="mt-3 block text-sm font-semibold leading-6 text-white/70">
                        {nextClass ? `${dayLabels[nextClass.dayOfWeek]} ${nextClass.startTime}-${nextClass.endTime}` : "게시판과 공지를 확인하기 좋은 시간입니다."}
                      </span>
                      <Link className="mt-6 inline-flex rounded-lg bg-white px-4 py-3 text-sm font-black text-ink" href="/timetable">
                        시간표 보기
                      </Link>
                    </div>
                  </div>
                </article>

                <article className="rounded-lg border border-[#e7dfeb] bg-white p-7 shadow-dashboard xl:col-span-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#365f91]">오늘 수업</p>
                      <h2 className="mt-1 text-2xl font-black text-ink">강의 일정</h2>
                    </div>
                    <Link href="/timetable" className="rounded-lg bg-[#eef3f8] px-3 py-2 text-sm font-black text-[#365f91]">
                      전체
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-4">
                    {todayClasses.length > 0 ? (
                      todayClasses.map((item) => (
                        <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-4" key={item.id}>
                          <div className="rounded-lg bg-[#f4f0f7] px-3 py-3 text-center">
                            <strong className="block text-sm font-black text-plum">{item.startTime}</strong>
                            <span className="mt-1 block text-xs font-bold text-[#8a7d91]">{item.endTime}</span>
                          </div>
                          <div className="min-w-0 border-b border-[#eee7f2] pb-4">
                            <strong className="block truncate text-base font-black text-ink">{item.courseName}</strong>
                            <span className="mt-1 block text-sm font-semibold text-[#706477]">
                              {item.buildingName} {item.roomName} · {item.professorName}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-[#cfc3d8] bg-[#fcfbfd] p-5">
                        <strong className="block text-base font-black text-ink">시간표가 필요해요</strong>
                        <span className="mt-2 block text-sm font-semibold leading-6 text-[#706477]">대표 시간표를 선택하면 오늘 일정이 표시됩니다.</span>
                      </div>
                    )}
                  </div>
                </article>

                <article className="rounded-lg border border-[#e7dfeb] bg-white p-7 shadow-dashboard xl:col-span-6">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#a3472b]">추천 강의</p>
                      <h2 className="mt-1 text-2xl font-black text-ink">강의평 기반 추천</h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-lg border border-[#e7dfeb] bg-white text-lg font-black text-ink shadow-sm"
                        onClick={showPreviousCourse}
                        aria-label="이전 추천 강의"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="grid h-10 w-10 place-items-center rounded-lg border border-[#e7dfeb] bg-white text-lg font-black text-ink shadow-sm"
                        onClick={showNextCourse}
                        aria-label="다음 추천 강의"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                  {carouselCourse ? (
                    <div className="overflow-hidden rounded-lg border border-[#f0e8ed] bg-[#fffaf7]">
                      <div className={`bg-gradient-to-r ${accentStyles[carouselIndex]} p-6 text-white`}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black ring-1 ring-white/25">TOP {carouselIndex + 1}</span>
                          <span className="text-3xl font-black">{carouselCourse.reviewAverage.toFixed(1)}</span>
                        </div>
                        <h3 className="mt-8 text-3xl font-black tracking-normal">{carouselCourse.courseName}</h3>
                        <p className="mt-3 text-sm font-semibold text-white/80">{carouselCourse.professorName} · {carouselCourse.department}</p>
                      </div>
                      <div className="grid gap-3 p-6 sm:grid-cols-3">
                        <div>
                          <span className="text-xs font-black text-[#8a7d91]">요일</span>
                          <strong className="mt-1 block text-base font-black text-ink">{dayLabels[carouselCourse.dayOfWeek]}</strong>
                        </div>
                        <div>
                          <span className="text-xs font-black text-[#8a7d91]">시간</span>
                          <strong className="mt-1 block text-base font-black text-ink">{carouselCourse.startTime}</strong>
                        </div>
                        <div>
                          <span className="text-xs font-black text-[#8a7d91]">강의실</span>
                          <strong className="mt-1 block text-base font-black text-ink">{carouselCourse.buildingName}</strong>
                        </div>
                      </div>
                      <div className="flex justify-center gap-2 px-6 pb-6">
                        {recommendedCourses.map((course, index) => (
                          <button
                            type="button"
                            className={`h-2.5 rounded-full transition-all ${index === carouselIndex ? "w-8 bg-plum" : "w-2.5 bg-[#d8cfdf]"}`}
                            key={course.id}
                            onClick={() => setCarouselIndex(index)}
                            aria-label={`${index + 1}번째 추천 강의 보기`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>

                <article className="rounded-lg border border-[#e7dfeb] bg-white p-7 shadow-dashboard xl:col-span-6">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-plum">최근 게시글</p>
                      <h2 className="mt-1 text-2xl font-black text-ink">커뮤니티</h2>
                    </div>
                    <Link href="/board" className="rounded-lg bg-[#f1edf5] px-3 py-2 text-sm font-black text-plum">
                      게시판
                    </Link>
                  </div>
                  <div className="divide-y divide-[#eee7f2]">
                    {posts.slice(0, 5).map((post) => (
                      <Link href={`/board/${post.id}`} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center" key={post.id}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#f6f0f8] px-2.5 py-1 text-xs font-black text-plum">{categoryLabels[post.category]}</span>
                            <span className="text-xs font-bold text-[#8a7d91]">{post.authorName}</span>
                          </div>
                          <strong className="mt-2 block truncate text-base font-black text-ink">{post.title}</strong>
                        </div>
                        <span className="text-sm font-bold text-[#8a7d91]">댓글 {post.comments.length} · 조회 {post.viewCount}</span>
                      </Link>
                    ))}
                  </div>
                </article>

                <article className="rounded-lg border border-[#e7dfeb] bg-white p-7 shadow-dashboard xl:col-span-4">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#3f6f46]">중요 공지</p>
                      <h2 className="mt-1 text-2xl font-black text-ink">학교 알림</h2>
                    </div>
                    <Link href="/notices" className="rounded-lg bg-[#eef7ef] px-3 py-2 text-sm font-black text-[#3f6f46]">
                      공지
                    </Link>
                  </div>
                  <div className="grid gap-4">
                    {pinnedNotices.map((notice) => (
                      <Link className="block border-b border-[#eee7f2] pb-4 last:border-b-0 last:pb-0" href="/notices" key={notice.id}>
                        <span className="rounded-full bg-[#eef7ef] px-2.5 py-1 text-xs font-black text-[#3f6f46]">{noticeLabels[notice.category]}</span>
                        <strong className="mt-3 block line-clamp-1 text-base font-black text-ink">{notice.title}</strong>
                        <span className="mt-1 block line-clamp-2 text-sm font-semibold leading-6 text-[#706477]">{notice.summary}</span>
                      </Link>
                    ))}
                  </div>
                </article>

                <article className="rounded-lg border border-[#e7dfeb] bg-white p-7 shadow-dashboard xl:col-span-4">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#6f3a70]">강의평</p>
                      <h2 className="mt-1 text-2xl font-black text-ink">평점 요약</h2>
                    </div>
                    <span className="rounded-lg bg-[#fff5df] px-3 py-2 text-sm font-black text-[#8a5b00]">평균 {averageRating.toFixed(1)}</span>
                  </div>
                  <div className="grid gap-4">
                    {courseReviews.slice(0, 3).map((review) => (
                      <Link className="block border-b border-[#eee7f2] pb-4 last:border-b-0 last:pb-0" href="/reviews" key={review.id}>
                        <div className="flex items-center justify-between gap-3">
                          <strong className="truncate text-base font-black text-ink">{review.courseName}</strong>
                          <span className="shrink-0 text-sm font-black text-[#8a5b00]">{review.rating.toFixed(1)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#706477]">{review.content}</p>
                      </Link>
                    ))}
                  </div>
                </article>

                <article className="rounded-lg border border-[#e7dfeb] bg-[#23182d] p-7 text-white shadow-dashboard xl:col-span-4">
                  <p className="text-sm font-black text-[#d8bd5f]">바로가기</p>
                  <h2 className="mt-1 text-2xl font-black">새내기 필수 메뉴</h2>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <Link className="rounded-lg bg-white/10 px-4 py-4 text-center text-sm font-black ring-1 ring-white/15" href="/map">
                      캠퍼스 지도
                    </Link>
                    <Link className="rounded-lg bg-white/10 px-4 py-4 text-center text-sm font-black ring-1 ring-white/15" href="/must-read">
                      필독 정보
                    </Link>
                    <Link className="rounded-lg bg-white/10 px-4 py-4 text-center text-sm font-black ring-1 ring-white/15" href="/notices">
                      공지 확인
                    </Link>
                    <Link className="rounded-lg bg-white/10 px-4 py-4 text-center text-sm font-black ring-1 ring-white/15" href="/reviews">
                      강의평 검색
                    </Link>
                  </div>
                </article>
              </section>
            </section>
          </main>
        );
      }}
    </AuthGuard>
  );
}
