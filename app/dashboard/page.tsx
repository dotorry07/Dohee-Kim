"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { notices, posts, timetables } from "@/lib/data";
import { getTodayClasses } from "@/lib/timetable";

const categoryLabels = {
  freshman: "새내기 Q&A",
  free: "자유게시판",
  department: "학과",
  info: "정보 공유"
} as const;

const categoryColors = {
  freshman: "bg-[#F0EBFF] text-[#6842DB]",
  free: "bg-[#FFF0EE] text-[#F05C4F]",
  department: "bg-[#EAF8F1] text-[#24966C]",
  info: "bg-[#EEF2FF] text-[#5266D8]"
} as const;

const noticeLabels = {
  academic: "학사",
  scholarship: "장학",
  registration: "수강",
  event: "행사",
  career: "진로",
  general: "일반"
} as const;

const noticeColors = {
  academic: "bg-[#EAF8F1] text-[#248660]",
  scholarship: "bg-[#FFF7E4] text-[#A96D00]",
  registration: "bg-[#F0EBFF] text-[#6842DB]",
  event: "bg-[#FFF0EE] text-[#E85649]",
  career: "bg-[#EEF2FF] text-[#5266D8]",
  general: "bg-[#F2F3F5] text-[#606775]"
} as const;

type IconName = "calendar" | "megaphone" | "user" | "chat" | "map" | "star" | "book" | "bolt" | "clock" | "arrow";

