"use client";

import { useEffect, useMemo, useState } from "react";
import type { Notice } from "@/lib/types";

const categoryLabels: Record<Notice["category"], string> = {
  academic: "학사",
  scholarship: "장학",
  registration: "수강신청",
  event: "행사",
  career: "취업/진로",
  general: "일반"
};

export default function NoticesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Notice["category"] | "all">("all");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadNotices() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/notices");

        if (!response.ok) {
          throw new Error("request failed");
        }

        const data = await response.json() as { notices: Notice[] };
        if (!ignore) {
          setNotices(data.notices);
        }
      } catch {
        if (!ignore) {
          setError("공지사항을 불러오지 못했습니다.");
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
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return notices
      .filter((notice) => category === "all" || notice.category === category)
      .filter((notice) => !normalized || `${notice.title} ${notice.summary}`.toLowerCase().includes(normalized))
      .sort((a, b) => (
        Number(b.isPinned) - Number(a.isPinned) ||
        Number(Boolean(a.isExpired)) - Number(Boolean(b.isExpired)) ||
        Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      ));
  }, [category, notices, query]);

  const pinned = filtered.filter((notice) => notice.isPinned);
  const regular = filtered.filter((notice) => !notice.isPinned);

  return (
    <main className="page">
      <section className="page-header">
        <h1>공지사항</h1>
        <p>학사, 장학, 수강신청, 행사 공지를 최신순으로 확인하고 중요한 공지는 상단에서 바로 볼 수 있습니다.</p>
      </section>

      <section className="panel">
        <div className="form">
          <input
            className="search"
            placeholder="공지 제목 또는 요약 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="tabs">
            <button className={category === "all" ? "tab active" : "tab"} type="button" onClick={() => setCategory("all")}>전체</button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                className={category === key ? "tab active" : "tab"}
                key={key}
                type="button"
                onClick={() => setCategory(key as Notice["category"])}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? <section className="success" style={{ marginTop: 16 }}>학과 공지사항에서 대회 관련 공지를 불러오는 중입니다.</section> : null}
      {error ? <section className="error" style={{ marginTop: 16 }}>{error}</section> : null}

      <section className="grid two" style={{ marginTop: 16 }}>
        <article className="panel">
          <div className="section-title">
            <h2>중요 공지</h2>
            <span className="badge">{pinned.length}개</span>
          </div>
          <NoticeList notices={pinned} empty="고정된 공지사항이 없습니다." />
        </article>
        <article className="panel">
          <div className="section-title">
            <h2>공지 목록</h2>
            <span className="badge">{regular.length}개</span>
          </div>
          <NoticeList notices={regular} empty="등록된 공지사항이 없습니다." />
        </article>
      </section>
    </main>
  );
}

function NoticeList({ notices: items, empty }: { notices: Notice[]; empty: string }) {
  if (items.length === 0) {
    return <div className="list-item">{empty}</div>;
  }

  return (
    <div className="list">
      {items.map((notice) => (
        <article className={getNoticeClassName(notice)} key={notice.id}>
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
            <div className="meta">
              <span className="badge">{categoryLabels[notice.category]}</span>
              <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(notice.publishedAt))}</span>
            </div>
            <strong>{notice.title}</strong>
            <span className="muted">{notice.summary}</span>
            {notice.applicationDeadline ? (
              <span className="notice-deadline">
                신청 마감 {new Intl.DateTimeFormat("ko-KR").format(new Date(notice.applicationDeadline))}
              </span>
            ) : null}
            {notice.isExpired ? (
              <span className="closed-badge">신청기간 마감</span>
            ) : notice.applicationUrl ? (
              <a className="button" href={notice.applicationUrl} target="_blank" rel="noreferrer">신청 링크</a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function getNoticeClassName(notice: Notice) {
  return [
    "list-item",
    "notice-item",
    notice.imageUrl ? "with-image" : "",
    notice.isExpired ? "expired" : ""
  ].filter(Boolean).join(" ");
}
