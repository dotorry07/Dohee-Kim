"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BoardAuthorMenu } from "@/components/board-author-menu";
import { getStoredUser } from "@/lib/auth/client";
import { getBoardPosts, loadPersistentBoardPosts, saveBoardPosts, subscribeToBoardPosts } from "@/lib/board-storage";
import type { BoardPost } from "@/lib/types";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "자유게시판",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

const availableCategories: BoardPost["category"][] = ["free", "department", "info"];
const commentCooldownMs = 3000;
const lastCommentAtKey = "newbie-on-board-last-comment-at";

type BoardPostWithImage = BoardPost & {
  image?: {
    dataUrl: string;
    name: string;
  };
};

export default function BoardPostPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [focusedCommentId, setFocusedCommentId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState({ category: "free" as BoardPost["category"], title: "", content: "" });
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isPostDeleteConfirmOpen, setIsPostDeleteConfirmOpen] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState("");
  const viewCountRequested = useRef(false);

  useEffect(() => {
    setPosts(getBoardPosts());
    void loadPersistentBoardPosts().then(setPosts);
    setUser(getStoredUser());
    setFocusedCommentId(new URLSearchParams(window.location.search).get("commentId") ?? "");
    return subscribeToBoardPosts(setPosts);
  }, []);

  const selectedPost = posts.find((post) => post.id === params.postId);
  const attachedImage = (selectedPost as BoardPostWithImage | undefined)?.image;

  useEffect(() => {
    if (!params.postId || !selectedPost || viewCountRequested.current) {
      return;
    }

    viewCountRequested.current = true;
    const viewedKey = `newbie-on-board-viewed:${params.postId}`;
    if (window.sessionStorage.getItem(viewedKey)) {
      return;
    }

    window.sessionStorage.setItem(viewedKey, "true");
    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === params.postId ? { ...post, viewCount: post.viewCount + 1 } : post);
      void saveBoardPosts(nextPosts);
      return nextPosts;
    });
  }, [params.postId, selectedPost]);

  useEffect(() => {
    if (!selectedPost || !focusedCommentId) {
      return;
    }

    window.requestAnimationFrame(() => {
      document.getElementById(`comment-${focusedCommentId}`)?.scrollIntoView({ block: "center" });
    });
  }, [focusedCommentId, selectedPost]);

  async function persistPosts(nextPosts: BoardPost[]) {
    const saved = await saveBoardPosts(nextPosts);
    if (!saved) {
      setError("변경사항을 DB에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
    return saved;
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentUser = getStoredUser();

    if (!currentUser) {
      window.location.href = "/auth/login";
      return;
    }

    if (!comment.trim() || !selectedPost) {
      return;
    }

    if (comment.trim().length > 1000) {
      setError("댓글은 1,000자 이내로 작성해 주세요.");
      return;
    }

    const lastCommentAt = Number(window.localStorage.getItem(lastCommentAtKey) ?? 0);
    if (Date.now() - lastCommentAt < commentCooldownMs) {
      setError("연속 댓글 작성은 3초 후에 다시 시도해 주세요.");
      return;
    }

    const now = new Date().toISOString();
    const nextPosts = posts.map((post) => post.id === selectedPost.id ? {
      ...post,
      comments: [...post.comments, {
        id: `comment-${crypto.randomUUID()}`,
        postId: post.id,
        userId: currentUser.id,
        authorName: currentUser.nickname,
        content: comment.trim(),
        createdAt: now
      }],
      updatedAt: now
    } : post);

    setPosts(nextPosts);
    await persistPosts(nextPosts);
    window.localStorage.setItem(lastCommentAtKey, String(Date.now()));
    setComment("");
    setError("");
  }

  function requestDeleteSelectedPost() {
    if (!selectedPost || selectedPost.userId !== user?.id) {
      return;
    }

    setIsPostDeleteConfirmOpen(true);
  }

  async function confirmDeleteSelectedPost() {
    if (!selectedPost || selectedPost.userId !== user?.id) {
      setIsPostDeleteConfirmOpen(false);
      return;
    }

    const nextPosts = posts.filter((post) => post.id !== selectedPost.id);
    setPosts(nextPosts);
    setIsPostDeleteConfirmOpen(false);
    const saved = await persistPosts(nextPosts);
    if (saved) {
      router.push("/board");
    }
  }

  function startEditing() {
    if (!selectedPost || selectedPost.userId !== user?.id) {
      return;
    }

    setEditForm({
      category: selectedPost.category === "freshman" ? "free" : selectedPost.category,
      title: selectedPost.title,
      content: selectedPost.content
    });
    setError("");
    setIsEditing(true);
  }

  async function updateSelectedPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPost || !user || selectedPost.userId !== user.id) {
      return;
    }

    if (!editForm.title.trim() || !editForm.content.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }

    if (editForm.title.trim().length > 100 || editForm.content.trim().length > 5000) {
      setError("제목은 100자, 내용은 5,000자 이내로 작성해 주세요.");
      return;
    }

    const nextPosts = posts.map((post) => post.id === selectedPost.id ? {
      ...post,
      category: editForm.category,
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      updatedAt: new Date().toISOString()
    } : post);

    setPosts(nextPosts);
    await persistPosts(nextPosts);
    setIsEditing(false);
    setError("");
  }

  async function recommendPost() {
    const currentUser = getStoredUser();

    if (!currentUser) {
      window.location.href = "/auth/login";
      return;
    }

    if (!selectedPost || selectedPost.userId === currentUser.id || selectedPost.recommendedUserIds.includes(currentUser.id)) {
      return;
    }

    const nextPosts = posts.map((post) => post.id === selectedPost.id ? {
      ...post,
      recommendedUserIds: [...post.recommendedUserIds, currentUser.id],
      recommendCount: post.recommendedUserIds.length + 1,
      updatedAt: new Date().toISOString()
    } : post);

    setPosts(nextPosts);
    await persistPosts(nextPosts);
  }

  function requestDeleteComment(commentId: string) {
    if (!selectedPost || !user) {
      return;
    }

    const targetComment = selectedPost.comments.find((item) => item.id === commentId);
    if (!targetComment || targetComment.userId !== user.id) {
      return;
    }

    setDeletingCommentId(commentId);
  }

  async function confirmDeleteComment() {
    if (!selectedPost || !user || !deletingCommentId) {
      setDeletingCommentId("");
      return;
    }

    const targetComment = selectedPost.comments.find((item) => item.id === deletingCommentId);
    if (!targetComment || targetComment.userId !== user.id) {
      setDeletingCommentId("");
      return;
    }

    const nextPosts = posts.map((post) => post.id === selectedPost.id ? {
      ...post,
      comments: post.comments.filter((item) => item.id !== deletingCommentId),
      updatedAt: new Date().toISOString()
    } : post);

    setPosts(nextPosts);
    setDeletingCommentId("");
    await persistPosts(nextPosts);
  }

  function startEditingComment(commentId: string) {
    if (!selectedPost || !user) {
      return;
    }

    const targetComment = selectedPost.comments.find((item) => item.id === commentId);
    if (!targetComment || targetComment.userId !== user.id) {
      return;
    }

    setEditingCommentId(commentId);
    setEditingCommentContent(targetComment.content);
    setError("");
  }

  function cancelEditingComment() {
    setEditingCommentId("");
    setEditingCommentContent("");
    setError("");
  }

  async function updateComment(commentId: string) {
    if (!selectedPost || !user) {
      return;
    }

    const targetComment = selectedPost.comments.find((item) => item.id === commentId);
    const nextContent = editingCommentContent.trim();

    if (!targetComment || targetComment.userId !== user.id) {
      return;
    }

    if (!nextContent) {
      setError("댓글 내용을 입력해 주세요.");
      return;
    }

    if (nextContent.length > 1000) {
      setError("댓글은 1,000자 이내로 작성해 주세요.");
      return;
    }

    const nextPosts = posts.map((post) => post.id === selectedPost.id ? {
      ...post,
      comments: post.comments.map((item) => item.id === commentId ? { ...item, content: nextContent } : item),
      updatedAt: new Date().toISOString()
    } : post);

    setPosts(nextPosts);
    await persistPosts(nextPosts);
    cancelEditingComment();
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
    <main className="page board-post-page">
      <section className="page-header board-post-header">
        <Link className="ghost-button board-back-button" href="/board">목록으로</Link>
        <div className="board-post-heading">
          <div>
            <span className="badge">{categoryLabels[selectedPost.category]}</span>
            <h1 className="board-post-title">{selectedPost.title}</h1>
          </div>
          {selectedPost.userId === user?.id ? (
            <div className="chip-row">
              <button className="ghost-button" type="button" onClick={startEditing}>수정</button>
              <span className="board-action-divider" aria-hidden="true" />
              <button className="ghost-button" type="button" onClick={requestDeleteSelectedPost}>삭제</button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel board-post-panel">
        {isEditing ? (
          <form className="form board-edit-form" onSubmit={updateSelectedPost}>
            <div className="section-title">
              <h1 className="board-post-title">게시글 수정</h1>
              <button className="ghost-button" type="button" onClick={() => setIsEditing(false)}>취소</button>
            </div>
            <div className="field">
              <label htmlFor="edit-post-category">카테고리</label>
              <select
                id="edit-post-category"
                value={editForm.category}
                onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value as BoardPost["category"] }))}
              >
                {availableCategories.map((key) => <option key={key} value={key}>{categoryLabels[key]}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="edit-post-title">제목</label>
              <input id="edit-post-title" maxLength={100} value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="field board-content-field">
              <label htmlFor="edit-post-content">내용</label>
              <textarea id="edit-post-content" maxLength={5000} value={editForm.content} onChange={(event) => setEditForm((current) => ({ ...current, content: event.target.value }))} />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="button board-edit-submit-button" type="submit">저장</button>
          </form>
        ) : (
          <>
            <div className="meta board-post-meta">
              <BoardAuthorMenu userId={selectedPost.userId} authorName={selectedPost.authorName} currentUserId={user?.id} posts={posts} />
              <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(selectedPost.createdAt))}</span>
              <span>조회 {selectedPost.viewCount}</span>
              <span className="recommend-meta">추천 {selectedPost.recommendCount}</span>
            </div>
            <p className="board-post-content">{selectedPost.content}</p>
            {attachedImage ? <img className="board-post-image" src={attachedImage.dataUrl} alt={attachedImage.name || "게시글 첨부 이미지"} /> : null}
          </>
        )}
      </section>

      <section className="panel board-comments-panel">
        <div className="section-title">
          <h2>댓글 {selectedPost.comments.length}</h2>
        </div>
        <div className="list">
          {selectedPost.comments.map((item) => (
            <div className={focusedCommentId === item.id ? "list-item board-comment-item focused" : "list-item board-comment-item"} id={`comment-${item.id}`} key={item.id}>
              <div className="board-comment-main">
                <strong><BoardAuthorMenu userId={item.userId} authorName={item.authorName} currentUserId={user?.id} posts={posts} /></strong>
                {editingCommentId === item.id ? (
                  <textarea className="board-comment-edit-input" maxLength={1000} value={editingCommentContent} onChange={(event) => setEditingCommentContent(event.target.value)} />
                ) : <span>{item.content}</span>}
              </div>
              {item.userId === user?.id ? (
                <div className="board-comment-actions">
                  {editingCommentId === item.id ? (
                    <>
                      <button className="ghost-button" type="button" onClick={() => void updateComment(item.id)}>저장</button>
                      <button className="ghost-button" type="button" onClick={cancelEditingComment}>취소</button>
                    </>
                  ) : (
                    <>
                      <button className="ghost-button" type="button" onClick={() => startEditingComment(item.id)}>수정</button>
                      <span className="board-action-divider" aria-hidden="true" />
                      <button className="ghost-button" type="button" onClick={() => requestDeleteComment(item.id)}>삭제</button>
                    </>
                  )}
                </div>
              ) : null}
              {editingCommentId === item.id && error ? <div className="error board-comment-error">{error}</div> : null}
            </div>
          ))}
          {selectedPost.comments.length === 0 ? <div className="list-item">아직 댓글이 없습니다.</div> : null}
        </div>
        <form className="form board-comment-form" onSubmit={addComment}>
          <div className="field">
            <label htmlFor="comment">댓글</label>
            <input id="comment" maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} />
          </div>
          {error ? <div className="error">{error}</div> : null}
          <button className="button" type="submit">댓글 작성</button>
        </form>
      </section>

      <div className="board-recommend-bar">
        <button
          className="board-recommend-button"
          type="button"
          onClick={() => void recommendPost()}
          disabled={selectedPost.userId === user?.id || Boolean(user && selectedPost.recommendedUserIds.includes(user.id))}
        >
          추천 {selectedPost.recommendCount}
        </button>
      </div>
      {isPostDeleteConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsPostDeleteConfirmOpen(false);
        }}>
          <section className="confirm-modal yes-no-confirm delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-post-title" aria-describedby="delete-post-description">
            <div className="yes-no-confirm-mark delete-confirm-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7" /></svg>
            </div>
            <div>
              <h2 id="delete-post-title">게시글을 삭제하시겠습니까?</h2>
              <p id="delete-post-description">삭제 후 복구할 수 없습니다.</p>
            </div>
            <div className="modal-actions">
              <button className="button" type="button" onClick={() => void confirmDeleteSelectedPost()}>예</button>
              <button className="ghost-button" type="button" onClick={() => setIsPostDeleteConfirmOpen(false)}>아니오</button>
            </div>
          </section>
        </div>
      ) : null}
      {deletingCommentId ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeletingCommentId("");
        }}>
          <section className="confirm-modal yes-no-confirm delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-comment-title">
            <div className="yes-no-confirm-mark delete-confirm-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7" /></svg>
            </div>
            <div>
              <h2 id="delete-comment-title">댓글을 삭제하시겠습니까?</h2>
            </div>
            <div className="modal-actions">
              <button className="button" type="button" onClick={() => void confirmDeleteComment()}>예</button>
              <button className="ghost-button" type="button" onClick={() => setDeletingCommentId("")}>아니오</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
