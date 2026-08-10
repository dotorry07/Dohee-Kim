"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { academicEvents, campusMeals, freshmanChecklist, personalTodaySchedules } from "@/data/dashboardMock";
import { loadDashboardFromSupabase } from "@/lib/dashboard/supabase";
import { notices, posts } from "@/lib/data";
import type { DashboardData, DashboardUser, DashboardViewData } from "@/types/dashboard";

const dashboardData: DashboardData = {
  timetables: [],
  notices,
  posts,
  academicEvents,
  personalTodaySchedules,
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

    void loadDashboardFromSupabase(fallbackUser, dashboardData, freshmanChecklist).then((result) => {
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
