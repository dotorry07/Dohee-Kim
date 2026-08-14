"use client";

import { Fragment, PointerEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { BannerTagIcon } from "@/components/BannerTagIcon";
import { dayLabels, getClassCreditLabel, getTotalCreditLabel, isRemoteClass, toMinutes, weekdays } from "@/lib/timetable";
import { deleteRemoteTimetable, loadRemoteTimetables, saveRemoteTimetable, selectRemoteMonthlyTimetable } from "@/lib/timetable-storage";
import { TimetableSelect } from "./TimetableSelect";
import styles from "./SwipeNotice.module.css";
import fingerImage from "./finger.png";
import type { CSSProperties } from "react";
import type { ClassSchedule, PersonalSchedule, Timetable, UserProfile } from "@/lib/types";

const previewHours = Array.from({ length: 12 }, (_, index) => 9 + index);
const slideTravel = 220;
const dragThreshold = 78;
const swipeVelocityThreshold = 0.55;
const savedTimetablesKey = "newbie-on:timetables";
const selectedTimetablesBySemesterKey = "newbie-on:selected-timetables-by-semester";
const legacyMonthlyTimetableKey = "newbie-on:monthly-timetable";
const legacyImportantTimetablesKey = "newbie-on:important-timetables";
const swipeNoticeFadeMs = 160;
const swipeNoticeSeenKey = (userId: string) => `newbie-on:swipe-notice-seen:${userId}`;
const currentSemester = "2026-2";
const semesterOrder = {
  "1": 1,
  summer: 2,
  "2": 3,
  winter: 4
} as const;
const semesterOptions = [
  { value: "2026-2", label: "2026년 2학기" },
  { value: "2026-summer", label: "2026년 여름 계절학기" },
  { value: "2026-1", label: "2026년 1학기" },
  { value: "2025-winter", label: "2025년 겨울 계절학기" },
  { value: "2025-2", label: "2025년 2학기" },
  { value: "2025-summer", label: "2025년 여름 계절학기" },
  { value: "2025-1", label: "2025년 1학기" },
  { value: "2024-winter", label: "2024년 겨울 계절학기" },
  { value: "2024-2", label: "2024년 2학기" },
  { value: "2024-summer", label: "2024년 여름 계절학기" },
  { value: "2024-1", label: "2024년 1학기" },
  { value: "2023-winter", label: "2023년 겨울 계절학기" },
  { value: "2023-2", label: "2023년 2학기" },
  { value: "2023-summer", label: "2023년 여름 계절학기" },
  { value: "2023-1", label: "2023년 1학기" }
];

function getSemesterLabel(semester: string) {
  return semesterOptions.find((option) => option.value === semester)?.label ?? semester;
}

function getSelectedTimetableLabel(semester: string) {
  return semester === currentSemester ? "이번학기의 시간표" : `${getSemesterLabel(semester)}의 시간표`;
}

function getSelectTimetableLabel(semester: string) {
  return `${getSelectedTimetableLabel(semester)}로 선택`;
}

function getSemesterSortValue(semester: string) {
  const [year, semesterPart] = semester.split("-");
  const order = semesterOrder[semesterPart as keyof typeof semesterOrder];

  if (!year || !order) {
    return null;
  }

  return Number(year) * 10 + order;
}

function isBeforeCurrentSemester(semester: string) {
  const semesterSortValue = getSemesterSortValue(semester);
  const currentSemesterSortValue = getSemesterSortValue(currentSemester);

  return semesterSortValue !== null
    && currentSemesterSortValue !== null
    && semesterSortValue < currentSemesterSortValue;
}

export default function TimetablePage() {
  return (
    <AuthGuard>
      {(user) => <TimetableWorkspace user={user} />}
    </AuthGuard>
  );
}

function TimetableWorkspace({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [timetableList, setTimetableList] = useState<Timetable[]>([]);
  const [deletingTimetableId, setDeletingTimetableId] = useState<string | null>(null);
  const [isDeleteConfirmClosing, setIsDeleteConfirmClosing] = useState(false);
  const [selectedTimetableIdsBySemester, setSelectedTimetableIdsBySemester] = useState<Record<string, string>>({});
  const [pendingMonthlyTimetableId, setPendingMonthlyTimetableId] = useState<string | null>(null);
  const [pendingDownloadTimetableId, setPendingDownloadTimetableId] = useState<string | null>(null);
  const [renamingTimetableId, setRenamingTimetableId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTimetableTitle, setNewTimetableTitle] = useState("");
  const [renameTimetableTitle, setRenameTimetableTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const [renameError, setRenameError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isSwipeNoticeOpen, setIsSwipeNoticeOpen] = useState(false);
  const [isSwipeNoticeClosing, setIsSwipeNoticeClosing] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(currentSemester);
  const [syncError, setSyncError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const pageRef = useRef<HTMLElement | null>(null);
  const stackRef = useRef<HTMLElement | null>(null);
  const swipeNoticeTimerRef = useRef<number | null>(null);
  const deleteConfirmCloseTimerRef = useRef<number | null>(null);
  const shouldKeepInitialBottomScrollRef = useRef(true);
  const dragState = useRef({ active: false, startX: 0, lastX: 0, lastTime: 0, velocity: 0 });
  const deletingTimetable = timetableList.find((item) => item.id === deletingTimetableId);
  const pendingMonthlyTimetable = timetableList.find((item) => item.id === pendingMonthlyTimetableId);
  const pendingDownloadTimetable = timetableList.find((item) => item.id === pendingDownloadTimetableId);
  const renamingTimetable = timetableList.find((item) => item.id === renamingTimetableId);
  const visibleSemesterOptions = useMemo(() => {
    const visibleSemesters = new Set([
      currentSemester,
      ...timetableList.map((timetable) => timetable.semester)
    ]);
    const knownOptions = semesterOptions.filter((option) => visibleSemesters.has(option.value));
    const knownOptionValues = new Set(knownOptions.map((option) => option.value));
    const unknownOptions = [...visibleSemesters]
      .filter((semester) => !knownOptionValues.has(semester))
      .map((semester) => ({ value: semester, label: semester }));

    return [...knownOptions, ...unknownOptions];
  }, [timetableList]);
  const filteredTimetables = timetableList.filter((timetable) => timetable.semester === selectedSemester);
  const selectedTimetableId = selectedTimetableIdsBySemester[selectedSemester] ?? null;
  const orderedTimetables = [...filteredTimetables].sort((left, right) => {
    const leftMonthly = left.id === selectedTimetableId ? 1 : 0;
    const rightMonthly = right.id === selectedTimetableId ? 1 : 0;

    return rightMonthly - leftMonthly;
  });
  const activeTimetable = orderedTimetables[activeIndex] ?? null;
  const currentTimetablePosition = orderedTimetables.length ? Math.min(activeIndex + 1, orderedTimetables.length) : 0;
  const scrollTimetablePageToBottom = useCallback(() => {
    const scrollingElement = document.scrollingElement ?? document.documentElement;
    const maxTop = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: maxTop, behavior: "auto" });
    pageRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, []);

  useLayoutEffect(() => {
    const scrollToBottom = () => {
      if (!shouldKeepInitialBottomScrollRef.current) {
        return;
      }

      scrollTimetablePageToBottom();
    };
    const stopInitialScroll = () => {
      shouldKeepInitialBottomScrollRef.current = false;
    };
    const previousScrollRestoration = window.history.scrollRestoration;
    const intervalId = window.setInterval(scrollToBottom, 50);
    const timeoutId = window.setTimeout(() => {
      shouldKeepInitialBottomScrollRef.current = false;
      window.clearInterval(intervalId);
    }, 2500);
    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToBottom();
      window.requestAnimationFrame(scrollToBottom);
    });

    window.history.scrollRestoration = "manual";
    window.addEventListener("wheel", stopInitialScroll, { passive: true });
    window.addEventListener("touchstart", stopInitialScroll, { passive: true });
    window.addEventListener("keydown", stopInitialScroll);

    return () => {
      shouldKeepInitialBottomScrollRef.current = false;
      window.history.scrollRestoration = previousScrollRestoration;
      window.cancelAnimationFrame(animationFrameId);
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("wheel", stopInitialScroll);
      window.removeEventListener("touchstart", stopInitialScroll);
      window.removeEventListener("keydown", stopInitialScroll);
    };
  }, [scrollTimetablePageToBottom]);

  useEffect(() => {
    if (!shouldKeepInitialBottomScrollRef.current) {
      return;
    }

    scrollTimetablePageToBottom();
    const animationFrameId = window.requestAnimationFrame(scrollTimetablePageToBottom);
    const timeoutId = window.setTimeout(scrollTimetablePageToBottom, 120);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [orderedTimetables.length, scrollTimetablePageToBottom, selectedSemester, timetableList.length]);

  useEffect(() => {
    const initialSemester = new URLSearchParams(window.location.search).get("semester");
    const saved = window.localStorage.getItem(savedTimetablesKey);
    const savedSelectedTimetablesBySemester = window.localStorage.getItem(selectedTimetablesBySemesterKey);
    const legacyMonthlyTimetableId = window.localStorage.getItem(legacyMonthlyTimetableKey);
    const legacyImportantIds = window.localStorage.getItem(legacyImportantTimetablesKey);
    setIsSwipeNoticeOpen(window.localStorage.getItem(swipeNoticeSeenKey(user.id)) !== "true");

    if (initialSemester) {
      setSelectedSemester(initialSemester);
    }

    if (savedSelectedTimetablesBySemester) {
      try {
        setSelectedTimetableIdsBySemester(JSON.parse(savedSelectedTimetablesBySemester) as Record<string, string>);
      } catch {
        window.localStorage.removeItem(selectedTimetablesBySemesterKey);
      }
    } else if (legacyMonthlyTimetableId) {
      setSelectedTimetableIdsBySemester((current) => ({ ...current, [currentSemester]: legacyMonthlyTimetableId }));
      window.localStorage.setItem(selectedTimetablesBySemesterKey, JSON.stringify({ [currentSemester]: legacyMonthlyTimetableId }));
    } else if (legacyImportantIds) {
      try {
        const [legacyImportantTimetableId] = JSON.parse(legacyImportantIds) as string[];
        if (legacyImportantTimetableId) {
          setSelectedTimetableIdsBySemester((current) => ({ ...current, [currentSemester]: legacyImportantTimetableId }));
          window.localStorage.setItem(selectedTimetablesBySemesterKey, JSON.stringify({ [currentSemester]: legacyImportantTimetableId }));
        }
      } catch {
        window.localStorage.removeItem(legacyImportantTimetablesKey);
      }
    }

    if (saved) {
      try {
        const savedTimetables = JSON.parse(saved) as Timetable[];
        setTimetableList(savedTimetables);
      } catch {
        window.localStorage.removeItem(savedTimetablesKey);
      }
    }

    async function loadRemote() {
      try {
        const remoteTimetables = await loadRemoteTimetables(user);

        if (!remoteTimetables) {
          return;
        }

        const remoteIds = new Set(remoteTimetables.map((item) => item.id));
        setTimetableList((current) => {
          const localById = new Map(current.map((item) => [item.id, item]));
          const mergedRemoteTimetables = remoteTimetables.map((remoteTimetable) => {
            const localTimetable = localById.get(remoteTimetable.id);

            if (remoteTimetable.personalSchedules?.length || !localTimetable?.personalSchedules?.length) {
              return remoteTimetable;
            }

            return {
              ...remoteTimetable,
              personalSchedules: localTimetable.personalSchedules
            };
          });
          const localOnlyTimetables = current.filter((item) => !remoteIds.has(item.id));
          return [...mergedRemoteTimetables, ...localOnlyTimetables];
        });
        setSyncError("");

        const selectedRemoteTimetablesBySemester = remoteTimetables.reduce<Record<string, string>>((selected, timetable) => {
          if (timetable.isSelected) {
            selected[timetable.semester] = timetable.id;
          }

          return selected;
        }, {});

        if (Object.keys(selectedRemoteTimetablesBySemester).length) {
          setSelectedTimetableIdsBySemester((current) => {
            const next = { ...current, ...selectedRemoteTimetablesBySemester };
            window.localStorage.setItem(selectedTimetablesBySemesterKey, JSON.stringify(next));
            return next;
          });
        }
      } catch {
        setSyncError("Supabase 시간표를 불러오지 못해 로컬 데이터로 표시합니다.");
      }
    }

    void loadRemote();
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (swipeNoticeTimerRef.current !== null) {
        window.clearTimeout(swipeNoticeTimerRef.current);
      }
      if (deleteConfirmCloseTimerRef.current !== null) {
        window.clearTimeout(deleteConfirmCloseTimerRef.current);
      }
    };
  }, []);

  function dismissSwipeNotice() {
    if (isSwipeNoticeClosing) {
      return;
    }

    shouldKeepInitialBottomScrollRef.current = false;
    window.localStorage.setItem(swipeNoticeSeenKey(user.id), "true");
    setIsSwipeNoticeClosing(true);
    swipeNoticeTimerRef.current = window.setTimeout(() => {
      setIsSwipeNoticeOpen(false);
      setIsSwipeNoticeClosing(false);
      swipeNoticeTimerRef.current = null;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, swipeNoticeFadeMs);
  }

  async function deleteTimetable(timetableId: string) {
    try {
      await deleteRemoteTimetable(user, timetableId);
      setSyncError("");
    } catch {
      setSyncError("Supabase에서 시간표를 삭제하지 못했습니다. 로컬 목록에서만 삭제합니다.");
    }

    setTimetableList((current) => {
      const next = current.filter((item) => item.id !== timetableId);
      const nextFilteredLength = next.filter((item) => item.semester === selectedSemester).length;
      const savedOnly = next.filter((item) => item.id.startsWith("saved-"));
      window.localStorage.setItem(savedTimetablesKey, JSON.stringify(savedOnly));
      setActiveIndex((index) => Math.max(0, Math.min(index, nextFilteredLength - 1)));
      return next;
    });
    setSelectedTimetableIdsBySemester((current) => {
      if (!deletingTimetable || current[deletingTimetable.semester] !== timetableId) {
        return current;
      }

      const next = { ...current };
      delete next[deletingTimetable.semester];
      window.localStorage.setItem(selectedTimetablesBySemesterKey, JSON.stringify(next));
      return next;
    });
    setPendingMonthlyTimetableId((current) => (current === timetableId ? null : current));
    setDeletingTimetableId(null);
  }

  async function applyMonthlyTimetable(timetableId: string) {
    const targetTimetable = timetableList.find((item) => item.id === timetableId);

    if (targetTimetable) {
      try {
        await selectRemoteMonthlyTimetable(user, timetableId, targetTimetable.semester);
        setSyncError("");
      } catch {
        setSyncError(`Supabase에 ${getSelectedTimetableLabel(targetTimetable.semester)} 선택을 저장하지 못했습니다.`);
      }
    }

    if (targetTimetable) {
      setSelectedTimetableIdsBySemester((current) => {
        const next = { ...current, [targetTimetable.semester]: timetableId };
        window.localStorage.setItem(selectedTimetablesBySemesterKey, JSON.stringify(next));
        return next;
      });
    }

    const nextOrderedTimetables = timetableList.filter((timetable) => timetable.semester === targetTimetable?.semester).sort((left, right) => {
      const leftMonthly = left.id === timetableId ? 1 : 0;
      const rightMonthly = right.id === timetableId ? 1 : 0;

      return rightMonthly - leftMonthly;
    });
    const nextDeckIndex = nextOrderedTimetables.findIndex((item) => item.id === timetableId);

    if (targetTimetable) {
      setSelectedSemester(targetTimetable.semester);
    }

    if (nextDeckIndex >= 0) {
      setActiveIndex(nextDeckIndex);
    }
  }

  function selectMonthlyTimetable(timetableId: string) {
    const targetTimetable = timetableList.find((item) => item.id === timetableId);

    if (!targetTimetable) {
      return;
    }

    const currentSelectedTimetableId = selectedTimetableIdsBySemester[targetTimetable.semester] ?? null;

    if (currentSelectedTimetableId === timetableId) {
      return;
    }

    if (isBeforeCurrentSemester(targetTimetable.semester) && currentSelectedTimetableId) {
      return;
    }

    if (currentSelectedTimetableId) {
      setPendingMonthlyTimetableId(timetableId);
      return;
    }

    void applyMonthlyTimetable(timetableId);
  }

  function confirmMonthlyTimetableChange() {
    if (!pendingMonthlyTimetableId) {
      return;
    }

    void applyMonthlyTimetable(pendingMonthlyTimetableId);
    setPendingMonthlyTimetableId(null);
  }

  function closeDeleteTimetableConfirm() {
    if (isDeleteConfirmClosing) {
      return;
    }

    setIsDeleteConfirmClosing(true);
    deleteConfirmCloseTimerRef.current = window.setTimeout(() => {
      setDeletingTimetableId(null);
      setIsDeleteConfirmClosing(false);
      deleteConfirmCloseTimerRef.current = null;
    }, 160);
  }

  function openCreateModal() {
    setNewTimetableTitle("");
    setCreateError("");
    setIsAddMenuOpen(false);
    setIsCreateModalOpen(true);
  }

  function openRenameModal(timetable: Timetable) {
    setRenamingTimetableId(timetable.id);
    setRenameTimetableTitle(timetable.title);
    setRenameError("");
  }

  async function renameTimetable() {
    if (!renamingTimetable) {
      return;
    }

    const trimmedTitle = renameTimetableTitle.trim();

    if (!trimmedTitle) {
      setRenameError("시간표 이름을 입력하세요.");
      return;
    }

    const renamedTimetable = { ...renamingTimetable, title: trimmedTitle };

    try {
      await saveRemoteTimetable(user, renamedTimetable);
      setSyncError("");
    } catch {
      setSyncError("Supabase에 시간표 이름을 저장하지 못했습니다. 로컬 목록에는 반영했습니다.");
    }

    setTimetableList((current) => {
      const next = current.map((item) => (item.id === renamedTimetable.id ? renamedTimetable : item));
      const savedOnly = next.filter((item) => item.id.startsWith("saved-"));
      window.localStorage.setItem(savedTimetablesKey, JSON.stringify(savedOnly));
      return next;
    });
    setRenamingTimetableId(null);
    setRenameTimetableTitle("");
    setRenameError("");
  }

  function copyActiveTimetableSettings() {
    if (!activeTimetable) {
      return;
    }

    const copiedTitle = `${activeTimetable.title || "시간표"} 복사본`;
    const draftKey = `newbie-on:timetable-edit-draft:${copiedTitle}:${activeTimetable.semester}`;
    window.localStorage.setItem(draftKey, JSON.stringify({
      title: copiedTitle,
      semester: activeTimetable.semester,
      classes: activeTimetable.classes,
      personalSchedules: activeTimetable.personalSchedules ?? [],
      selectedRequiredCourseIds: []
    }));
    setIsAddMenuOpen(false);
    router.push(`/timetable/edit?${new URLSearchParams({ title: copiedTitle, semester: activeTimetable.semester }).toString()}`);
  }

  function moveToCreatePage() {
    const trimmedTitle = newTimetableTitle.trim();

    if (!trimmedTitle) {
      setCreateError("시간표 이름을 입력하세요.");
      return;
    }

    const params = new URLSearchParams({
      title: trimmedTitle,
      semester: selectedSemester
    });
    router.push(`/timetable/edit?${params.toString()}`);
  }

  function moveToPreviousTimetable() {
    setActiveIndex((index) => Math.max(0, index - 1));
  }

  function moveToNextTimetable() {
    setActiveIndex((index) => Math.min(orderedTimetables.length - 1, index + 1));
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || orderedTimetables.length === 0) {
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
      setActiveIndex((index) => Math.max(0, Math.min(orderedTimetables.length - 1, index + direction)));
    }

    dragState.current.active = false;
    setIsDragging(false);
    setDragOffset(0);
    stackRef.current?.releasePointerCapture(event.pointerId);
  }

  const virtualActiveIndex = activeIndex - dragOffset / slideTravel;
  const addMenu = (
    <div className={`timetable-add-menu${isAddMenuOpen ? " open" : ""}${activeTimetable ? "" : " single-option"}`}>
      <button
        aria-label="새 시간표 제작"
        className="timetable-add-option timetable-add-create-option"
        title="새 시간표 제작"
        type="button"
        onClick={openCreateModal}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" />
          <path d="m13.5 6.5 4 4" />
          <path d="M19 15v5" />
          <path d="M16.5 17.5h5" />
        </svg>
        <span>새 시간표 제작</span>
      </button>
      {activeTimetable ? (
        <button
          aria-label="현재 시간표 설정 복사"
          className="timetable-add-option"
          title="현재 시간표 설정 복사"
          type="button"
          onClick={copyActiveTimetableSettings}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <rect x="8" y="8" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
          </svg>
          <span>시간표 설정 복사</span>
        </button>
      ) : null}
      <button
        aria-expanded={isAddMenuOpen}
        aria-label="시간표 추가 옵션"
        className="timetable-add-button"
        type="button"
        onClick={() => setIsAddMenuOpen((current) => !current)}
      >
        +
      </button>
    </div>
  );

  return (
    <main className="page timetable-home" ref={pageRef}>
      <section className="timetable-top-banner" aria-labelledby="timetable-page-title">
        <div className="timetable-top-banner-inner app-banner-inner">
          <div className="timetable-top-banner-copy app-banner-copy">
            <h1 id="timetable-page-title">내 시간표</h1>
            <p>저장한 시간표를 학기별로 확인해보세요.</p>
            <div className="app-banner-tags" aria-hidden="true">
              <span><BannerTagIcon icon="calendar" />학기별 조회</span>
              <span><BannerTagIcon icon="star" />시간표 선택</span>
              <span><BannerTagIcon icon="phone" />이미지 저장</span>
              <span><BannerTagIcon icon="clock" />개인 일정</span>
              <span><BannerTagIcon icon="edit" />시간표 편집</span>
            </div>
          </div>
          <div className="app-banner-art timetable-banner-art" aria-hidden="true">
            <img className="timetable-top-banner-image" src="/images/banner-timetable.png" alt="" />
          </div>
        </div>
      </section>

      <section
        className={`timetable-stack${isDragging ? " is-dragging" : ""}`}
        aria-label="시간표 목록"
        ref={stackRef}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {syncError ? <div className="timetable-sync-error">{syncError}</div> : null}

        <div className="timetable-semester-filter" onPointerDown={(event) => event.stopPropagation()}>
          <TimetableSelect
            id="timetable-semester"
            ariaLabel="학기 선택"
            value={selectedSemester}
            options={visibleSemesterOptions}
            onChange={(nextSemester) => {
              setSelectedSemester(nextSemester);
              setActiveIndex(0);
            }}
          />
        </div>

        {orderedTimetables.length ? (
          <div className="timetable-deck-controls" onPointerDown={(event) => event.stopPropagation()}>
            <button
              aria-label="이전 시간표"
              className="timetable-deck-button"
              type="button"
              disabled={activeIndex <= 0}
              onClick={moveToPreviousTimetable}
            >
              ‹
            </button>
            <span className="timetable-deck-count" aria-label={`현재 ${currentTimetablePosition}번째, 전체 ${orderedTimetables.length}개 시간표`}>
              {currentTimetablePosition} / {orderedTimetables.length}
            </span>
            <button
              aria-label="다음 시간표"
              className="timetable-deck-button"
              type="button"
              disabled={activeIndex >= orderedTimetables.length - 1}
              onClick={moveToNextTimetable}
            >
              ›
            </button>
          </div>
        ) : null}

        {orderedTimetables.length === 0 ? (
          <div className="timetable-empty-state">
            <span className="timetable-empty-plus" aria-hidden="true">+</span>
            <strong>아직 시간표가 없어요</strong>
            <span className="timetable-empty-subtitle">시간표를 추가해보세요</span>
            <button
              className="timetable-empty-add-button"
              type="button"
              onClick={openCreateModal}
              onPointerDown={(event) => event.stopPropagation()}
            >
              시간표 추가
            </button>
          </div>
        ) : null}

        {orderedTimetables.map((timetable, index) => {
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
          const selectedLabel = getSelectedTimetableLabel(timetable.semester);
          const isMonthlyTimetable = timetable.id === selectedTimetableIdsBySemester[timetable.semester];
          const isPreviousSemesterSelectionLocked = isBeforeCurrentSemester(timetable.semester) && Boolean(selectedTimetableIdsBySemester[timetable.semester]) && !isMonthlyTimetable;

          return (
            <article
              className={`timetable-slide${isActive ? " active" : ""}${exposureClass}`}
              aria-hidden={!isVisible}
              key={timetable.id}
              style={style}
            >
              <div className="section-title">
                <div className="timetable-title-line">
                  <div className="timetable-title-underline">
                    <h2>{timetable.title}</h2>
                    <button
                      aria-label="시간표 이름 수정"
                      className="icon-button timetable-title-edit-button"
                      type="button"
                      onClick={() => openRenameModal(timetable)}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" />
                        <path d="m13.5 6.5 4 4" />
                      </svg>
                      <span className="timetable-action-tooltip" aria-hidden="true">이름 수정</span>
                    </button>
                  </div>
                  {isMonthlyTimetable ? (
                    <span className="monthly-star" aria-label={selectedLabel}>
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M12 3.4c.5 0 .9.3 1.1.7l1.9 3.9 4.3.6c.5.1.9.4 1 .9.2.5 0 1-.3 1.3l-3.1 3 .7 4.3c.1.5-.1 1-.5 1.3-.4.3-.9.3-1.4.1L12 17.5l-3.8 2c-.4.2-1 .2-1.4-.1-.4-.3-.6-.8-.5-1.3l.7-4.3-3.1-3c-.4-.3-.5-.8-.3-1.3.2-.5.5-.8 1-.9L9 8l1.9-3.9c.2-.4.6-.7 1.1-.7Z" />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <div className="timetable-actions">
                  <span className="badge">{timetable.classes.length}과목</span>
                  <span className="badge total-credit-badge">{getTotalCreditLabel(timetable.classes)}</span>
                  <button
                    aria-pressed={isMonthlyTimetable}
                    className={`monthly-timetable-button${isMonthlyTimetable ? " active" : ""}`}
                    type="button"
                    disabled={isPreviousSemesterSelectionLocked}
                    onClick={() => selectMonthlyTimetable(timetable.id)}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    {isMonthlyTimetable ? selectedLabel : isPreviousSemesterSelectionLocked ? "이전학기의 시간표 고정됨" : getSelectTimetableLabel(timetable.semester)}
                  </button>
                  <Link
                    aria-label="시간표 전체 수정"
                    className="icon-button"
                    href={`/timetable/edit?id=${encodeURIComponent(timetable.id)}`}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" />
                      <path d="m13.5 6.5 4 4" />
                    </svg>
                    <span className="timetable-action-tooltip" aria-hidden="true">시간표 수정</span>
                  </Link>
                  <button
                    aria-label="시간표 이미지 다운로드"
                    className="icon-button"
                    type="button"
                    onClick={() => setPendingDownloadTimetableId(timetable.id)}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12 3v12" />
                      <path d="m7 10 5 5 5-5" />
                      <path d="M5 19h14" />
                    </svg>
                    <span className="timetable-action-tooltip" aria-hidden="true">다운로드</span>
                  </button>
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
                    <span className="timetable-action-tooltip" aria-hidden="true">시간표 삭제</span>
                  </button>
                </div>
              </div>
              <TimetablePreview classes={timetable.classes} personalSchedules={timetable.personalSchedules} />
            </article>
          );
        })}
      </section>

      {isMounted ? createPortal(addMenu, document.body) : null}

      {deletingTimetable ? (
        <div className={isDeleteConfirmClosing ? "modal-backdrop closing" : "modal-backdrop"} role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeDeleteTimetableConfirm();
        }}>
          <section className="confirm-modal yes-no-confirm delete-confirm" role="dialog" aria-modal="true" aria-labelledby="delete-timetable-title">
            <div className="yes-no-confirm-mark delete-confirm-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7" /></svg>
            </div>
            <div>
              <h2 id="delete-timetable-title">시간표를 삭제할까요?</h2>
              <p>{deletingTimetable.title || "이 시간표"}를 삭제하면 목록에서 사라집니다.</p>
            </div>
            <div className="modal-actions">
              <button className="button" type="button" onClick={() => void deleteTimetable(deletingTimetable.id)}>삭제</button>
              <button className="ghost-button" type="button" onClick={closeDeleteTimetableConfirm}>취소</button>
            </div>
          </section>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsCreateModalOpen(false);
        }}>
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

      {renamingTimetable ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRenamingTimetableId(null);
        }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="rename-timetable-title">
            <div>
              <h2 id="rename-timetable-title">시간표 이름 수정</h2>
              <p>시간표 내용은 그대로 두고 이름만 변경합니다.</p>
            </div>
            <div className="field">
              <label htmlFor="rename-timetable-title-input">시간표 이름</label>
              <input
                autoFocus
                id="rename-timetable-title-input"
                value={renameTimetableTitle}
                onChange={(event) => {
                  setRenameTimetableTitle(event.target.value);
                  setRenameError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void renameTimetable();
                  }
                }}
              />
            </div>
            {renameError ? <div className="error">{renameError}</div> : null}
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setRenamingTimetableId(null)}>취소</button>
              <button className="button" type="button" onClick={() => void renameTimetable()}>저장</button>
            </div>
          </section>
        </div>
      ) : null}

      {pendingMonthlyTimetable ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPendingMonthlyTimetableId(null);
        }}>
          <section className="confirm-modal yes-no-confirm" role="alertdialog" aria-modal="true" aria-labelledby="monthly-timetable-title">
            <div className="yes-no-confirm-mark" aria-hidden="true">?</div>
            <div>
              <h2 id="monthly-timetable-title">{getSelectedTimetableLabel(pendingMonthlyTimetable.semester)}를 변경하시겠습니까?</h2>
              <p>{pendingMonthlyTimetable.title || "이 시간표"}를 {getSelectedTimetableLabel(pendingMonthlyTimetable.semester)}로 선택합니다.</p>
            </div>
            <div className="modal-actions">
              <button className="button" type="button" onClick={confirmMonthlyTimetableChange}>예</button>
              <button className="ghost-button" type="button" onClick={() => setPendingMonthlyTimetableId(null)}>아니오</button>
            </div>
          </section>
        </div>
      ) : null}

      {pendingDownloadTimetable ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPendingDownloadTimetableId(null);
        }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="download-timetable-title">
            <div>
              <h2 id="download-timetable-title">시간표를 다운로드하겠습니까?</h2>
              <p>{pendingDownloadTimetable.title || "이 시간표"}를 핸드폰 기준 이미지로 저장합니다.</p>
            </div>
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setPendingDownloadTimetableId(null)}>취소</button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  downloadTimetableImage(pendingDownloadTimetable);
                  setPendingDownloadTimetableId(null);
                }}
              >
                다운로드
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isSwipeNoticeOpen ? (
        <button
          aria-label="스와이프 안내 닫기"
          className={`${styles.overlay}${isSwipeNoticeClosing ? ` ${styles.closing}` : ""}`}
          type="button"
          onClick={dismissSwipeNotice}
          onPointerDown={(event) => {
            event.stopPropagation();
            dismissSwipeNotice();
          }}
        >
          <span className={styles.content}>
            <span className={styles.message}>스와이프하여 시간표를 넘기세요</span>
            <span className={styles.swipeDemo} aria-hidden="true">
              <span className={`${styles.demoCard} ${styles.demoCardLeft}`} />
              <span className={`${styles.demoCard} ${styles.demoCardCenter}`} />
              <span className={`${styles.demoCard} ${styles.demoCardRight}`} />
              <span className={`${styles.demoCard} ${styles.demoCardIncoming}`} />
              <img className={styles.fingerImage} src={fingerImage.src} alt="" />
            </span>
          </span>
        </button>
      ) : null}
    </main>
  );
}

