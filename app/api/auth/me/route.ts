import { NextResponse } from "next/server";
import type { UserProfile } from "@/lib/types";

const demoUser: UserProfile = {
  id: "user-1",
  authUserId: "auth-demo",
  email: "freshman@sungshin.ac.kr",
  name: "김새내",
  nickname: "새내기",
  department: "컴퓨터공학과",
  grade: 1,
  role: "user",
  createdAt: "2026-03-01T09:00:00.000Z"
};

export function GET() {
  return NextResponse.json({ user: demoUser });
}
