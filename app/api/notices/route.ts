import { NextResponse } from "next/server";
import { notices } from "@/lib/data";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category");

  const items = notices
    .filter((notice) => !category || category === "all" || notice.category === category)
    .filter((notice) => !query || `${notice.title} ${notice.summary}`.toLowerCase().includes(query))
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  return NextResponse.json({ notices: items });
}