function TimetablePreview({
  classes,
  personalSchedules
}: {
  classes: ClassSchedule[];
  personalSchedules?: PersonalSchedule[];
}) {
  const onlineClasses = classes.filter(isRemoteClass);
  const mergedClasses = mergeAdjacentClasses(classes.filter((item) => !isRemoteClass(item)));
  const schedules = (personalSchedules ?? []).filter((item) => weekdays.includes(item.dayOfWeek as (typeof weekdays)[number]));

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
              {getClassCreditLabel(item) ? <span>{getClassCreditLabel(item)}</span> : null}
            </div>
          );
        })}
        {schedules.map((item) => {
          const dayIndex = weekdays.indexOf(item.dayOfWeek as (typeof weekdays)[number]);
          const start = Math.max(toMinutes(item.startTime), previewHours[0] * 60);
          const end = Math.min(toMinutes(item.endTime), (previewHours[previewHours.length - 1] + 1) * 60);
          const startSlot = (start - previewHours[0] * 60) / 60;
          const durationSlots = (end - start) / 60;

          if (dayIndex < 0 || end <= start) {
            return null;
          }

          return (
            <div
              className="preview-class preview-personal-class"
              style={{
                "--day-index": dayIndex,
                "--start-slot": startSlot,
                "--duration-slots": durationSlots
              } as CSSProperties}
              key={item.id}
            >
              <strong>{item.title}</strong>
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
              <span>{[item.professorName || "교수 미정", getClassCreditLabel(item)].filter(Boolean).join(" · ")}</span>
            </div>
          ))
        ) : (
          <span className="preview-online-empty">없음</span>
        )}
      </div>
    </section>
  );
}

