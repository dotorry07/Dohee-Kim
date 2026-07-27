"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getStoredUser } from "@/lib/auth/client";
import { getBoardPosts, saveBoardPosts } from "@/lib/board-storage";
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
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    setPosts(getBoardPosts());
    setUser(getStoredUser());

    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "my-posts" || view === "my-comments" || view === "recommended") {
      setActivityFilter(view);
    }
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

  function createPost(event: FormEvent<HTMLFormElement>) {
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

    const newPost: BoardPost = {
      id: `post-${Date.now()}`,
      userId: currentUser.id,
      authorName: currentUser.nickname,
      category: form.category,
      title: form.title.trim(),
      content: form.content.trim(),
      viewCount: 0,
      recommendCount: 0,
      recommendedUserIds: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPosts((current) => {
      const nextPosts = [newPost, ...current];
      saveBoardPosts(nextPosts);
      return nextPosts;
    });
    setForm((current) => ({ ...current, title: "", content: "" }));
    setError("");
    setIsComposerOpen(false);
    router.push(`/board/${newPost.id}`);
  }

  return (
    <main className="page">
      <section className="page-header">
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

      <section>
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
      </section>

      <button className="board-write-button" type="button" onClick={() => {
        setError("");
        setIsComposerOpen(true);
      }}>
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
              <button className="ghost-button" type="button" onClick={() => {
                setError("");
                setIsComposerOpen(false);
              }}>
                닫기
              </button>
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
                <input id="post-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="field board-content-field">
                <label htmlFor="post-content">내용</label>
                <textarea id="post-content" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
              </div>
              {error ? <div className="error">{error}</div> : null}
              <button className="button board-submit-button" type="submit">작성</button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
