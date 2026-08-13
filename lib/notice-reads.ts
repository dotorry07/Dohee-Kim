"use client";

import type { UserProfile } from "@/lib/types";

const storageKey = (userId: string) => `newbie-on:notice-reads:${userId}`;
const eventName = "newbie-on-notice-reads-changed";

export function getLocalNoticeReads(userId: string) {
  try {
    const stored = window.localStorage.getItem(storageKey(userId));
    const parsed = stored ? JSON.parse(stored) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export async function loadNoticeReads(user: UserProfile) {
  const local = getLocalNoticeReads(user.id);
  try {
    const response = await fetch("/api/notice-reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user })
    });
    if (!response.ok) return local;
    const body = await response.json() as { noticeIds?: string[] };
    const remote = new Set(body.noticeIds ?? []);
    saveLocalNoticeReads(user.id, remote);
    return remote;
  } catch {
    return local;
  }
}

export async function markNoticeRead(user: UserProfile, noticeId: string) {
  const next = getLocalNoticeReads(user.id);
  next.add(noticeId);
  saveLocalNoticeReads(user.id, next);
  try {
    await fetch("/api/notice-reads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, noticeId })
    });
  } catch {
    // Local state keeps the UI responsive when Supabase is unavailable.
  }
}

export function subscribeToNoticeReads(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", callback);
  };
}

function saveLocalNoticeReads(userId: string, noticeIds: Set<string>) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify([...noticeIds]));
  window.dispatchEvent(new Event(eventName));
}