function downloadTimetableImage(timetable: Timetable) {
  const scale = 3;
  const width = 390;
  const height = 844;
  const margin = 18;
  const titleHeight = 72;
  const onlineHeight = 64;
  const bottomMargin = 34;
  const gap = 12;
  const gridLeft = margin;
  const gridWidth = width - margin * 2;
  const gridHeight = 540;
  const onlineTop = height - bottomMargin - onlineHeight;
  const gridTop = onlineTop - gap - gridHeight;
  const timeColumn = 48;
  const headerHeight = 34;
  const hourHeight = (gridHeight - headerHeight) / previewHours.length;
  const dayWidth = (gridWidth - timeColumn) / weekdays.length;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#582f82";
  context.font = "600 13px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(getSemesterLabel(timetable.semester), width / 2, margin + titleHeight / 2);

  drawRoundedRect(context, gridLeft, gridTop, gridWidth, gridHeight, 8, "#ffffff", "#8c8c8c");
  context.fillStyle = "#f6f3fa";
  context.fillRect(gridLeft, gridTop, gridWidth, headerHeight);
  context.strokeStyle = "#8c8c8c";
  context.lineWidth = 1;

  for (let index = 0; index <= weekdays.length; index += 1) {
    const x = gridLeft + timeColumn + index * dayWidth;
    context.beginPath();
    context.moveTo(x, gridTop);
    context.lineTo(x, gridTop + gridHeight);
    context.stroke();
  }

  for (let index = 0; index <= previewHours.length; index += 1) {
    const y = gridTop + headerHeight + index * hourHeight;
    context.beginPath();
    context.moveTo(gridLeft, y);
    context.lineTo(gridLeft + gridWidth, y);
    context.stroke();
  }

  context.fillStyle = "#4e4e4e";
  context.font = "700 12px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("시간", gridLeft + timeColumn / 2, gridTop + headerHeight / 2);
  weekdays.forEach((day, index) => {
    context.fillText(dayLabels[day], gridLeft + timeColumn + index * dayWidth + dayWidth / 2, gridTop + headerHeight / 2);
  });

  context.font = "500 11px sans-serif";
  previewHours.forEach((hour, index) => {
    context.fillText(`${String(hour).padStart(2, "0")}:00`, gridLeft + timeColumn / 2, gridTop + headerHeight + index * hourHeight + hourHeight / 2);
  });

  mergeAdjacentClasses(timetable.classes.filter((item) => !isRemoteClass(item))).forEach((item) => {
    const dayIndex = weekdays.indexOf(item.dayOfWeek);
    const start = Math.max(toMinutes(item.startTime), previewHours[0] * 60);
    const end = Math.min(toMinutes(item.endTime), (previewHours[previewHours.length - 1] + 1) * 60);

    if (dayIndex < 0 || end <= start) {
      return;
    }

    const x = gridLeft + timeColumn + dayIndex * dayWidth + 3;
    const y = gridTop + headerHeight + ((start - previewHours[0] * 60) / 60) * hourHeight + 3;
    const blockWidth = dayWidth - 6;
    const blockHeight = ((end - start) / 60) * hourHeight - 6;
    drawRoundedRect(context, x, y, blockWidth, blockHeight, 5, item.color || "#8f6ab5");
    context.fillStyle = "#ffffff";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = "800 9px sans-serif";
    wrapCanvasText(context, item.courseName, x + 5, y + 5, blockWidth - 10, 11, Math.max(1, Math.floor((blockHeight - 18) / 11)));
    context.font = "500 8px sans-serif";
    const creditLabel = getClassCreditLabel(item);
    context.fillText(
      [`${item.startTime}-${item.endTime}`, creditLabel].filter(Boolean).join(" · "),
      x + 5,
      Math.min(y + blockHeight - 13, y + 5 + 24)
    );
  });

  drawOnlineLane(context, timetable, margin, onlineTop, width - margin * 2, onlineHeight);

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFileName(timetable.title || "timetable")}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function drawOnlineLane(context: CanvasRenderingContext2D, timetable: Timetable, x: number, y: number, width: number, height: number) {
  const onlineClasses = timetable.classes.filter(isRemoteClass);
  drawRoundedRect(context, x, y, width, height, 8, "#ffffff", "#e5ddeb");
  context.fillStyle = "#f1edf5";
  context.fillRect(x, y, 58, height);
  context.fillStyle = "#582f82";
  context.font = "800 10px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("온라인", x + 29, y + height / 2 - 6);
  context.fillText("강의", x + 29, y + height / 2 + 7);
  context.textAlign = "left";

  if (!onlineClasses.length) {
    context.fillStyle = "#75677f";
    context.font = "700 12px sans-serif";
    context.fillText("없음", x + 72, y + height / 2 - 6);
    return;
  }

  onlineClasses.slice(0, 3).forEach((item, index) => {
    const cardX = x + 68 + index * 92;
    drawRoundedRect(context, cardX, y + 10, 84, height - 20, 6, "rgba(88, 47, 130, 0.08)", "rgba(88, 47, 130, 0.22)");
    context.fillStyle = "#582f82";
    context.font = "800 9px sans-serif";
    wrapCanvasText(context, item.courseName, cardX + 6, y + 16, 72, 11, 2);
    const creditLabel = getClassCreditLabel(item);

    if (creditLabel) {
      context.fillStyle = "#75677f";
      context.font = "700 8px sans-serif";
      context.fillText(creditLabel, cardX + 6, y + height - 18);
    }
  });
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle?: string
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();

  if (strokeStyle) {
    context.strokeStyle = strokeStyle;
    context.stroke();
  }
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const chars = [...text];
  const lines: string[] = [];
  let line = "";

  chars.forEach((char) => {
    const nextLine = `${line}${char}`;

    if (context.measureText(nextLine).width <= maxWidth) {
      line = nextLine;
      return;
    }

    if (line) {
      lines.push(line);
    }
    line = char;
  });

  if (line) {
    lines.push(line);
  }

  lines.slice(0, maxLines).forEach((item, index) => {
    context.fillText(item, x, y + index * lineHeight);
  });
}

function sanitizeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "timetable";
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
