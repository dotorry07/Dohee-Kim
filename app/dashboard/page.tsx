"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { academicEvents, campusMeals, freshmanChecklist } from "@/data/dashboardMock";
import { loadPersistentBoardPosts } from "@/lib/board-storage";
import { loadDashboardFromSupabase } from "@/lib/dashboard/supabase";
import { notices, posts } from "@/lib/data";
import type { Notice } from "@/lib/types";
import type { DashboardData, DashboardUser, DashboardViewData } from "@/types/dashboard";

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

  useEffect(() => {
    let active = true;
    setView({ user: fallbackUser, data: dashboardData, checklistItems: freshmanChecklist, databaseUserId: null });

    void loadDashboardView(fallbackUser).then((result) => {
      if (active) {
        setView(result);
      }
    });

    return () => {
      active = false;
    };
  }, [fallbackUser]);

  return <DashboardContent user={view.user} data={view.data} checklistItems={view.checklistItems} databaseUserId={view.databaseUserId} />;
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
      posts: liveData.posts
    }
  };
}

async function loadDashboardLiveData(): Promise<Pick<DashboardData, "notices" | "posts">> {
  const [remoteNotices, remotePosts] = await Promise.all([
    loadNoticePageNotices(),
    loadPersistentBoardPosts()
  ]);

  return {
    notices: remoteNotices.length ? remoteNotices : dashboardData.notices,
    posts: remotePosts.length ? remotePosts : dashboardData.posts
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
