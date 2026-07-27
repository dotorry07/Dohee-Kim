import { NextResponse } from "next/server";
import { demoUser, posts } from "@/lib/data";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const category = searchParams.get("category");

  const items = posts
    .filter((post) => !category || category === "all" || post.category === category)
    .filter((post) => !query || `${post.title} ${post.content}`.toLowerCase().includes(query))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return NextResponse.json({ posts: items });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (!body.title || !body.content) {
    return NextResponse.json({ message: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  return NextResponse.json({
    post: {
      id: `post-${Date.now()}`,
      userId: demoUser.id,
      authorName: demoUser.nickname,
      category: body.category ?? "freshman",
      title: body.title,
      content: body.content,
      viewCount: 0,
      recommendCount: 0,
      recommendedUserIds: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }, { status: 201 });
}
