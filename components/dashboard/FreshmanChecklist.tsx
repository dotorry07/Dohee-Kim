"use client";

import { useEffect, useState } from "react";
import { freshmanChecklist } from "@/data/dashboardMock";
import type { ChecklistItem } from "@/types/dashboard";
import styles from "@/app/dashboard/Dashboard.module.css";

function storageKey(userId: string) { return `newbie-on:dashboard-checklist:${userId}`; }

export function FreshmanChecklist({ userId }: { userId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>(freshmanChecklist);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey(userId));
      if (saved) setItems(JSON.parse(saved) as ChecklistItem[]);
    } catch { /* 저장소를 사용할 수 없으면 현재 세션 상태를 유지합니다. */ }
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(storageKey(userId), JSON.stringify(items)); } catch { /* no-op */ }
  }, [items, ready, userId]);

  const completed = items.filter((item) => item.completed).length;
  const percent = items.length ? Math.round((completed / items.length) * 100) : 0;

  return (
    <article className={`${styles.card} ${styles.checklist}`}>
      <div className={styles.cardHeading}><div><p className={styles.eyebrow}>START GUIDE</p><h2>새내기 필수 체크리스트</h2></div><strong className={styles.progressText}>{completed}/{items.length} 완료</strong></div>
      <div className={styles.progressMeta}><span>입학 준비 진행률</span><span>{percent}%</span></div>
      <div className={styles.progressTrack} role="progressbar" aria-label="새내기 체크리스트 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
      <div className={styles.checkList}>
        {items.map((item) => (
          <div className={`${styles.checkItem} ${item.completed ? styles.checked : ""}`} key={item.id}>
            <input id={`check-${item.id}`} type="checkbox" checked={item.completed} onChange={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry))} />
            <label htmlFor={`check-${item.id}`}>{item.label}</label>
          </div>
        ))}
      </div>
    </article>
  );
}
