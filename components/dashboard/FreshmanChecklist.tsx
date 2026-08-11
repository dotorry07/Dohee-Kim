"use client";

import { useEffect, useState } from "react";
import { freshmanChecklist } from "@/data/dashboardMock";
import { saveChecklistItem } from "@/lib/dashboard/supabase";
import type { ChecklistItem } from "@/types/dashboard";
import styles from "@/app/dashboard/Dashboard.module.css";

function storageKey(userId: string) { return `newbie-on:dashboard-checklist:${userId}`; }
function mergeChecklistState(items: ChecklistItem[]) {
  const completionById = new Map(items.map((item) => [item.id, item.completed]));
  return freshmanChecklist.map((item) => ({ ...item, completed: completionById.get(item.id) ?? false }));
}

export function FreshmanChecklist({ userId, databaseUserId, initialItems = freshmanChecklist, isLoading = false }: { userId: string; databaseUserId: string | null; initialItems?: ChecklistItem[]; isLoading?: boolean }) {
  const [items, setItems] = useState<ChecklistItem[]>(() => mergeChecklistState(initialItems));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(mergeChecklistState(initialItems));
  }, [initialItems]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey(userId));
      if (saved) setItems(mergeChecklistState(JSON.parse(saved) as ChecklistItem[]));
    } catch { /* 저장소를 사용할 수 없으면 현재 세션 상태를 유지합니다. */ }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(storageKey(userId), JSON.stringify(items)); } catch { /* no-op */ }
  }, [items, ready, userId]);

  const completed = items.filter((item) => item.completed).length;
  const percent = items.length ? Math.round((completed / items.length) * 100) : 0;

  function toggleItem(itemId: string) {
    setItems((current) => current.map((entry) => {
      if (entry.id !== itemId) return entry;
      const updated = { ...entry, completed: !entry.completed };
      if (databaseUserId) void saveChecklistItem(databaseUserId, updated);
      return updated;
    }));
  }

  return (
    <article className={`${styles.card} ${styles.checklist}`}>
      <div className={styles.cardHeading}><div><p className={styles.eyebrow}>START GUIDE</p><h2>새내기 필수 체크리스트</h2></div><strong className={styles.progressText}>{isLoading ? "로딩 중" : `${completed}/${items.length} 완료`}</strong></div>
      {isLoading ? (
        <div className={styles.cardLoading} role="status" aria-live="polite">
          <span className={styles.loadingSpinner} aria-hidden="true" />
          <span>로딩중입니다...</span>
        </div>
      ) : (
        <>
          <div className={styles.progressMeta}><span>입학 준비 진행률</span><span>{percent}%</span></div>
          <div className={styles.progressTrack} role="progressbar" aria-label="새내기 체크리스트 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
          <div className={styles.checkList}>
            {items.map((item) => (
              <div className={`${styles.checkItem} ${item.completed ? styles.checked : ""}`} key={item.id}>
                <input id={`check-${item.id}`} type="checkbox" checked={item.completed} onChange={() => toggleItem(item.id)} />
                <label htmlFor={`check-${item.id}`}>{item.label}</label>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
