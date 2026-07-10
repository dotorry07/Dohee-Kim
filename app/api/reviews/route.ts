import { NextResponse } from "next/server";
import { courseReviews, demoUser } from "@/lib/data";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const reviews = courseReviews.filter((review) => !query || `${review.courseName} ${review.professorName}`.toLowerCase().includes(query));

  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.courseName || !body.professorName || !body.content) {
    return NextResponse.json({ message: "강의명, 교수명, 자유 후기를 입력해주세요." }, { status: 400 });
  }

  const duplicate = courseReviews.some((review) =>
    review.userId === demoUser.id &&
    review.courseName === body.courseName &&
    review.professorName === body.professorName
  );

  if (duplicate) {
    return NextResponse.json({ message: "같은 강의평은 한 번만 작성할 수 있습니다." }, { status: 409 });
  }

  return NextResponse.json({
    review: {
      id: `review-${Date.now()}`,
      userId: demoUser.id,
      courseName: body.courseName,
      professorName: body.professorName,
      semester: body.semester ?? "2026-1",
      rating: Number(body.rating ?? 5),
      assignmentLevel: body.assignmentLevel ?? "medium",
      examLevel: body.examLevel ?? "medium",
      attendanceType: body.attendanceType ?? "전자출결",
      content: body.content,
      createdAt: new Date().toISOString()
    }
  }, { status: 201 });
}
