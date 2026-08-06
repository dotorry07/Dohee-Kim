"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getStoredUser } from "@/lib/auth/client";
import { getBoardPosts, saveBoardPosts, subscribeToBoardPosts } from "@/lib/board-storage";
import type { BoardPost, Comment } from "@/lib/types";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "새내기 Q&A",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

type ActivityFilter = "all" | "my-posts" | "my-comments" | "recommended";

type MyCommentEntry = {
  post: BoardPost;
  comment: Comment;
};

type BoardImage = {
  dataUrl: string;
  name: string;
};

type BoardPostWithImage = BoardPost & {
  image?: BoardImage;
};

const POST_COOLDOWN_MS = 10_000;
const LAST_POST_AT_KEY = "newbie-on-board-last-post-at";
const MAX_IMAGE_SIZE = 750 * 1024;

const activityLabels: Record<ActivityFilter, string> = {
  all: "전체 글",
  "my-posts": "내가 쓴 글",
  "my-comments": "내가 쓴 댓글",
  recommended: "추천한 글"
};

export default function BoardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [category, setCategory] = useState<BoardPost["category"] | "all">("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "freshman" as BoardPost["category"], title: "", content: "" });
  const [image, setImage] = useState<BoardImage | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    setPosts(getBoardPosts());
    setUser(getStoredUser());

    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "my-posts" || view === "my-comments" || view === "recommended") {
      setActivityFilter(view);
    }

    return subscribeToBoardPosts(setPosts);
  }, []);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => category === "all" || post.category === category)
      .filter((post) => {
        if (activityFilter === "all") {
          return true;
        }

        if (!user) {
          return false;
        }

        if (activityFilter === "my-posts") {
          return post.userId === user.id;
        }

        if (activityFilter === "my-comments") {
          return post.comments.some((item) => item.userId === user.id);
        }

        return post.recommendedUserIds.includes(user.id);
      })
      .filter((post) => !normalized || `${post.title} ${post.content}`.toLowerCase().includes(normalized))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [activityFilter, category, posts, query, user]);

  const myCommentEntries = useMemo(() => {
    if (!user || activityFilter !== "my-comments") {
      return [];
    }

    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => category === "all" || post.category === category)
      .flatMap((post) => post.comments
        .filter((item) => item.userId === user.id)
        .map((comment): MyCommentEntry => ({ post, comment })))
      .filter(({ post, comment }) => !normalized || `${post.title} ${post.content} ${comment.content}`.toLowerCase().includes(normalized))
      .sort((a, b) => Date.parse(b.comment.createdAt) - Date.parse(a.comment.createdAt));
  }, [activityFilter, category, posts, query, user]);

  const popularPosts = useMemo(() => posts
    .map((post) => ({
      post,
      popularityScore: post.recommendCount * 2 + post.comments.length
    }))
    .filter(({ popularityScore }) => popularityScore > 0)
    .sort((a, b) => b.popularityScore - a.popularityScore
      || b.post.recommendCount - a.post.recommendCount
      || b.post.comments.length - a.post.comments.length
      || Date.parse(b.post.createdAt) - Date.parse(a.post.createdAt))
    .slice(0, 5), [posts]);

  function selectActivityFilter(nextFilter: ActivityFilter) {
    if (nextFilter !== "all" && !getStoredUser()) {
      window.location.href = "/auth/login";
      return;
    }

    setActivityFilter(nextFilter);
    const params = new URLSearchParams(window.location.search);
    if (nextFilter === "all") {
      params.delete("view");
    } else {
      params.set("view", nextFilter);
    }

    const queryString = params.toString();
    router.replace(queryString ? `/board?${queryString}` : "/board", { scroll: false });
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentUser = getStoredUser();
    if (!currentUser) {
      window.location.href = "/auth/login";
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    if (form.title.trim().length > 100 || form.content.trim().length > 5000) {
      setError("제목은 100자, 내용은 5,000자 이내로 작성해 주세요.");
      return;
    }

    const lastPostAt = Number(window.localStorage.getItem(LAST_POST_AT_KEY) ?? 0);
    if (Date.now() - lastPostAt < POST_COOLDOWN_MS) {
      setError("연속 작성은 10초 후에 다시 시도해 주세요.");
      return;
    }

    const now = new Date().toISOString();
    const newPost: BoardPostWithImage = {
      id: `post-${crypto.randomUUID()}`,
      userId: currentUser.id,
      authorName: currentUser.nickname,
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      viewCount: 0,
      recommendCount: 0,
      recommendedUserIds: [],
      comments: [],
      ...(image ? { image } : {}),
      createdAt: now,
      updatedAt: now
    };

    try {
      const nextPosts = [newPost, ...getBoardPosts()];
      saveBoardPosts(nextPosts);
      setPosts(nextPosts);
    } catch {
      setError("저장 공간이 부족해 사진을 저장하지 못했습니다. 더 작은 사진을 선택해 주세요.");
      return;
    }
    window.localStorage.setItem(LAST_POST_AT_KEY, String(Date.now()));
    setForm((current) => ({ ...current, title: "", content: "" }));
    setImage(null);
    setError("");
    setIsComposerOpen(false);
    router.push(`/board/${newPost.id}`);
  }

  function selectImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("이미지는 750KB 이하만 첨부할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setImage({ dataUrl: reader.result, name: file.name });
      setError("");
    };
    reader.onerror = () => setError("이미지를 불러오지 못했습니다.");
    reader.readAsDataURL(file);
  }

  function resetComposer() {
    setForm({ category: "freshman", title: "", content: "" });
    setImage(null);
    setError("");
  }

  function openComposer() {
    const currentUser = getStoredUser();

    if (!currentUser) {
      router.push("/auth/login");
      return;
    }

    setUser(currentUser);
    setError("");
    setIsComposerOpen(true);
  }

  return (
    <main className="page">
      <section className="page-header board-page-header">
        <h1>게시판</h1>
        <p>새내기 질문, 자유게시판, 학과별 게시판, 정보 공유 글을 최신순으로 확인합니다.</p>
      </section>

      <section className="board-activity-tabs" aria-label="내 게시판 활동 필터">
        {(Object.keys(activityLabels) as ActivityFilter[]).map((key) => (
          <button className={activityFilter === key ? "activity-tab active" : "activity-tab"} key={key} type="button" onClick={() => selectActivityFilter(key)}>
            {activityLabels[key]}
          </button>
        ))}
      </section>

      <section className="board-page-layout">
        <article className="panel board-list-panel">
          <div className="form">
            <input className="search" placeholder="제목 또는 내용 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="tabs">
              <button className={category === "all" ? "tab active" : "tab"} type="button" onClick={() => setCategory("all")}>전체</button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button className={category === key ? "tab active" : "tab"} key={key} type="button" onClick={() => setCategory(key as BoardPost["category"])}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="list" style={{ marginTop: 16 }}>
            {activityFilter === "my-comments" ? (
              <>
                {myCommentEntries.map(({ post, comment }) => (
                  <Link className="list-item board-list-link my-comment-list-link" key={comment.id} href={`/board/${post.id}?commentId=${comment.id}#comment-${comment.id}`}>
                    <div className="meta">
                      <span className="badge">{categoryLabels[post.category]}</span>
                      <span>{post.authorName}</span>
                      <span>댓글 {post.comments.length}</span>
                      <span>조회 {post.viewCount}</span>
                      <span className="recommend-meta">추천 {post.recommendCount}</span>
                    </div>
                    <strong>{post.title}</strong>
                    <div className="my-comment-preview">
                      <span className="badge">내 댓글</span>
                      <p>{comment.content}</p>
                    </div>
                  </Link>
                ))}
                {myCommentEntries.length === 0 ? <div className="list-item">내가 쓴 댓글 목록이 없습니다.</div> : null}
              </>
            ) : (
              <>
                {filteredPosts.map((post) => (
                  <Link className="list-item board-list-link" key={post.id} href={`/board/${post.id}`}>
                    <div className="meta">
                      <span className="badge">{categoryLabels[post.category]}</span>
                      <span>{post.authorName}</span>
                      <span>댓글 {post.comments.length}</span>
                      <span>조회 {post.viewCount}</span>
                      <span className="recommend-meta">추천 {post.recommendCount}</span>
                    </div>
                    <strong>{post.title}</strong>
                  </Link>
                ))}
                {filteredPosts.length === 0 ? <div className="list-item">{activityFilter === "all" ? "아직 작성된 글이 없습니다." : `${activityLabels[activityFilter]} 목록이 없습니다.`}</div> : null}
              </>
            )}
          </div>
        </article>

        <aside className="panel board-popular-sidebar" aria-labelledby="board-popular-title">
          <div className="board-popular-header">
            <h2 id="board-popular-title">인기 게시글</h2>
          </div>
          <div className="board-popular-list">
            {popularPosts.map(({ post }, index) => (
              <Link className="board-popular-link" key={post.id} href={`/board/${post.id}`}>
                <span className="board-popular-rank">{index + 1}</span>
                <span className="board-popular-content">
                  <strong>{post.title}</strong>
                  <span>댓글 {post.comments.length} · 조회 {post.viewCount} · <span className="board-popular-recommend">추천 {post.recommendCount}</span></span>
                </span>
              </Link>
            ))}
            {popularPosts.length === 0 ? (
              <p className="board-popular-empty">아직 추천이나 댓글이 있는 게시글이 없습니다.</p>
            ) : null}
          </div>
        </aside>
      </section>

      <button className="board-write-button" type="button" onClick={openComposer}>
        글 작성
      </button>

      {isComposerOpen ? (
        <div className="board-composer-backdrop" role="presentation">
          <section className="board-composer" role="dialog" aria-modal="true" aria-labelledby="board-composer-title">
            <div className="section-title">
              <div>
                <h2 id="board-composer-title">글 작성</h2>
                {!user ? <Link className="badge" href="/auth/login">로그인 필요</Link> : <span className="badge">{user.nickname}</span>}
              </div>
              <div className="board-composer-actions">
                <button className="ghost-button" type="button" onClick={resetComposer}>
                  새로 쓰기
                </button>
                <button className="ghost-button" type="button" onClick={() => {
                  setError("");
                  setIsComposerOpen(false);
                }}>
                  닫기
                </button>
              </div>
            </div>
            <form className="form board-composer-form" onSubmit={createPost}>
              <div className="field">
                <label htmlFor="post-category">카테고리</label>
                <select id="post-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as BoardPost["category"] }))}>
                  {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="post-title">제목</label>
                <input id="post-title" maxLength={100} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="field board-content-field">
                <label htmlFor="post-content">내용</label>
                <textarea id="post-content" maxLength={5000} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
              </div>
              <div className="field board-image-field">
                <label htmlFor="post-image">사진 첨부 (최대 750KB)</label>
                <input id="post-image" type="file" accept="image/*" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => selectImage(event.target.files?.[0])} />
              </div>
              {image ? (
                <div className="board-image-preview">
                  <img src={image.dataUrl} alt="첨부 이미지 미리보기" />
                  <button className="ghost-button mt-2" type="button" onClick={() => setImage(null)}>사진 제거</button>
                </div>
              ) : null}
              {error ? <div className="error">{error}</div> : null}
              <button className="button board-submit-button" type="submit">작성</button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
