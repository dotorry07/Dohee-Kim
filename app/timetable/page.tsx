"use client";

import { FormEvent, useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { WeeklyTimetable } from "@/components/WeeklyTimetable";
import { courses, personalSchedules as seedPersonalSchedules, timetables } from "@/lib/data";
import {
  dayLabels,
  generateTimetableCandidates,
  hasAnyOverlap,
  isTimeRangeValid,
  overlaps,
  weekdays
} from "@/lib/timetable";
import type { DayOfWeek, PersonalSchedule, Timetable } from "@/lib/types";

export default function TimetablePage() {
  return (
    <AuthGuard>
      {(user) => <TimetableWorkspace userId={user.id} department={user.department} grade={user.grade} />}
    </AuthGuard>
  );
}

function TimetableWorkspace({
  userId,
  department,
  grade
}: {
  userId: string;
  department: string;
  grade: number;
}) {
  const [personalSchedules, setPersonalSchedules] = useState<PersonalSchedule[]>(seedPersonalSchedules);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable>(timetables[0]);
  const [candidates, setCandidates] = useState<Timetable[]>([]);
  const [scheduleError, setScheduleError] = useState("");
  const [personalForm, setPersonalForm] = useState({
    title: "",
    dayOfWeek: "MON" as DayOfWeek,
    startTime: "09:00",
    endTime: "10:00",
    memo: ""
  });

  const requiredCourses = useMemo(
    () => courses.filter((course) => course.department === department && course.grade === grade && course.requiredType === "required"),
    [department, grade]
  );

  function addPersonalSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newSchedule: PersonalSchedule = {
      id: `personal-${Date.now()}`,
      userId,
      title: personalForm.title.trim(),
      dayOfWeek: personalForm.dayOfWeek,
      startTime: personalForm.startTime,
      endTime: personalForm.endTime,
      memo: personalForm.memo.trim()
    };

    if (!newSchedule.title) {
      setScheduleError("개인 일정명은 필수값입니다.");
      return;
    }

    if (!isTimeRangeValid(newSchedule.startTime, newSchedule.endTime)) {
      setScheduleError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    if (personalSchedules.some((schedule) => overlaps(schedule, newSchedule))) {
      setScheduleError("같은 요일의 개인 일정 시간이 겹칩니다.");
      return;
    }

    setPersonalSchedules((current) => [...current, newSchedule]);
    setScheduleError("");
    setPersonalForm((current) => ({ ...current, title: "", memo: "" }));
  }

  function generateCandidates() {
    const generated = generateTimetableCandidates({
      userId,
      department,
      grade,
      requiredCourseIds: requiredCourses.map((course) => course.id),
      courses,
      personalSchedules
    });
    setCandidates(generated);
    if (generated[0]) {
      setSelectedTimetable(generated[0]);
    }
  }

  function removeClass(classId: string) {
    setSelectedTimetable((current) => ({
      ...current,
      classes: current.classes.filter((item) => item.id !== classId)
    }));
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>시간표 추천</h1>
        <p>{department} {grade}학년 필수 이수 강의와 개인 일정을 기준으로 겹치지 않는 후보를 생성합니다.</p>
      </section>

      <section className="grid two">
        <article className="panel">
          <div className="section-title">
            <h2>조건 입력</h2>
            <span className="badge">필수 {requiredCourses.length}개</span>
          </div>
          <div className="list">
            {requiredCourses.map((course) => (
              <div className="list-item" key={course.id}>
                <strong>{course.courseName}</strong>
                <span className="muted">{course.professorName} · {dayLabels[course.dayOfWeek]} {course.startTime}-{course.endTime}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>개인 일정 등록</h2>
            <span className="badge">겹침 검사</span>
          </div>
          <form className="form" onSubmit={addPersonalSchedule}>
            <div className="field">
              <label htmlFor="personal-title">일정명</label>
              <input id="personal-title" value={personalForm.title} onChange={(event) => setPersonalForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid three">
              <div className="field">
                <label htmlFor="personal-day">요일</label>
                <select id="personal-day" value={personalForm.dayOfWeek} onChange={(event) => setPersonalForm((current) => ({ ...current, dayOfWeek: event.target.value as DayOfWeek }))}>
                  {weekdays.map((day) => <option key={day} value={day}>{dayLabels[day]}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="personal-start">시작</label>
                <input id="personal-start" type="time" value={personalForm.startTime} onChange={(event) => setPersonalForm((current) => ({ ...current, startTime: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="personal-end">종료</label>
                <input id="personal-end" type="time" value={personalForm.endTime} onChange={(event) => setPersonalForm((current) => ({ ...current, endTime: event.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="personal-memo">메모</label>
              <input id="personal-memo" value={personalForm.memo} onChange={(event) => setPersonalForm((current) => ({ ...current, memo: event.target.value }))} />
            </div>
            {scheduleError ? <div className="error">{scheduleError}</div> : null}
            <div className="chip-row">
              <button className="button" type="submit">개인 일정 추가</button>
              <button className="ghost-button" type="button" onClick={generateCandidates}>추천 후보 생성</button>
            </div>
          </form>
        </article>
      </section>

      <section className="grid two" style={{ marginTop: 16 }}>
        <article className="panel">
          <div className="section-title">
            <h2>개인 일정</h2>
            <span className={hasAnyOverlap(personalSchedules) ? "badge" : "chip"}>{personalSchedules.length}개</span>
          </div>
          <div className="list">
            {personalSchedules.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.title}</strong>
                <span className="muted">{dayLabels[item.dayOfWeek as DayOfWeek]} {item.startTime}-{item.endTime} · {item.memo}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>추천 시간표 후보</h2>
            <span className="badge">평점순</span>
          </div>
          <div className="list">
            {(candidates.length ? candidates : [selectedTimetable]).map((candidate) => (
              <button
                className="list-item"
                type="button"
                key={candidate.id}
                onClick={() => setSelectedTimetable(candidate)}
                style={{ textAlign: "left" }}
              >
                <strong>{candidate.title}</strong>
                <span className="muted">평균 {candidate.score.toFixed(2)}점 · {candidate.classes.length}과목</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title">
          <h2>대표 시간표</h2>
          <span className="badge">{selectedTimetable.title}</span>
        </div>
        <WeeklyTimetable classes={selectedTimetable.classes} personalSchedules={personalSchedules} />
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title">
          <h2>강의 수정</h2>
          <span className="badge">삭제 지원</span>
        </div>
        <div className="list">
          {selectedTimetable.classes.map((item) => (
            <div className="list-item" key={item.id}>
              <strong>{item.courseName}</strong>
              <span className="muted">{item.professorName} · {item.buildingName} {item.roomName}</span>
              <button className="ghost-button" type="button" onClick={() => removeClass(item.id)}>삭제</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
