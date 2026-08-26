"use client";

import { getAuthProvider } from "@/lib/auth/config";
import type { Timetable, UserProfile } from "@/lib/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const localTimetablesKey = "newbie-on:timetables";

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export async function loadRemoteTimetables(user: UserProfile) {
  if (getAuthProvider() === "mock") {
    return loadLocalTimetables();
  }

  const response = await fetch("/api/timetables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list", user })
  });

  if (!response.ok) {
    if (response.status === 424) {
      return [];
    }

    throw new Error(await getErrorMessage(response, "Failed to load timetables."));
  }

  const body = await response.json() as { timetables: Timetable[] };
  return body.timetables;
}

export async function saveRemoteTimetable(user: UserProfile, timetable: Timetable) {
  if (getAuthProvider() === "mock") {
    const timetables = loadLocalTimetables();
    const next = [timetable, ...timetables.filter((item) => item.id !== timetable.id)];
    saveLocalTimetables(next);
    return timetable;
  }

  const response = await fetch("/api/timetables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", user, timetable })
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to save timetable."));
  }

  const body = await response.json() as { timetable: Timetable };
  return body.timetable;
}

export async function deleteRemoteTimetable(user: UserProfile, timetableId: string) {
  if (getAuthProvider() === "mock") {
    saveLocalTimetables(loadLocalTimetables().filter((item) => item.id !== timetableId));
    return;
  }

  if (!isUuid(timetableId)) {
    return;
  }

  const response = await fetch("/api/timetables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", user, timetableId })
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete timetable."));
  }
}

export async function selectRemoteMonthlyTimetable(user: UserProfile, timetableId: string, semester: string) {
  if (getAuthProvider() === "mock") {
    saveLocalTimetables(loadLocalTimetables().map((timetable) => (
      timetable.semester === semester
        ? { ...timetable, isSelected: timetable.id === timetableId }
        : timetable
    )));
    return;
  }

  if (!isUuid(timetableId)) {
    return;
  }

  const response = await fetch("/api/timetables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "select-monthly", user, timetableId, semester })
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to select monthly timetable."));
  }
}

function loadLocalTimetables() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(localTimetablesKey);
    const parsed = stored ? JSON.parse(stored) as unknown : [];
    return Array.isArray(parsed) ? parsed as Timetable[] : [];
  } catch {
    window.localStorage.removeItem(localTimetablesKey);
    return [];
  }
}

function saveLocalTimetables(timetables: Timetable[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localTimetablesKey, JSON.stringify(timetables));
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json() as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}