function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    calendar: (
      <>
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        <path d="M8 13h2M14 13h2M8 17h2M14 17h2" />
      </>
    ),
    megaphone: (
      <>
        <path d="m4 13 3 1 9 4V6l-9 4-3 1v2Z" />
        <path d="m7 14 1 5h3l-1-4M19 8a5 5 0 0 1 0 8" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    chat: (
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 21l1.7-4.2A8.1 8.1 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    book: (
      <>
        <path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2V5ZM20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2V5Z" />
      </>
    ),
    bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    arrow: <path d="m9 5 7 7-7 7" />
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Card({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={`rounded-[20px] border border-[#EAE6F2] bg-white shadow-[0_10px_30px_rgba(52,35,92,0.07)] ${className}`}>{children}</article>;
}

function CardTitle({
  icon,
  children,
  href
}: {
  icon: IconName;
  children: ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon name={icon} className="h-6 w-6 text-[#6842DB]" />
        <h2 className="text-xl font-extrabold tracking-[-0.03em] text-[#191525]">{children}</h2>
      </div>
      {href ? (
        <Link className="text-sm font-bold text-[#6842DB] transition hover:text-[#4F2EBE]" href={href}>
          전체 보기
        </Link>
      ) : null}
    </div>
  );
}

function getMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getRelativeTime(value: string, now: Date) {
  const diff = Math.max(0, now.getTime() - new Date(value).getTime());
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function getDDay(date: Date, now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.ceil((target - start) / 86_400_000);
  if (days === 0) return "D-DAY";
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      {(user) => {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const selected = timetables.find((item) => item.userId === user.id && item.isSelected);
        const todayClasses = selected ? getTodayClasses(selected.classes) : [];
        const nextClass = todayClasses.find((item) => getMinutes(item.startTime) > nowMinutes);
        const currentOrNext = todayClasses.find((item) => getMinutes(item.endTime) > nowMinutes);
        const minutesUntilNext = nextClass ? getMinutes(nextClass.startTime) - nowMinutes : null;
        const importantNotices = [...notices]
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
          .slice(0, 2);
        const recentPosts = posts.slice(0, 5);
        const displayName = user.nickname && !user.nickname.includes("?") ? user.nickname : "새내기";
        const department = user.department && !user.department.includes("?") ? user.department : "미디어커뮤니케이션학과";
        const studentNumber = user.id.replace(/\D/g, "").slice(-8) || "2026******";
        const formattedDate = new Intl.DateTimeFormat("ko-KR", {
          month: "long",
          day: "numeric",
          weekday: "short"
        }).format(now);

        const schedules = [
          { title: "수강신청 시작", date: new Date(2026, 7, 3, 9), range: "2026.08.03 (월) 09:00" },
          { title: "개강", date: new Date(2026, 7, 31), range: "2026.08.31 (월)" },
          { title: "중간고사", date: new Date(2026, 9, 19), range: "2026.10.19 (월) ~ 10.23 (금)" },
          { title: "기말고사", date: new Date(2026, 11, 14), range: "2026.12.14 (월) ~ 12.18 (금)" }
        ];

        const quickLinks = [
          { label: "시간표", href: "/timetable", icon: "calendar" as const },
          { label: "캠퍼스 지도", href: "/map", icon: "map" as const },
          { label: "강의평", href: "/reviews", icon: "star" as const },
          { label: "게시판", href: "/board", icon: "chat" as const },
          { label: "새내기 필독", href: "/must-read", icon: "book" as const }
        ];

        return (
          <main className="min-h-[calc(100vh-65px)] bg-[radial-gradient(circle_at_50%_0%,#F2ECFF_0%,#FAF9FD_34%,#F8F8FB_100%)] text-[#191525]">
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
              <section className="grid min-h-[235px] items-center gap-5 overflow-hidden rounded-[28px] border border-white/70 bg-white/45 px-6 py-7 shadow-[0_16px_45px_rgba(93,63,155,0.08)] backdrop-blur-sm md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_390px_340px] lg:px-9">
                <div className="relative z-10">
                  <p className="mb-3 text-sm font-bold text-[#7C5CFC]">NEWBIE ON DASHBOARD</p>
                  <h1 className="text-3xl font-black tracking-[-0.045em] text-[#191525] sm:text-4xl">
                    안녕하세요, {displayName}님! <span aria-hidden="true">👋</span>
                  </h1>
                  <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-[#777087] sm:text-base">
                    오늘도 즐거운 하루 되세요. 필요한 정보를 한눈에 확인해보세요.
                  </p>
                </div>

                <div className="relative mx-auto hidden h-[220px] w-full max-w-[390px] lg:block">
                  <Image
                    src="/images/dashboard-calendar-3d.png"
                    alt="보라색 캘린더와 시계 3D 일러스트"
                    fill
                    priority
                    sizes="390px"
                    className="object-contain mix-blend-multiply"
                  />
                </div>

                <Card className="relative z-10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F0EBFF] text-[#6842DB]">
                      <Icon name="calendar" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#656071]">오늘은</p>
                      <strong className="mt-1 block text-2xl font-black tracking-[-0.04em]">{formattedDate}</strong>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#EEEAF4] pt-4 text-sm font-semibold text-[#777087]">
                    <span>오늘 수업 <b className="text-[#2D2638]">{todayClasses.length}개</b></span>
                    <span className="text-[#C9C1D5]">•</span>
                    <span>
                      {minutesUntilNext !== null ? (
                        <>다음 수업까지 <b className="text-[#6842DB]">{minutesUntilNext}분</b></>
                      ) : (
                        <b className="text-[#6842DB]">오늘 수업 완료</b>
                      )}
                    </span>
                  </div>
                </Card>
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card className="p-6 sm:p-7">
                  <CardTitle icon="calendar" href="/timetable">오늘 수업</CardTitle>
                  <div className="mt-6">
                    {currentOrNext ? (
                      <div className="grid gap-4 sm:grid-cols-[105px_1fr]">
                        <div className="flex min-h-[138px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C5CFC] to-[#5734CA] px-3 text-center text-white shadow-[0_12px_22px_rgba(124,92,252,0.24)]">
                          <strong className="text-lg">{todayClasses.indexOf(currentOrNext) + 1}교시</strong>
                          <span className="mt-2 text-sm font-semibold leading-6">{currentOrNext.startTime}<br />~<br />{currentOrNext.endTime}</span>
                        </div>
                        <div className="rounded-2xl border border-[#EAE6F2] bg-[#FCFBFE] p-5">
                          <strong className="text-xl font-extrabold">{currentOrNext.courseName}</strong>
                          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#777087]">
                            <span className="text-[#7C5CFC]">●</span>
                            {currentOrNext.buildingName} {currentOrNext.roomName}
                          </p>
                          <span className="mt-4 inline-flex rounded-lg bg-[#EEE8FB] px-3 py-1.5 text-xs font-bold text-[#6040BF]">
                            {currentOrNext.professorName} 교수
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#D9D0E8] bg-[#FCFBFE] p-8 text-center">
                        <strong className="block text-lg">오늘 예정된 수업이 없어요</strong>
                        <p className="mt-2 text-sm text-[#777087]">시간표에서 대표 시간표를 설정해보세요.</p>
                      </div>
                    )}

                    {nextClass ? (
                      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#EAE6F2] px-5 py-4">
                        <span className="shrink-0 text-sm font-bold text-[#777087]">다음 수업</span>
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate">{nextClass.courseName}</strong>
                          <span className="mt-1 block text-xs font-semibold text-[#8A8396]">
                            {nextClass.startTime} - {nextClass.endTime} · {nextClass.buildingName} {nextClass.roomName}
                          </span>
                        </div>
                        <Icon name="arrow" className="h-5 w-5 text-[#8B8298]" />
                      </div>
                    ) : null}
                  </div>
                </Card>

                <Card className="p-6 sm:p-7">
                  <CardTitle icon="megaphone" href="/notices">중요 공지</CardTitle>
                  <div className="mt-6 grid gap-3">
                    {importantNotices.map((notice) => (
                      <Link key={notice.id} href="/notices" className="group grid gap-3 rounded-2xl border border-[#EAE6F2] p-4 transition hover:border-[#CFC0F8] hover:bg-[#FCFAFF] sm:grid-cols-[auto_1fr_auto] sm:items-center">
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${noticeColors[notice.category]}`}>
                          {noticeLabels[notice.category]}
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate text-[15px]">{notice.title}</strong>
                          <span className="mt-2 block truncate text-xs font-medium text-[#858092]">{notice.summary}</span>
                          <span className="mt-2 block text-xs font-semibold text-[#9A93A6]">
                            {new Intl.DateTimeFormat("ko-KR").format(new Date(notice.publishedAt))}
                          </span>
                        </div>
                        <Icon name="arrow" className="hidden h-5 w-5 text-[#8B8298] transition group-hover:translate-x-1 sm:block" />
                      </Link>
                    ))}
                  </div>
                </Card>
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-12">
                <Card className="p-6 lg:col-span-3">
                  <CardTitle icon="user">학생 프로필</CardTitle>
                  <div className="mt-7 flex items-center gap-4">
                    <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#F1ECFF] to-[#D8CAFF]">
                      <span className="absolute top-3 h-7 w-7 rounded-full bg-[#9B78F8]" />
                      <span className="absolute -bottom-3 h-12 w-14 rounded-[50%_50%_30%_30%] bg-[#8B67ED]" />
                    </div>
                    <div className="min-w-0">
                      <strong className="block truncate text-xl">{displayName}님</strong>
                      <span className="mt-2 inline-flex rounded-lg bg-[#F0EBFF] px-2.5 py-1 text-xs font-bold text-[#6842DB]">신입생</span>
                    </div>
                  </div>
                  <dl className="mt-7 divide-y divide-[#EEEAF4] text-sm">
                    {[
                      ["학번", studentNumber],
                      ["소속", department],
                      ["학년", `${user.grade}학년`],
                      ["이메일", user.email]
                    ].map(([label, value]) => (
                      <div className="grid grid-cols-[58px_1fr] gap-2 py-3" key={label}>
                        <dt className="font-semibold text-[#8A8396]">{label}</dt>
                        <dd className="truncate text-right font-bold text-[#36303F]" title={value}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <Link href="/auth/signup" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#F0EBFF] px-4 py-3 text-sm font-bold text-[#6842DB] transition hover:bg-[#E7DEFF]">
                    내 정보 관리 <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </Card>

                <Card className="p-6 lg:col-span-4">
                  <CardTitle icon="calendar" href="/notices">D-DAY 학사일정</CardTitle>
                  <div className="mt-6 grid gap-3">
                    {schedules.map((schedule) => (
                      <div className="flex items-center gap-3 rounded-2xl bg-[#F8F5FF] px-4 py-3.5" key={schedule.title}>
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#8A6BE7] shadow-sm">
                          <Icon name="calendar" className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <strong className="block text-sm text-[#6842DB]">{schedule.title}</strong>
                          <span className="mt-1 block truncate text-[11px] font-semibold text-[#8A8396]">{schedule.range}</span>
                        </div>
                        <strong className="shrink-0 text-lg text-[#5631C8]">{getDDay(schedule.date, now)}</strong>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 lg:col-span-5">
                  <CardTitle icon="chat" href="/board">최근 게시글</CardTitle>
                  <div className="mt-5 divide-y divide-[#EEEAF4]">
                    {recentPosts.map((post) => (
                      <Link className="grid gap-2 py-3.5 first:pt-0 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-4" href={`/board/${post.id}`} key={post.id}>
                        <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold ${categoryColors[post.category]}`}>
                          {categoryLabels[post.category]}
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate text-sm">{post.title}</strong>
                          <span className="mt-1.5 block text-xs font-semibold text-[#8A8396]">
                            댓글 {post.comments.length} <span className="px-1 text-[#C8C1D2]">•</span>
                            조회 {post.viewCount} <span className="px-1 text-[#C8C1D2]">•</span>
                            {getRelativeTime(post.createdAt, now)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </section>

              <Card className="mt-6 p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-3">
                    <Icon name="bolt" className="h-6 w-6 text-[#6842DB]" />
                    <h2 className="text-xl font-extrabold tracking-[-0.03em]">바로가기</h2>
                  </div>
                  <p className="text-sm font-medium text-[#858092]">자주 사용하는 기능을 빠르게 이용해보세요.</p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
                  {quickLinks.map((item) => (
                    <Link
                      className="group flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-[#E7E1F0] bg-gradient-to-b from-white to-[#FBF9FF] px-4 py-5 text-center transition hover:-translate-y-1 hover:border-[#C9B9F6] hover:shadow-[0_12px_24px_rgba(103,70,190,0.12)]"
                      href={item.href}
                      key={item.href}
                    >
                      <Icon name={item.icon} className="h-9 w-9 text-[#5B35C7] transition group-hover:scale-110" />
                      <strong className="mt-3 text-sm text-[#5E586A]">{item.label}</strong>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </main>
        );
      }}
    </AuthGuard>
  );
}
