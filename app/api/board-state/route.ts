import { NextResponse } from "next/server";
import { readBoardPosts, writeBoardPosts } from "@/lib/server/board-database";
import type { BoardPost } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ posts: readBoardPosts() });
  } catch {
    return NextResponse.json({ message: "게시판 DB를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.posts)) {
    return NextResponse.json({ message: "게시판 데이터 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    writeBoardPosts(body.posts as BoardPost[]);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "게시판 DB에 저장하지 못했습니다." }, { status: 500 });
  }
}
