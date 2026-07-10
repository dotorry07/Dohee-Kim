"use client";

import { FormEvent, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { courseReviews as seedReviews } from "@/lib/data";
import type { CourseReview, UserProfile } from "@/lib/types";

const levelLabels: Record<CourseReview["assignmentLevel"], string> = {
  low: "적음",
  medium: "보통",
  high: "많음"
};

export default function ReviewsPage() {
  return (
    <AuthGuard>
      {(user) => <ReviewWorkspace user={user} />}
    </AuthGuard>
  );
}

function ReviewWorkspace({ user }: { user: UserProfile }) {
  const [reviews, setReviews] = useState(seedReviews);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    courseName: "",
    professorName: "",
    semester: "2026-1",
    rating: "5",
    assignmentLevel: "medium" as CourseReview["assignmentLevel"],
    examLevel: "medium" as CourseReview["examLevel"],
    attendanceType: "전자출결",
    content: ""
  });

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reviews.filter((review) => !normalized || `${review.courseName} ${review.professorName}`.toLowerCase().includes(normalized));
  }, [query, reviews]);

  const averages = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const review of filtered) {
      const key = `${review.courseName}-${review.professorName}`;
      const current = map.get(key) ?? { total: 0, count: 0 };
      map.set(key, { total: current.total + review.rating, count: current.count + 1 });
    }
    return map;
  }, [filtered]);

  function createReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.courseName.trim() || !form.professorName.trim() || !form.content.trim()) {
      setError("강의명, 교수명, 자유 후기를 입력해주세요.");
      return;
    }

    const duplicate = reviews.some((review) =>
      review.userId === user.id &&
      review.courseName === form.courseName.trim() &&
      review.professorName === form.professorName.trim()
    );

    if (duplicate) {
      setError("같은 사용자는 같은 강의명과 교수명 조합에 한 번만 작성할 수 있습니다.");
      return;
    }

    const newReview: CourseReview = {
      id: `review-${Date.now()}`,
      userId: user.id,
      courseName: form.courseName.trim(),
      professorName: form.professorName.trim(),
      semester: form.semester,
      rating: Number(form.rating),
      assignmentLevel: form.assignmentLevel,
      examLevel: form.examLevel,
      attendanceType: form.attendanceType,
      content: form.content.trim(),
      createdAt: new Date().toISOString()
    };

    setReviews((current) => [newReview, ...current]);
    setQuery(newReview.courseName);
    setForm((current) => ({ ...current, courseName: "", professorName: "", content: "" }));
    setError("");
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>강의평</h1>
        <p>강의명 또는 교수명으로 검색하고, 로그인 사용자는 수강 후기를 남길 수 있습니다.</p>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="section-title">
            <h2>강의평 검색</h2>
            <span className="badge">{filtered.length}개</span>
          </div>
          <input className="search" placeholder="강의명 또는 교수명" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="list" style={{ marginTop: 16 }}>
            {filtered.map((review) => {
              const key = `${review.courseName}-${review.professorName}`;
              const average = averages.get(key);
              return (
                <article className="list-item" key={review.id}>
                  <div className="meta">
                    <span className="badge">평균 {average ? (average.total / average.count).toFixed(1) : review.rating.toFixed(1)}점</span>
                    <span>{review.semester}</span>
                    <span>과제 {levelLabels[review.assignmentLevel]}</span>
                    <span>시험 {levelLabels[review.examLevel]}</span>
                  </div>
                  <strong>{review.courseName} · {review.professorName}</strong>
                  <span className="muted">{review.attendanceType}</span>
                  <p>{review.content}</p>
                </article>
              );
            })}
            {filtered.length === 0 ? <div className="list-item">검색 결과가 없습니다.</div> : null}
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>강의평 작성</h2>
            <span className="badge">{user.nickname}</span>
          </div>
          <form className="form" onSubmit={createReview}>
            <div className="grid two">
              <div className="field">
                <label htmlFor="course-name">강의명</label>
                <input id="course-name" value={form.courseName} onChange={(event) => setForm((current) => ({ ...current, courseName: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="professor-name">교수명</label>
                <input id="professor-name" value={form.professorName} onChange={(event) => setForm((current) => ({ ...current, professorName: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="semester">학기</label>
                <input id="semester" value={form.semester} onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="rating">평점</label>
                <select id="rating" value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}>
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}점</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="assignment">과제량</label>
                <select id="assignment" value={form.assignmentLevel} onChange={(event) => setForm((current) => ({ ...current, assignmentLevel: event.target.value as CourseReview["assignmentLevel"] }))}>
                  {Object.entries(levelLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="exam">시험 난이도</label>
                <select id="exam" value={form.examLevel} onChange={(event) => setForm((current) => ({ ...current, examLevel: event.target.value as CourseReview["examLevel"] }))}>
                  {Object.entries(levelLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="attendance">출석 방식</label>
              <input id="attendance" value={form.attendanceType} onChange={(event) => setForm((current) => ({ ...current, attendanceType: event.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="review-content">자유 후기</label>
              <textarea id="review-content" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="button" type="submit">강의평 작성</button>
          </form>
        </article>
      </section>
    </main>
  );
}
