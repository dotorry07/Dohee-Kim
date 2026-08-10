import { NextResponse } from "next/server";
import { getBoardPostStore } from "@/lib/server/board-store";
import type { BoardPost } from "@/lib/types";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category");
  const items = getBoardPostStore()
    .filter((post) => !category || category === "all" || post.category === category)
    .filter((post) => !query || `${post.title} ${post.content}`.toLowerCase().includes(query))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return NextResponse.json({ posts: items });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = request.headers.get("x-user-id");
  if (!body.title?.trim() || !body.content?.trim() || !userId || !body.authorName) {
    return NextResponse.json({ message: "제목과 내용을 입력해 주세요." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const post: BoardPost = {
    id: `post-${Date.now()}`,
    userId,
    authorName: body.authorName,
    category: body.category ?? "freshman",
    title: body.title.trim(),
    content: body.content.trim(),
    viewCount: 0,
    recommendCount: 0,
    recommendedUserIds: [],
    comments: [],
    createdAt: now,
    updatedAt: now
  };

  getBoardPostStore().unshift(post);
  return NextResponse.json({ post }, { status: 201 });
}
