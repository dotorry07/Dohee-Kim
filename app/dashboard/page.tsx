"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  return <AuthGuard>{(user) => <DashboardContent user={user} />}</AuthGuard>;
}
