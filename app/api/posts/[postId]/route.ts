import { NextResponse } from "next/server";
import { getBoardPostStore } from "@/lib/server/board-store";

type RouteContext = { params: { postId: string } };

export function GET(request: Request, { params }: RouteContext) {
  const post = getBoardPostStore().find((item) => item.id === params.postId);
  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });

  if (new URL(request.url).searchParams.get("incrementView") === "true") {
    post.viewCount += 1;
  }
  return NextResponse.json({ post });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const body = await request.json().catch(() => ({}));
  const userId = request.headers.get("x-user-id");
  const post = getBoardPostStore().find((item) => item.id === params.postId);
  if (!post) return NextResponse.json({ message: "Post not found." }, { status: 404 });
  if (!userId) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  if (body.action === "update") {
    if (post.userId !== userId) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json({ message: "Title and content are required." }, { status: 400 });
    }
    post.category = body.category ?? post.category;
    post.title = body.title.trim();
    post.content = body.content.trim();
  } else if (body.action === "comment") {
    if (!body.content?.trim() || !body.authorName) {
      return NextResponse.json({ message: "Comment content is required." }, { status: 400 });
    }
    post.comments.push({ id: `comment-${Date.now()}`, postId: post.id, userId, authorName: body.authorName, content: body.content.trim(), createdAt: new Date().toISOString() });
  } else if (body.action === "delete-comment") {
    const index = post.comments.findIndex((comment) => comment.id === body.commentId);
    if (index < 0) return NextResponse.json({ message: "Comment not found." }, { status: 404 });
    if (post.comments[index].userId !== userId) return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    post.comments.splice(index, 1);
  } else if (body.action === "recommend") {
    if (post.userId === userId || post.recommendedUserIds.includes(userId)) {
      return NextResponse.json({ message: "This post cannot be recommended." }, { status: 409 });
    }
    post.recommendedUserIds.push(userId);
    post.recommendCount = post.recommendedUserIds.length;
  } else {
    return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
  }

  post.updatedAt = new Date().toISOString();
  return NextResponse.json({ post });
}

export function DELETE(request: Request, { params }: RouteContext) {
  const userId = request.headers.get("x-user-id");
  const posts = getBoardPostStore();
  const index = posts.findIndex((post) => post.id === params.postId);
  if (index < 0) return NextResponse.json({ message: "Post not found." }, { status: 404 });
  if (!userId) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  if (posts[index].userId !== userId) return NextResponse.json({ message: "Forbidden." }, { status: 403 });

  posts.splice(index, 1);
  return new NextResponse(null, { status: 204 });
}
