"use client";

import { Fragment, PointerEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { timetables } from "@/lib/data";
import { dayLabels, isRecordedRemoteClass, toMinutes, weekdays } from "@/lib/timetable";
import type { CSSProperties } from "react";
import type { ClassSchedule, Timetable } from "@/lib/types";

const previewHours = Array.from({ length: 14 }, (_, index) => 9 + index);
const slideTravel = 220;
const dragThreshold = 78;
const swipeVelocityThreshold = 0.55;
const savedTimetablesKey = "newbie-on:timetables";
const importantTimetablesKey = "newbie-on:important-timetables";

export default function TimetablePage() {
  return (
    <AuthGuard>
      {() => <TimetableWorkspace />}
    </AuthGuard>
  );
}

function TimetableWorkspace() {
  const router = useRouter();
  const [timetableList, setTimetableList] = useState<Timetable[]>(timetables);
  const [deletingTimetableId, setDeletingTimetableId] = useState<string | null>(null);
  const [importantTimetableIds, setImportantTimetableIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTimetableTitle, setNewTimetableTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const stackRef = useRef<HTMLElement | null>(null);
  const dragState = useRef({ active: false, startX: 0, lastX: 0, lastTime: 0, velocity: 0 });
  const deletingTimetable = timetableList.find((item) => item.id === deletingTimetableId);
  const orderedTimetables = [...timetableList].sort((left, right) => {
    const leftImportant = importantTimetableIds.has(left.id) ? 1 : 0;
    const rightImportant = importantTimetableIds.has(right.id) ? 1 : 0;

    return rightImportant - leftImportant;
  });
  const deckItems = [{ type: "add" as const, id: "add-timetable" }, ...orderedTimetables.map((timetable) => ({ type: "timetable" as const, id: timetable.id, timetable }))];

  useEffect(() => {
    const saved = window.localStorage.getItem(savedTimetablesKey);
    const savedImportantIds = window.localStorage.getItem(importantTimetablesKey);

    if (savedImportantIds) {
      try {
        setImportantTimetableIds(new Set(JSON.parse(savedImportantIds) as string[]));
      } catch {
        window.localStorage.removeItem(importantTimetablesKey);
      }
    }

    if (!saved) {
      return;
    }

    try {
      const savedTimetables = JSON.parse(saved) as Timetable[];
      setTimetableList([...savedTimetables, ...timetables]);
    } catch {
      window.localStorage.removeItem(savedTimetablesKey);
    }
  }, []);

  function deleteTimetable(timetableId: string) {
    setTimetableList((current) => {
      const next = current.filter((item) => item.id !== timetableId);
      const savedOnly = next.filter((item) => item.id.startsWith("saved-"));
      window.localStorage.setItem(savedTimetablesKey, JSON.stringify(savedOnly));
      setActiveIndex((index) => Math.min(index, next.length));
      return next;
    });
    setImportantTimetableIds((current) => {
      const next = new Set(current);
      next.delete(timetableId);
      window.localStorage.setItem(importantTimetablesKey, JSON.stringify([...next]));
      return next;
    });
    setDeletingTimetableId(null);
  }

  function toggleImportant(timetableId: string) {
    setImportantTimetableIds((current) => {
      const next = new Set(current);

      if (next.has(timetableId)) {
        next.delete(timetableId);
      } else {
        next.add(timetableId);
      }

      window.localStorage.setItem(importantTimetablesKey, JSON.stringify([...next]));

      const nextOrderedTimetables = [...timetableList].sort((left, right) => {
        const leftImportant = next.has(left.id) ? 1 : 0;
        const rightImportant = next.has(right.id) ? 1 : 0;

        return rightImportant - leftImportant;
      });
      const nextDeckIndex = nextOrderedTimetables.findIndex((item) => item.id === timetableId) + 1;

      if (nextDeckIndex > 0) {
        setActiveIndex(nextDeckIndex);
      }

      return next;
    });
  }

  function openCreateModal() {
    setNewTimetableTitle("");
    setCreateError("");
    setIsCreateModalOpen(true);
  }

  function moveToCreatePage() {
    const trimmedTitle = newTimetableTitle.trim();

    if (!trimmedTitle) {
      setCreateError("시간표 이름을 입력하세요.");
      return;
    }

    router.push(`/timetable/edit?title=${encodeURIComponent(trimmedTitle)}`);
  }

  function moveByStep(direction: -1 | 1) {
    setActiveIndex((index) => Math.max(0, Math.min(deckItems.length - 1, index + direction)));
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }

    dragState.current = {
      active: true,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0
    };
    setIsDragging(true);
    stackRef.current?.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    if (!dragState.current.active) {
      return;
    }

    const now = performance.now();
    const elapsed = Math.max(now - dragState.current.lastTime, 1);
    const delta = event.clientX - dragState.current.lastX;

    dragState.current.velocity = delta / elapsed;
    dragState.current.lastX = event.clientX;
    dragState.current.lastTime = now;
    setDragOffset(event.clientX - dragState.current.startX);
  }

  function endDrag(event: PointerEvent<HTMLElement>) {
    if (!dragState.current.active) {
      return;
    }

    const velocity = dragState.current.velocity;
    const direction =
      dragOffset < -dragThreshold || velocity < -swipeVelocityThreshold
        ? 1
        : dragOffset > dragThreshold || velocity > swipeVelocityThreshold
          ? -1
          : 0;

    if (direction !== 0) {
      setActiveIndex((index) => Math.max(0, Math.min(deckItems.length - 1, index + direction)));
    }

    dragState.current.active = false;
    setIsDragging(false);
    setDragOffset(0);
    stackRef.current?.releasePointerCapture(event.pointerId);
  }

  const virtualActiveIndex = activeIndex - dragOffset / slideTravel;

  return (
    <main className="page timetable-home">
      <section
        className={`timetable-stack${isDragging ? " is-dragging" : ""}`}
        aria-label="시간표 목록"
        ref={stackRef}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {deckItems.map((item, index) => {
          const flowOffset = index - virtualActiveIndex;
          const settledOffset = index - activeIndex;
          const absOffset = Math.abs(flowOffset);
          const isActive = settledOffset === 0;
          const isVisible = absOffset <= 1.35;
          const clampedOffset = Math.max(-2, Math.min(2, flowOffset));
          const stackShift = Math.sign(clampedOffset) * Math.min(Math.abs(clampedOffset), 1);
          const exposureClass = flowOffset < 0 ? " expose-left" : flowOffset > 0 ? " expose-right" : "";
          const style = {
            "--stack-shift": String(stackShift),
            "--stack-y": `${Math.min(absOffset, 2) * 14}px`,
            "--stack-scale": String(Math.max(0.82, 1 - Math.min(absOffset, 2) * 0.075)),
            "--stack-rotate": `${clampedOffset * -1.8}deg`,
            zIndex: Math.round(100 - absOffset * 10),
            opacity: isVisible ? Math.max(0, 1 - Math.max(absOffset - 1, 0) * 0.42) : 0
          } as CSSProperties;

          if (item.type === "add") {
            return (
              <article
                className={`timetable-slide timetable-add-slide${isActive ? " active" : ""}${exposureClass}`}
                aria-hidden={!isVisible}
                key={item.id}
                style={style}
              >
                <div className="timetable-add-preview">
                  <TimetablePreview classes={[]} />
                </div>
                <div className="timetable-add-copy">새 시간표를 추가하세요</div>
                <button
                  aria-label="시간표 추가"
                  className="timetable-add-button"
                  type="button"
                  onClick={openCreateModal}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  +
                </button>
              </article>
            );
          }

          const { timetable } = item;
          const isImportant = importantTimetableIds.has(timetable.id);

          return (
            <article
              className={`timetable-slide${isActive ? " active" : ""}${exposureClass}`}
              aria-hidden={!isVisible}
              key={item.id}
              style={style}
            >
              <div className="section-title">
                <h2>{timetable.title}</h2>
                <div className="timetable-actions">
                  <span className="badge">{timetable.classes.length}과목</span>
                  <button
                    aria-label={isImportant ? "중요 표시 해제" : "중요 표시"}
                    className={`icon-button star${isImportant ? " active" : ""}`}
                    type="button"
                    onClick={() => toggleImportant(timetable.id)}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2-4.6-4.4 6.3-.9L12 3Z" />
                    </svg>
                  </button>
                  <Link
                    aria-label="시간표 이름 수정"
                    className="icon-button"
                    href={`/timetable/edit?id=${encodeURIComponent(timetable.id)}`}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" />
                      <path d="m13.5 6.5 4 4" />
                    </svg>
                  </Link>
                  <button
                    aria-label="시간표 삭제"
                    className="icon-button danger"
                    type="button"
                    onClick={() => setDeletingTimetableId(timetable.id)}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 14h10l1-14" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                  </button>
                </div>
              </div>
              <TimetablePreview classes={timetable.classes} />
            </article>
          );
        })}
        {activeIndex > 0 ? (
          <button
            aria-label="이전 시간표로 이동"
            className="stack-step-button stack-step-button-left"
            type="button"
            onClick={() => moveByStep(-1)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            &lt;
          </button>
        ) : null}
        {activeIndex < deckItems.length - 1 ? (
          <button
            aria-label="다음 시간표로 이동"
            className="stack-step-button stack-step-button-right"
            type="button"
            onClick={() => moveByStep(1)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            &gt;
          </button>
        ) : null}
        {activeIndex > 0 ? (
          <button
            aria-label="맨 앞으로 이동"
            className="stack-edge-button stack-edge-button-left"
            type="button"
            onClick={() => setActiveIndex(0)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            &lt;&lt;
          </button>
        ) : null}
        {activeIndex < deckItems.length - 1 ? (
          <button
            aria-label="맨 뒤로 이동"
            className="stack-edge-button stack-edge-button-right"
            type="button"
            onClick={() => setActiveIndex(deckItems.length - 1)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            &gt;&gt;
          </button>
        ) : null}
      </section>

      {deletingTimetable ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-timetable-title">
            <div>
              <h2 id="delete-timetable-title">시간표를 삭제할까요?</h2>
              <p>{deletingTimetable.title || "이 시간표"}를 삭제하면 목록에서 사라집니다.</p>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setDeletingTimetableId(null)}>취소</button>
              <button className="button danger-button" type="button" onClick={() => deleteTimetable(deletingTimetable.id)}>삭제</button>
            </div>
          </section>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="create-timetable-title">
            <div>
              <h2 id="create-timetable-title">새 시간표 이름</h2>
              <p>시간표 제작 페이지에서 사용할 이름을 입력하세요.</p>
            </div>
            <div className="field">
              <label htmlFor="new-timetable-title">시간표 이름</label>
              <input
                autoFocus
                id="new-timetable-title"
                value={newTimetableTitle}
                onChange={(event) => {
                  setNewTimetableTitle(event.target.value);
                  setCreateError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    moveToCreatePage();
                  }
                }}
              />
            </div>
            {createError ? <div className="error">{createError}</div> : null}
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setIsCreateModalOpen(false)}>취소</button>
              <button className="button" type="button" onClick={moveToCreatePage}>확인</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function TimetablePreview({ classes }: { classes: ClassSchedule[] }) {
  const onlineClasses = classes.filter(isRecordedRemoteClass);
  const mergedClasses = mergeAdjacentClasses(classes.filter((item) => !isRecordedRemoteClass(item)));

  return (
    <div className="timetable-preview-shell">
      <div className="timetable-preview" aria-label="시간표 미리보기">
        <div className="preview-head">시간</div>
        {weekdays.map((day) => (
          <div className="preview-head" key={day}>{dayLabels[day]}</div>
        ))}
        {previewHours.map((hour) => (
          <Fragment key={hour}>
            <div className="preview-time" key={`time-${hour}`}>{String(hour).padStart(2, "0")}:00</div>
            {weekdays.map((day) => <div className="preview-cell" key={`${day}-${hour}`} />)}
          </Fragment>
        ))}
        {mergedClasses.map((item) => {
          const dayIndex = weekdays.indexOf(item.dayOfWeek);
          const start = Math.max(toMinutes(item.startTime), previewHours[0] * 60);
          const end = Math.min(toMinutes(item.endTime), (previewHours[previewHours.length - 1] + 1) * 60);
          const startSlot = (start - previewHours[0] * 60) / 60;
          const durationSlots = (end - start) / 60;

          if (dayIndex < 0 || end <= start) {
            return null;
          }

          return (
            <div
              className="preview-class"
              style={{
                background: item.color,
                "--day-index": dayIndex,
                "--start-slot": startSlot,
                "--duration-slots": durationSlots
              } as CSSProperties}
              key={item.id}
            >
              <strong>{item.courseName}</strong>
              <span>{item.startTime}-{item.endTime}</span>
            </div>
          );
        })}
      </div>
      <PreviewOnlineLane classes={onlineClasses} />
    </div>
  );
}

function PreviewOnlineLane({ classes }: { classes: ClassSchedule[] }) {
  return (
    <section className="preview-online-lane" aria-label="온라인 강의">
      <div className="preview-online-label">온라인 강의</div>
      <div className="preview-online-list">
        {classes.length ? (
          classes.map((item) => (
            <div className="preview-online-card" key={item.id}>
              <strong>{item.courseName}</strong>
              <span>{item.professorName || "교수 미정"}</span>
            </div>
          ))
        ) : (
          <span className="preview-online-empty">없음</span>
        )}
      </div>
    </section>
  );
}

function mergeAdjacentClasses(classes: ClassSchedule[]) {
  const sorted = [...classes].sort((left, right) => {
    if (left.dayOfWeek !== right.dayOfWeek) {
      return weekdays.indexOf(left.dayOfWeek) - weekdays.indexOf(right.dayOfWeek);
    }

    return toMinutes(left.startTime) - toMinutes(right.startTime);
  });

  return sorted.reduce<ClassSchedule[]>((merged, item) => {
    const previous = merged[merged.length - 1];
    const isSameClass =
      previous &&
      previous.dayOfWeek === item.dayOfWeek &&
      previous.courseName === item.courseName &&
      previous.professorName === item.professorName &&
      previous.buildingName === item.buildingName &&
      previous.roomName === item.roomName &&
      previous.endTime === item.startTime;

    if (isSameClass) {
      merged[merged.length - 1] = {
        ...previous,
        endTime: item.endTime,
        memo: previous.memo || item.memo
      };
      return merged;
    }

    merged.push(item);
    return merged;
  }, []);
}
