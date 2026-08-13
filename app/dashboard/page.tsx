"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { academicEvents, campusMeals, freshmanChecklist } from "@/data/dashboardMock";
import { loadPersistentBoardPosts } from "@/lib/board-storage";
import { loadDashboardFromSupabase } from "@/lib/dashboard/supabase";
import { notices, posts } from "@/lib/data";
import type { Notice } from "@/lib/types";
import type { AcademicEvent, DashboardData, DashboardUser, DashboardViewData, MealCampus, MealMenu } from "@/types/dashboard";

const dashboardData: DashboardData = {
  timetables: [],
  notices,
  posts,
  academicEvents,
  personalTodaySchedules: [],
  campusMeals
};

export default function DashboardPage() {
  return <AuthGuard>{(user) => <ConnectedDashboard fallbackUser={user} />}</AuthGuard>;
}

function ConnectedDashboard({ fallbackUser }: { fallbackUser: DashboardUser }) {
  const [view, setView] = useState<DashboardViewData>({
    user: fallbackUser,
    data: dashboardData,
    checklistItems: freshmanChecklist,
    databaseUserId: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setView({ user: fallbackUser, data: dashboardData, checklistItems: freshmanChecklist, databaseUserId: null });

    void loadDashboardView(fallbackUser)
      .then((result) => {
        if (active) {
          setView(result);
        }
      })
      .catch(() => {
        if (active) {
          setView({ user: fallbackUser, data: dashboardData, checklistItems: freshmanChecklist, databaseUserId: null });
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fallbackUser]);

  return <DashboardContent user={view.user} data={view.data} checklistItems={view.checklistItems} databaseUserId={view.databaseUserId} isLoading={isLoading} />;
}

async function loadDashboardView(fallbackUser: DashboardUser): Promise<DashboardViewData> {
  const [baseView, liveData] = await Promise.all([
    loadDashboardFromSupabase(fallbackUser, dashboardData, freshmanChecklist),
    loadDashboardLiveData()
  ]);

  return {
    ...baseView,
    data: {
      ...baseView.data,
      notices: liveData.notices,
      posts: liveData.posts,
      academicEvents: liveData.academicEvents,
      campusMeals: liveData.campusMeals
    }
  };
}

async function loadDashboardLiveData(): Promise<Pick<DashboardData, "notices" | "posts" | "academicEvents" | "campusMeals">> {
  const [remoteNotices, remotePosts, referenceData] = await Promise.all([
    loadNoticePageNotices(),
    loadPersistentBoardPosts(),
    loadDashboardReferenceData()
  ]);

  return {
    notices: remoteNotices.length ? remoteNotices : dashboardData.notices,
    posts: remotePosts.length ? remotePosts : dashboardData.posts,
    academicEvents: referenceData.academicEvents.length ? referenceData.academicEvents : dashboardData.academicEvents,
    campusMeals: referenceData.campusMeals.sujeong && referenceData.campusMeals.unjeong
      ? referenceData.campusMeals as Record<MealCampus, MealMenu>
      : dashboardData.campusMeals
  };
}

async function loadNoticePageNotices() {
  try {
    const response = await fetch("/api/notices", { cache: "no-store" });
    if (!response.ok) return [];

    const body = await response.json() as { notices?: Notice[] };
    return Array.isArray(body.notices) ? body.notices : [];
  } catch {
    return [];
  }
}

async function loadDashboardReferenceData() {
  try {
    const response = await fetch("/api/dashboard-reference", { cache: "no-store" });
    if (!response.ok) return { academicEvents: [] as AcademicEvent[], campusMeals: {} as Partial<Record<MealCampus, MealMenu>> };

    const body = await response.json() as {
      academicEvents?: AcademicEvent[];
      campusMeals?: Partial<Record<MealCampus, MealMenu>>;
    };
    return {
      academicEvents: Array.isArray(body.academicEvents) ? body.academicEvents : [],
      campusMeals: body.campusMeals ?? {}
    };
  } catch {
    return { academicEvents: [] as AcademicEvent[], campusMeals: {} as Partial<Record<MealCampus, MealMenu>> };
  }
}
