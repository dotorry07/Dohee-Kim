import { NextResponse } from "next/server";
import { readBoardPosts, writeBoardPosts } from "@/lib/server/board-database";
import type { BoardPost } from "@/lib/types";

export const dynamic = "force-dynamic";

function getBoardStateErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "code" in error && error.code === "PGRST205") {
    return "Supabase 게시판 테이블이 아직 생성되지 않았습니다. supabase/migrations/202608100001_board_state.sql을 Supabase SQL Editor에 적용하세요.";
  }

  return null;
}

export async function GET() {
  try {
    return NextResponse.json({ posts: await readBoardPosts() });
  } catch (error) {
    console.error("Failed to read board state from Supabase.", error);
    return NextResponse.json({ message: getBoardStateErrorMessage(error) ?? "게시판 DB를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.posts)) {
    return NextResponse.json({ message: "게시판 데이터 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    await writeBoardPosts(body.posts as BoardPost[]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to write board state to Supabase.", error);
    return NextResponse.json({ message: getBoardStateErrorMessage(error) ?? "게시판 DB에 저장하지 못했습니다." }, { status: 500 });
  }
}
