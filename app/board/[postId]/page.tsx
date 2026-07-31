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
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    category: "freshman" as BoardPost["category"],
    title: "",
    content: ""
  });

  useEffect(() => {
    setPosts(getBoardPosts());
    setUser(getStoredUser());

    const nextFocusedCommentId = new URLSearchParams(window.location.search).get("commentId") ?? "";
    setFocusedCommentId(nextFocusedCommentId);
  }, []);

  const selectedPost = posts.find((post) => post.id === params.postId);

  useEffect(() => {
    if (!selectedPost || !focusedCommentId) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(`comment-${focusedCommentId}`)?.scrollIntoView({ block: "center" });
    });
  }, [focusedCommentId, selectedPost]);

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

  function startEditing() {
    if (!selectedPost || selectedPost.userId !== user?.id) {
      return;
    }

    setEditForm({
      category: selectedPost.category,
      title: selectedPost.title,
      content: selectedPost.content
    });
    setEditError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditError("");
    setIsEditing(false);
  }

  function updateSelectedPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost || selectedPost.userId !== user?.id) {
      return;
    }

    if (!editForm.title.trim() || !editForm.content.trim()) {
      setEditError("제목과 내용을 입력해주세요.");
      return;
    }

    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === selectedPost.id ? {
        ...post,
        category: editForm.category,
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        updatedAt: new Date().toISOString()
      } : post);

      saveBoardPosts(nextPosts);
      return nextPosts;
    });
    setEditError("");
    setIsEditing(false);
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

      <section>
        <article className="panel">
          {isEditing ? (
            <form className="form board-edit-form" onSubmit={updateSelectedPost}>
              <div className="section-title">
                <h1 className="board-post-title">게시글 수정</h1>
                <button className="ghost-button" type="button" onClick={cancelEditing}>취소</button>
              </div>
              <div className="field">
                <label htmlFor="edit-post-category">카테고리</label>
                <select
                  id="edit-post-category"
                  value={editForm.category}
                  onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value as BoardPost["category"] }))}
                >
                  {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="edit-post-title">제목</label>
                <input
                  id="edit-post-title"
                  value={editForm.title}
                  onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                />
              </div>
              <div className="field board-content-field">
                <label htmlFor="edit-post-content">내용</label>
                <textarea
                  id="edit-post-content"
                  value={editForm.content}
                  onChange={(event) => setEditForm((current) => ({ ...current, content: event.target.value }))}
                />
              </div>
              {editError ? <div className="error">{editError}</div> : null}
              <button className="button board-edit-submit-button" type="submit">저장</button>
            </form>
          ) : (
            <>
              <div className="section-title">
                <h1 className="board-post-title">{selectedPost.title}</h1>
                {selectedPost.userId === user?.id ? (
                  <div className="board-post-actions">
                    <button className="ghost-button" type="button" onClick={startEditing}>수정</button>
                    <button className="ghost-button" type="button" onClick={deleteSelectedPost}>삭제</button>
                  </div>
                ) : null}
              </div>
              <div className="meta">
                <span className="badge">{categoryLabels[selectedPost.category]}</span>
                <span>{selectedPost.authorName}</span>
                <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(selectedPost.createdAt))}</span>
                <span>조회 {selectedPost.viewCount}</span>
                <span className="recommend-meta">추천 {selectedPost.recommendCount}</span>
              </div>
              <p className="board-post-content">{selectedPost.content}</p>
            </>
          )}
        </article>
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
