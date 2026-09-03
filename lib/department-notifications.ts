"use client";

import { getAuthProvider } from "@/lib/auth/config";
import type { Notice, UserProfile } from "@/lib/types";

export type DepartmentNotificationTarget = "primary" | "secondary";

export interface DepartmentNotificationPreferences {
  primaryEnabled: boolean;
  secondaryEnabled: boolean;
  enabledAt: Partial<Record<DepartmentNotificationTarget, string>>;
  notifiedNoticeIds: string[];
}

const eventName = "newbie-on-department-notifications-changed";
const remotePreferenceKey = "department_notifications";

const defaultPreferences: DepartmentNotificationPreferences = {
  primaryEnabled: false,
  secondaryEnabled: false,
  enabledAt: {},
  notifiedNoticeIds: []
};

function storageKey(userId: string) {
  return `newbie-on:department-notifications:${userId}`;
}

export function getDepartmentNotificationPreferences(userId: string): DepartmentNotificationPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return normalizeDepartmentNotificationPreferences(raw ? JSON.parse(raw) : {});
  } catch {
    return defaultPreferences;
  }
}

export async function loadDepartmentNotificationPreferences(user: UserProfile) {
  const local = getDepartmentNotificationPreferences(user.id);

  if (getAuthProvider() === "mock") {
    return local;
  }

  try {
    const response = await fetch("/api/timetable-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user })
    });

    if (!response.ok) {
      return local;
    }

    const body = await response.json() as { preferences?: Record<string, unknown> };
    if (!body.preferences || !(remotePreferenceKey in body.preferences)) {
      return local;
    }

    const remote = normalizeDepartmentNotificationPreferences(body.preferences[remotePreferenceKey]);
    saveDepartmentNotificationPreferences(user.id, remote, { notifySubscribers: false });
    return remote;
  } catch {
    return local;
  }
}

export function updateDepartmentNotificationPreference(
  user: UserProfile,
  target: DepartmentNotificationTarget,
  enabled: boolean
) {
  const current = getDepartmentNotificationPreferences(user.id);
  const enabledKey = target === "primary" ? "primaryEnabled" : "secondaryEnabled";
  const next: DepartmentNotificationPreferences = {
    ...current,
    [enabledKey]: enabled,
    enabledAt: {
      ...current.enabledAt,
      [target]: enabled ? current.enabledAt[target] ?? new Date().toISOString() : undefined
    }
  };

  saveDepartmentNotificationPreferences(user.id, next);
  void saveRemoteDepartmentNotificationPreferences(user, next);
  return next;
}

export function getSubscribedDepartments(user: UserProfile, preferences = getDepartmentNotificationPreferences(user.id)) {
  const departments: { target: DepartmentNotificationTarget; name: string; enabledAt?: string }[] = [];

  if (preferences.primaryEnabled && user.department) {
    departments.push({ target: "primary", name: user.department, enabledAt: preferences.enabledAt.primary });
  }

  if (preferences.secondaryEnabled && user.secondaryDepartment) {
    departments.push({ target: "secondary", name: user.secondaryDepartment, enabledAt: preferences.enabledAt.secondary });
  }

  return departments;
}

export function getNewDepartmentNotificationItems(
  notices: Notice[],
  enabledAt: string | undefined,
  preferences: DepartmentNotificationPreferences
) {
  const notifiedIds = new Set(preferences.notifiedNoticeIds);

  return getDepartmentNoticesAfterEnabledAt(notices, enabledAt).filter((notice) => !notifiedIds.has(notice.id));
}

export function getDepartmentNoticesAfterEnabledAt(
  notices: Notice[],
  enabledAt: string | undefined
) {
  const enabledAtTime = enabledAt ? Date.parse(enabledAt) : 0;

  return notices.filter((notice) => (
    Date.parse(notice.publishedAt) >= enabledAtTime
  ));
}

export function markDepartmentNoticesNotified(userId: string, noticeIds: string[]) {
  if (noticeIds.length === 0) {
    return getDepartmentNotificationPreferences(userId);
  }

  const current = getDepartmentNotificationPreferences(userId);
  const nextIds = new Set(current.notifiedNoticeIds);
  noticeIds.forEach((noticeId) => nextIds.add(noticeId));

  const next = {
    ...current,
    notifiedNoticeIds: [...nextIds].slice(-300)
  };

  saveDepartmentNotificationPreferences(userId, next, { notifySubscribers: false });
  return next;
}

export function subscribeToDepartmentNotificationPreferences(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", callback);
  };
}

function saveDepartmentNotificationPreferences(
  userId: string,
  preferences: DepartmentNotificationPreferences,
  options: { notifySubscribers?: boolean } = {}
) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(preferences));
  if (options.notifySubscribers ?? true) {
    window.dispatchEvent(new Event(eventName));
  }
}

async function saveRemoteDepartmentNotificationPreferences(
  user: UserProfile,
  preferences: DepartmentNotificationPreferences
) {
  if (getAuthProvider() === "mock") return;

  try {
    await fetch("/api/timetable-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user,
        preferences: {
          [remotePreferenceKey]: preferences
        }
      })
    });
  } catch {
    // Local state keeps the app usable when Supabase is unavailable.
  }
}

function normalizeDepartmentNotificationPreferences(value: unknown): DepartmentNotificationPreferences {
  const parsed = value && typeof value === "object" ? value as Partial<DepartmentNotificationPreferences> : {};
  const enabledAt = parsed.enabledAt && typeof parsed.enabledAt === "object" ? parsed.enabledAt : {};
  const now = new Date().toISOString();
  const primaryEnabled = Boolean(parsed.primaryEnabled);
  const secondaryEnabled = Boolean(parsed.secondaryEnabled);

  return {
    primaryEnabled,
    secondaryEnabled,
    enabledAt: {
      ...enabledAt,
      primary: primaryEnabled ? enabledAt.primary ?? now : undefined,
      secondary: secondaryEnabled ? enabledAt.secondary ?? now : undefined
    },
    notifiedNoticeIds: Array.isArray(parsed.notifiedNoticeIds)
      ? parsed.notifiedNoticeIds.filter((item): item is string => typeof item === "string")
      : []
  };
}
