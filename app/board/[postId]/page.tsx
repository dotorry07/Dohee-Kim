"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getStoredUser } from "@/lib/auth/client";
import { getBoardPosts, saveBoardPosts } from "@/lib/board-storage";
import type { BoardPost } from "@/lib/types";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "새내기 Q&A",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

export default function BoardPostPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [focusedCommentId, setFocusedCommentId] = useState("");

  useEffect(() => {
    setPosts(getBoardPosts());
    setUser(getStoredUser());

    const nextFocusedCommentId = new URLSearchParams(window.location.search).get("commentId") ?? "";
    setFocusedCommentId(nextFocusedCommentId);
  }, []);

  const selectedPost = posts.find((post) => post.id === params.postId);
  const myPostCount = user ? posts.filter((post) => post.userId === user.id).length : 0;
  const myCommentCount = user ? posts.reduce((count, post) => count + post.comments.filter((item) => item.userId === user.id).length, 0) : 0;
  const recommendedPostCount = user ? posts.filter((post) => post.recommendedUserIds.includes(user.id)).length : 0;

  useEffect(() => {
    if (!selectedPost || !focusedCommentId) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(`comment-${focusedCommentId}`)?.scrollIntoView({ block: "center" });
    });
  }, [focusedCommentId, selectedPost]);

  function getActivityHref(view: "my-posts" | "my-comments" | "recommended") {
    return user ? `/board?view=${view}` : "/auth/login";
  }

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentUser = getStoredUser();
    if (!currentUser) {
      window.location.href = "/auth/login";
      return;
    }

    if (!comment.trim() || !selectedPost) {
      return;
    }

    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === selectedPost.id ? {
        ...post,
        comments: [
          ...post.comments,
          {
            id: `comment-${Date.now()}`,
            postId: post.id,
            userId: currentUser.id,
            authorName: currentUser.nickname,
            content: comment.trim(),
            createdAt: new Date().toISOString()
          }
        ]
      } : post);

      saveBoardPosts(nextPosts);
      return nextPosts;
    });
    setComment("");
  }

  function deleteSelectedPost() {
    if (!selectedPost || selectedPost.userId !== user?.id) {
      return;
    }

    setPosts((current) => {
      const nextPosts = current.filter((post) => post.id !== selectedPost.id);
      saveBoardPosts(nextPosts);
      return nextPosts;
    });
    router.push("/board");
  }

  function recommendPost() {
    const currentUser = getStoredUser();
    if (!currentUser) {
      window.location.href = "/auth/login";
      return;
    }

    if (!selectedPost || selectedPost.userId === currentUser.id || selectedPost.recommendedUserIds.includes(currentUser.id)) {
      return;
    }

    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === selectedPost.id ? {
        ...post,
        recommendCount: post.recommendCount + 1,
        recommendedUserIds: [...post.recommendedUserIds, currentUser.id],
        updatedAt: new Date().toISOString()
      } : post);

      saveBoardPosts(nextPosts);
      return nextPosts;
    });
  }

  if (!selectedPost) {
    return (
      <main className="page">
        <section className="panel">
          <div className="section-title">
            <h1>게시글을 찾을 수 없습니다</h1>
            <Link className="ghost-button" href="/board">목록</Link>
          </div>
          <p className="muted">삭제되었거나 존재하지 않는 게시글입니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="page-header">
        <Link className="ghost-button" href="/board">목록으로</Link>
      </section>

      <section className="board-post-layout">
        <article className="panel">
          <div className="section-title">
            <h1 className="board-post-title">{selectedPost.title}</h1>
            {selectedPost.userId === user?.id ? <button className="ghost-button" type="button" onClick={deleteSelectedPost}>삭제</button> : null}
          </div>
          <div className="meta">
            <span className="badge">{categoryLabels[selectedPost.category]}</span>
            <span>{selectedPost.authorName}</span>
            <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(selectedPost.createdAt))}</span>
            <span>조회 {selectedPost.viewCount}</span>
            <span className="recommend-meta">추천 {selectedPost.recommendCount}</span>
          </div>
          <p className="board-post-content">{selectedPost.content}</p>
        </article>

        <aside className="panel board-activity-box" aria-label="내 게시판 활동">
          <Link className="board-activity-link" href={getActivityHref("my-posts")}>
            <span>내가 쓴 글</span>
            <strong>{myPostCount}</strong>
          </Link>
          <Link className="board-activity-link" href={getActivityHref("my-comments")}>
            <span>내가 쓴 댓글</span>
            <strong>{myCommentCount}</strong>
          </Link>
          <Link className="board-activity-link" href={getActivityHref("recommended")}>
            <span>추천한 글</span>
            <strong>{recommendedPostCount}</strong>
          </Link>
        </aside>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="section-title">
          <h2>댓글 {selectedPost.comments.length}</h2>
        </div>
        <div className="list">
          {selectedPost.comments.map((item) => (
            <div className={focusedCommentId === item.id ? "list-item board-comment-item focused" : "list-item board-comment-item"} id={`comment-${item.id}`} key={item.id}>
              <strong>{item.authorName}</strong>
              <span>{item.content}</span>
            </div>
          ))}
          {selectedPost.comments.length === 0 ? <div className="list-item">아직 댓글이 없습니다.</div> : null}
        </div>
        <form className="form" onSubmit={addComment} style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor="comment">댓글</label>
            <input id="comment" value={comment} onChange={(event) => setComment(event.target.value)} />
          </div>
          <button className="button" type="submit">댓글 작성</button>
        </form>
      </section>

      <div className="board-recommend-bar">
        <button
          className="board-recommend-button"
          type="button"
          onClick={recommendPost}
          disabled={selectedPost.userId === user?.id || Boolean(user && selectedPost.recommendedUserIds.includes(user.id))}
        >
          추천 {selectedPost.recommendCount}
        </button>
      </div>
    </main>
  );
}
