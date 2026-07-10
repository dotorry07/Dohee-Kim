import { NextResponse } from "next/server";
import { demoUser } from "@/lib/data";

export function GET() {
  return NextResponse.json({ user: demoUser });
}
