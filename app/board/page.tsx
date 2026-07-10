"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { getStoredUser } from "@/lib/auth/client";
import { posts as seedPosts } from "@/lib/data";
import type { BoardPost } from "@/lib/types";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "새내기 Q&A",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

export default function BoardPage() {
  const [posts, setPosts] = useState(seedPosts);
  const [category, setCategory] = useState<BoardPost["category"] | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(seedPosts[0]?.id ?? "");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "freshman" as BoardPost["category"], title: "", content: "" });
  const [comment, setComment] = useState("");

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => category === "all" || post.category === category)
      .filter((post) => !normalized || `${post.title} ${post.content}`.toLowerCase().includes(normalized))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [category, posts, query]);

  const selectedPost = posts.find((post) => post.id === selectedId) ?? filteredPosts[0];
  const user = typeof window !== "undefined" ? getStoredUser() : null;

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
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPosts((current) => [newPost, ...current]);
    setSelectedId(newPost.id);
    setForm((current) => ({ ...current, title: "", content: "" }));
    setError("");
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

    setPosts((current) => current.map((post) => post.id === selectedPost.id ? {
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
    } : post));
    setComment("");
  }

  function deleteSelectedPost() {
    if (!selectedPost || selectedPost.userId !== user?.id) {
      return;
    }

    setPosts((current) => current.filter((post) => post.id !== selectedPost.id));
    setSelectedId("");
  }

  return (
    <main className="page">
      <section className="page-header">
        <h1>게시판</h1>
        <p>새내기 질문, 자유게시판, 학과별 게시판, 정보 공유 글을 최신순으로 확인합니다.</p>
      </section>

      <section className="grid two">
        <article className="panel">
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
            {filteredPosts.map((post) => (
              <button className="list-item" key={post.id} type="button" onClick={() => setSelectedId(post.id)} style={{ textAlign: "left" }}>
                <div className="meta">
                  <span className="badge">{categoryLabels[post.category]}</span>
                  <span>{post.authorName}</span>
                  <span>댓글 {post.comments.length}</span>
                  <span>조회 {post.viewCount}</span>
                </div>
                <strong>{post.title}</strong>
              </button>
            ))}
            {filteredPosts.length === 0 ? <div className="list-item">아직 작성된 글이 없습니다.</div> : null}
          </div>
        </article>

        <article className="panel">
          <div className="section-title">
            <h2>글 작성</h2>
            {!user ? <Link className="badge" href="/auth/login">로그인 필요</Link> : <span className="badge">{user.nickname}</span>}
          </div>
          <form className="form" onSubmit={createPost}>
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
            <div className="field">
              <label htmlFor="post-content">내용</label>
              <textarea id="post-content" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="button" type="submit">작성</button>
          </form>
        </article>
      </section>

      {selectedPost ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="section-title">
            <h2>{selectedPost.title}</h2>
            {selectedPost.userId === user?.id ? <button className="ghost-button" type="button" onClick={deleteSelectedPost}>삭제</button> : null}
          </div>
          <div className="meta">
            <span className="badge">{categoryLabels[selectedPost.category]}</span>
            <span>{selectedPost.authorName}</span>
            <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(selectedPost.createdAt))}</span>
          </div>
          <p>{selectedPost.content}</p>
          <div className="section-title">
            <h3>댓글 {selectedPost.comments.length}</h3>
          </div>
          <div className="list">
            {selectedPost.comments.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{item.authorName}</strong>
                <span>{item.content}</span>
              </div>
            ))}
          </div>
          <form className="form" onSubmit={addComment} style={{ marginTop: 12 }}>
            <div className="field">
              <label htmlFor="comment">댓글</label>
              <input id="comment" value={comment} onChange={(event) => setComment(event.target.value)} />
            </div>
            <button className="button" type="submit">댓글 작성</button>
          </form>
        </section>
      ) : null}
    </main>
  );
}
