"use client";

import { useMemo, useState } from "react";
import { notices } from "@/lib/data";
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

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return notices
      .filter((notice) => category === "all" || notice.category === category)
      .filter((notice) => !normalized || `${notice.title} ${notice.summary}`.toLowerCase().includes(normalized))
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  }, [category, query]);

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
        <article className="list-item" key={notice.id}>
          <div className="meta">
            <span className="badge">{categoryLabels[notice.category]}</span>
            <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(notice.publishedAt))}</span>
          </div>
          <strong>{notice.title}</strong>
          <span className="muted">{notice.summary}</span>
          {notice.sourceUrl ? <a className="button" href={notice.sourceUrl} target="_blank" rel="noreferrer">원문 링크</a> : null}
        </article>
      ))}
    </div>
  );
}
