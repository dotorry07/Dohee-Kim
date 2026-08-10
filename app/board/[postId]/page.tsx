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

type BoardPostWithImage = BoardPost & {
  image?: {
    dataUrl: string;
    name: string;
  };
};

const COMMENT_COOLDOWN_MS = 3_000;
const LAST_COMMENT_AT_KEY = "newbie-on-board-last-comment-at";

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
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState({ category: "free" as BoardPost["category"], title: "", content: "" });
  const viewCountRequested = useRef(false);

  useEffect(() => {
    setPosts(getBoardPosts());
    void loadPersistentBoardPosts().then(setPosts);
    setUser(getStoredUser());

    const nextFocusedCommentId = new URLSearchParams(window.location.search).get("commentId") ?? "";
    setFocusedCommentId(nextFocusedCommentId);

    return subscribeToBoardPosts(setPosts);
  }, []);

  const selectedPost = posts.find((post) => post.id === params.postId);
  const attachedImage = (selectedPost as BoardPostWithImage | undefined)?.image;

  useEffect(() => {
    if (!params.postId || !selectedPost || viewCountRequested.current) return;
    viewCountRequested.current = true;
    const viewedKey = `newbie-on-board-viewed:${params.postId}`;
    if (window.sessionStorage.getItem(viewedKey)) return;
    window.sessionStorage.setItem(viewedKey, "true");
    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === params.postId
        ? { ...post, viewCount: post.viewCount + 1 }
        : post);
      saveBoardPosts(nextPosts);
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

  function addComment(event: FormEvent<HTMLFormElement>) {
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

    const lastCommentAt = Number(window.localStorage.getItem(LAST_COMMENT_AT_KEY) ?? 0);
    if (Date.now() - lastCommentAt < COMMENT_COOLDOWN_MS) {
      setError("연속 댓글 작성은 3초 후에 다시 시도해 주세요.");
      return;
    }

    setPosts((current) => {
      const now = new Date().toISOString();
      const nextPosts = current.map((post) => post.id === selectedPost.id ? {
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
      saveBoardPosts(nextPosts);
      return nextPosts;
    });
    window.localStorage.setItem(LAST_COMMENT_AT_KEY, String(Date.now()));
    setComment("");
    setError("");
  }

  async function deleteSelectedPost() {
    if (!selectedPost || selectedPost.userId !== user?.id) {
      return;
    }

    if (!window.confirm("게시글을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.")) return;

    const nextPosts = posts.filter((post) => post.id !== selectedPost.id);
    const saved = await saveBoardPosts(nextPosts);
    if (!saved) {
      setError("게시글을 DB에서 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setPosts(nextPosts);
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
  async function recommendPost() {
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
        recommendedUserIds: [...post.recommendedUserIds, currentUser.id],
        recommendCount: post.recommendedUserIds.length + 1,
        updatedAt: new Date().toISOString()
      } : post);
      saveBoardPosts(nextPosts);
      return nextPosts;
    });
  }

  function startEditing() {
    if (!selectedPost || selectedPost.userId !== user?.id) return;
    setEditForm({ category: selectedPost.category === "freshman" ? "free" : selectedPost.category, title: selectedPost.title, content: selectedPost.content });
    setIsEditing(true);
  }

  async function updateSelectedPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost || !user || selectedPost.userId !== user.id) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }
    if (editForm.title.trim().length > 100 || editForm.content.trim().length > 5000) {
      setError("제목은 100자, 내용은 5,000자 이내로 작성해 주세요.");
      return;
    }
    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === selectedPost.id ? {
        ...post,
        ...editForm,
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        updatedAt: new Date().toISOString()
      } : post);
      saveBoardPosts(nextPosts);
      return nextPosts;
    });
    setIsEditing(false);
    setError("");
  }

  async function deleteComment(commentId: string) {
    if (!selectedPost || !user) return;
    const targetComment = selectedPost.comments.find((item) => item.id === commentId);
    if (!targetComment || targetComment.userId !== user.id) return;
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === selectedPost.id ? {
        ...post,
        comments: post.comments.filter((item) => item.id !== commentId),
        updatedAt: new Date().toISOString()
      } : post);
      saveBoardPosts(nextPosts);
      return nextPosts;
    });
  }

  function startEditingComment(commentId: string) {
    if (!selectedPost || !user) return;
    const targetComment = selectedPost.comments.find((item) => item.id === commentId);
    if (!targetComment || targetComment.userId !== user.id) return;
    setEditingCommentId(commentId);
    setEditingCommentContent(targetComment.content);
    setError("");
  }

  function cancelEditingComment() {
    setEditingCommentId("");
    setEditingCommentContent("");
    setError("");
  }

  function updateComment(commentId: string) {
    if (!selectedPost || !user) return;
    const targetComment = selectedPost.comments.find((item) => item.id === commentId);
    if (!targetComment || targetComment.userId !== user.id) return;

    const nextContent = editingCommentContent.trim();
    if (!nextContent) {
      setError("댓글 내용을 입력해 주세요.");
      return;
    }
    if (nextContent.length > 1000) {
      setError("댓글은 1,000자 이내로 작성해 주세요.");
      return;
    }

    setPosts((current) => {
      const nextPosts = current.map((post) => post.id === selectedPost.id ? {
        ...post,
        comments: post.comments.map((item) => item.id === commentId ? { ...item, content: nextContent } : item),
        updatedAt: new Date().toISOString()
      } : post);
      saveBoardPosts(nextPosts);
      return nextPosts;
    });
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
    <main className="page">
      <section className="page-header">
        <Link className="ghost-button" href="/board">목록으로</Link>
        <div className="board-post-heading">
          <h1 className="board-post-title">{selectedPost.title}</h1>
          {selectedPost.userId === user?.id ? (
            <div className="chip-row">
              <button className="ghost-button" type="button" onClick={startEditing}>수정</button>
              <span className="board-action-divider" aria-hidden="true" />
              <button className="ghost-button" type="button" onClick={deleteSelectedPost}>삭제</button>
            </div>
          ) : null}
        </div>
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
          <div className="meta">
            <span className="badge">{categoryLabels[selectedPost.category]}</span>
            <BoardAuthorMenu userId={selectedPost.userId} authorName={selectedPost.authorName} currentUserId={user?.id} posts={posts} />
            <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(selectedPost.createdAt))}</span>
            <span>조회 {selectedPost.viewCount}</span>
            <span className="recommend-meta">추천 {selectedPost.recommendCount}</span>
          </div>
          {isEditing ? (
            <form className="form" onSubmit={updateSelectedPost} style={{ marginTop: 16 }}>
              <select value={editForm.category} onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value as BoardPost["category"] }))}>
                {availableCategories.map((key) => <option key={key} value={key}>{categoryLabels[key]}</option>)}
              </select>
              <input maxLength={100} value={editForm.title} onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))} />
              <textarea maxLength={5000} value={editForm.content} onChange={(event) => setEditForm((current) => ({ ...current, content: event.target.value }))} />
              {error ? <div className="error">{error}</div> : null}
              <div className="chip-row"><button className="button" type="submit">저장</button><button className="ghost-button" type="button" onClick={() => setIsEditing(false)}>취소</button></div>
            </form>
          ) : (
            <>
              <p className="board-post-content">{selectedPost.content}</p>
              {attachedImage ? (
                <img
                  className="mt-5 max-h-[36rem] w-full rounded-lg object-contain"
                  src={attachedImage.dataUrl}
                  alt={attachedImage.name || "게시글 첨부 이미지"}
                />
              ) : null}
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
                      <button className="ghost-button" type="button" onClick={() => updateComment(item.id)}>저장</button>
                      <button className="ghost-button" type="button" onClick={cancelEditingComment}>취소</button>
                    </>
                  ) : (
                    <>
                      <button className="ghost-button" type="button" onClick={() => startEditingComment(item.id)}>수정</button>
                      <span className="board-action-divider" aria-hidden="true" />
                      <button className="ghost-button" type="button" onClick={() => deleteComment(item.id)}>삭제</button>
                    </>
                  )}
                </div>
              ) : null}
              {editingCommentId === item.id && error ? <div className="error board-comment-error">{error}</div> : null}
            </div>
          ))}
          {selectedPost.comments.length === 0 ? <div className="list-item">아직 댓글이 없습니다.</div> : null}
        </div>
        <form className="form" onSubmit={addComment} style={{ marginTop: 12 }}>
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
          onClick={recommendPost}
          disabled={selectedPost.userId === user?.id || Boolean(user && selectedPost.recommendedUserIds.includes(user.id))}
        >
          추천 {selectedPost.recommendCount}
        </button>
      </div>
    </main>
  );
}
