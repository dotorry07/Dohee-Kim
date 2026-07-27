"use client";

import { useEffect, useMemo, useState } from "react";
import { sungshinDepartments } from "@/lib/sungshin-departments";
import type { Notice } from "@/lib/types";

type DepartmentNoticeCategory = "curriculum" | "graduation" | "campus" | "event";
type NoticeCategoryFilter = Notice["category"] | DepartmentNoticeCategory | "all";

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

export default function NoticesPage() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [category, setCategory] = useState<NoticeCategoryFilter>("all");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [category, department, query]);

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
        Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      ));
  }, [category, department, notices, query]);

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

  return (
    <main className="page">
      <section className="page-header">
        <h1>공지사항</h1>
        <p>학사, 장학, 수강신청, 행사 공지를 최신순으로 확인하고 중요한 공지는 상단에서 바로 볼 수 있습니다.</p>
      </section>

      <section className="panel">
        <div className="form">
          <div className="notice-search-controls">
            <div
              className="department-combobox"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDepartmentOpen(false);
                }
              }}
            >
              <button
                aria-expanded={isDepartmentOpen}
                aria-haspopup="listbox"
                className="department-select-block"
                role="combobox"
                type="button"
                onClick={() => setIsDepartmentOpen((current) => !current)}
              >
                <span>{selectedDepartmentLabel}</span>
                <span aria-hidden="true">v</span>
              </button>
              {isDepartmentOpen ? (
                <div className="search-dropdown department-options" role="listbox">
                  {departmentOptions.map((departmentName) => (
                    <button
                      aria-selected={department === (departmentName === "전체" ? "all" : departmentName)}
                      className={(
                        department === (departmentName === "전체" ? "all" : departmentName)
                          ? "department-option-block active"
                          : "department-option-block"
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
            <input
              className="search"
              placeholder="공지 제목 또는 요약 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="tabs">
            <button className={category === "all" ? "tab active" : "tab"} type="button" onClick={() => setCategory("all")}>전체</button>
            {Object.entries(activeCategoryLabels).map(([key, label]) => (
              <button
                className={category === key ? "tab active" : "tab"}
                key={key}
                type="button"
                onClick={() => setCategory(key as NoticeCategoryFilter)}
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
              <span className="badge">{getNoticeBadgeLabel(notice)}</span>
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
            {notice.sourceUrl ? (
              <a className="ghost-button" href={notice.sourceUrl} target="_blank" rel="noreferrer">원문 보기</a>
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

function getDepartmentNoticeCategory(notice: Notice): DepartmentNoticeCategory {
  const text = `${notice.title} ${notice.summary}`.toLowerCase();

  if (/(졸업|학위|논문|캡스톤|인증|이수인증)/.test(text)) {
    return "graduation";
  }

  if (/(교육과정|교과|전공|수강|이수|교직|강의|수업|커리큘럼)/.test(text)) {
    return "curriculum";
  }

  if (/(행사|특강|세미나|설명회|대회|공모|공모전|경진|박람회|워크숍|워크샵)/.test(text)) {
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
