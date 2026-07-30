"use client";

import { useEffect, useMemo, useState } from "react";
import { sungshinDepartments } from "@/lib/sungshin-departments";
import type { Notice } from "@/lib/types";

type DepartmentNoticeCategory = "curriculum" | "graduation" | "campus" | "event";
type NoticeCategoryFilter = Notice["category"] | DepartmentNoticeCategory | "all";
type NoticeSortOrder = "latest" | "oldest";

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

export default function NoticesPage() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [category, setCategory] = useState<NoticeCategoryFilter>("all");
  const [sortOrder, setSortOrder] = useState<NoticeSortOrder>("latest");
  const [currentPage, setCurrentPage] = useState(1);
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
          setNotices(department === "all" ? mergeOfficialNotices(data.notices) : data.notices);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [category, department, query, sortOrder]);

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
  const totalPages = Math.max(1, Math.ceil(regular.length / noticesPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedRegular = regular.slice(
    (activePage - 1) * noticesPerPage,
    activePage * noticesPerPage
  );
  const paginationItems = getPaginationItems(activePage, totalPages);

  return (
    <main className="notices-page">
      <section className="notices-hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>공지사항</h1>
            <p>학교의 중요한 소식과 안내사항을 확인하세요!</p>
            <div className="hero-tags" aria-hidden="true">
              <span>▣ 학사 일정</span>
              <span>▤ 수강신청</span>
              <span>◇ 장학</span>
              <span>◆ 행사</span>
              <span>■ 취업/진로</span>
              <span>● 기타 안내</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <img
              className="megaphone-image"
              src="/images/notices/ChatGPT%20Image%202026%E1%84%82%E1%85%A7%E1%86%AB%207%E1%84%8B%E1%85%AF%E1%86%AF%2030%E1%84%8B%E1%85%B5%E1%86%AF%20%E1%84%8B%E1%85%A9%E1%84%8C%E1%85%A5%E1%86%AB%2010_32_09.png"
              alt=""
            />
          </div>
        </div>
      </section>

      <div className="notices-content">
        <div className="notices-main-column">
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
        <NoticeList notices={pinned} empty="고정된 공지사항이 없습니다." featured />
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
                <span aria-hidden="true">▦</span>
                <strong>학사일정</strong>
              </a>
              <a
                className="shortcut-card"
                href="https://everytime.kr/369374/v/400108251"
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true">▤</span>
                <strong>수강신청 가이드</strong>
              </a>
              <a
                className="shortcut-card"
                href="https://www.sungshin.ac.kr/main_kor/14211/subview.do"
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true">▣</span>
                <strong>학생증 발급 안내</strong>
              </a>
              <a
                className="shortcut-card"
                href="https://www.sungshin.ac.kr/dormitory/index..do"
                target="_blank"
                rel="noreferrer"
              >
                <span aria-hidden="true">▥</span>
                <strong>기숙사 안내</strong>
              </a>
            </div>
          </section>

          <section className="sidebar-panel frequent-panel">
            <h2>자주 찾는 안내</h2>
            <div className="frequent-list">
              <div>수강신청 방법 <span aria-hidden="true">›</span></div>
              <div>학번 조회 방법 <span aria-hidden="true">›</span></div>
              <div>포털 시스템 이용 안내 <span aria-hidden="true">›</span></div>
              <div>증명서 발급 안내 <span aria-hidden="true">›</span></div>
              <div>등록금 납부 안내 <span aria-hidden="true">›</span></div>
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

      <div className="notice-footnote">
        <span aria-hidden="true">●</span>
        공지 내용은 변경될 수 있으니 수시로 확인해주세요!
      </div>

      <style jsx>{`
        .notices-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 56px 24px 80px;
          font-family: Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
          font-family: Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
          background:
            radial-gradient(circle at 91% 43%, rgba(169, 111, 255, 0.2) 0 24px, transparent 25px),
            radial-gradient(circle at 68% 58%, rgba(185, 145, 255, 0.16) 0 35px, transparent 36px),
            linear-gradient(105deg, #fbf8ff 0%, #f6efff 57%, #eee2ff 100%);
        }

        .hero-inner {
          position: relative;
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

        .hero-tags span {
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

        .hero-tags span::first-letter {
          color: #6325c3;
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
          object-fit: cover;
          object-position: center;
          mix-blend-mode: multiply;
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
          font-family: Pretendard, "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

        .shortcut-card > span {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          color: #5f24bc;
          font-size: 30px;
          line-height: 1;
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

        .frequent-list div {
          display: flex;
          min-height: 35px;
          align-items: center;
          justify-content: space-between;
          color: #514859;
          font-size: 12px;
          font-weight: 700;
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
            min-height: 210px;
            padding: 28px 20px;
          }

          .hero-art {
            position: absolute;
            top: 0;
            right: -52px;
            opacity: 0.4;
          }

          .notices-hero p {
            max-width: calc(100% - 55px);
            font-size: 14px;
          }

          .hero-tags {
            max-width: calc(100% - 70px);
          }

          .hero-tags span {
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
  numberDirection = "descending"
}: {
  notices: Notice[];
  empty: string;
  featured?: boolean;
  startNumber?: number;
  numberDirection?: "ascending" | "descending";
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
            </div>
            <span className="notice-summary">{notice.summary}</span>
            {notice.applicationDeadline ? (
              <span className="notice-deadline">신청 마감 {formatNoticeDate(notice.applicationDeadline)}</span>
            ) : null}
            <div className="notice-actions">
              {notice.isExpired ? (
                <span className="closed-badge">신청기간 마감</span>
              ) : notice.applicationUrl ? (
                <a href={notice.applicationUrl} target="_blank" rel="noreferrer">신청 링크</a>
              ) : null}
              {notice.sourceUrl ? (
                <a href={notice.sourceUrl} target="_blank" rel="noreferrer">원문 보기</a>
              ) : null}
            </div>
          </div>
          <time dateTime={notice.publishedAt}>{formatNoticeDate(notice.publishedAt)}</time>
          <span className="row-arrow" aria-hidden="true">›</span>
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
          color: #6f6877;
          font-size: 27px;
          font-weight: 300;
          text-align: right;
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
