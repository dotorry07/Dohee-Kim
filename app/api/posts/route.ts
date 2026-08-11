import { NextResponse } from "next/server";
import { readBoardPosts, writeBoardPosts } from "@/lib/server/board-database";
import type { BoardPost } from "@/lib/types";

export const dynamic = "force-dynamic";

function getBoardApiErrorResponse(error: unknown) {
  console.error("Failed to access board posts in Supabase.", error);
  return NextResponse.json({ message: "게시판 DB 처리 중 오류가 발생했습니다." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() ?? "";
    const category = searchParams.get("category");
    const items = (await readBoardPosts())
      .filter((post) => !category || category === "all" || post.category === category)
      .filter((post) => !query || `${post.title} ${post.content}`.toLowerCase().includes(query))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

    return NextResponse.json({ posts: items });
  } catch (error) {
    return getBoardApiErrorResponse(error);
  }
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

  try {
    const posts = await readBoardPosts();
    await writeBoardPosts([post, ...posts]);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    return getBoardApiErrorResponse(error);
  }
}
