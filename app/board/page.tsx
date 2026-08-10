"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BoardAuthorMenu } from "@/components/board-author-menu";
import { BOARD_RANKS, BoardRankIcon, BoardUserRank } from "@/components/board-user-rank";
import { getStoredUser, updateStoredNickname } from "@/lib/auth/client";
import { getBoardPosts, loadPersistentBoardPosts, saveBoardPosts, subscribeToBoardPosts } from "@/lib/board-storage";
import type { BoardPost, Comment } from "@/lib/types";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "자유게시판",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

const availableCategories: BoardPost["category"][] = ["free", "department", "info"];

type ActivityFilter = "all" | "my-posts" | "my-comments" | "recommended";
type SortOrder = "latest" | "recommended" | "views" | "oldest";

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

type BoardDraft = {
  id: string;
  category: BoardPost["category"];
  title: string;
  content: string;
  image: BoardImage | null;
  savedAt: string;
};

const POST_COOLDOWN_MS = 10_000;
const LAST_POST_AT_KEY = "newbie-on-board-last-post-at";
const BOARD_DRAFTS_KEY = "newbie-on-board-drafts";
const MAX_IMAGE_SIZE = 750 * 1024;
const POSTS_PER_PAGE = 10;
const POPULAR_POSTS_LIMIT = 5;

const activityLabels: Record<ActivityFilter, string> = {
  all: "전체 글",
  "my-posts": "내가 쓴 글",
  "my-comments": "내가 쓴 댓글",
  recommended: "추천한 글"
};

const sortLabels: Record<SortOrder, string> = {
  latest: "최신순",
  recommended: "추천순",
  views: "조회순",
  oldest: "오래된 순"
};

function comparePosts(a: BoardPost, b: BoardPost, sortOrder: SortOrder) {
  if (sortOrder === "recommended") {
    return b.recommendCount - a.recommendCount || Date.parse(b.createdAt) - Date.parse(a.createdAt);
  }
  if (sortOrder === "views") {
    return b.viewCount - a.viewCount || Date.parse(b.createdAt) - Date.parse(a.createdAt);
  }
  if (sortOrder === "oldest") {
    return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  }
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

function CommentIcon() {
  return (
    <svg className="board-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5.75h14v9.5H9.5L5 18.5V5.75Z" />
    </svg>
  );
}

function RecommendIcon() {
  return (
    <svg className="board-stat-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.5 10.5 12 4.75c.55-.9 1.9-.52 1.9.54v4.46H18a2 2 0 0 1 1.94 2.48l-1.35 5.5a2 2 0 0 1-1.94 1.52H8.5v-8.75ZM4 10.5h4.5v8.75H4V10.5Z" />
    </svg>
  );
}

function getBoardDrafts(): BoardDraft[] {
  try {
    const currentUser = getStoredUser();
    if (!currentUser) return [];
    const stored = JSON.parse(window.localStorage.getItem(`${BOARD_DRAFTS_KEY}:${currentUser.id}`) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export default function BoardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [category, setCategory] = useState<BoardPost["category"] | "all">("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ category: "free" as BoardPost["category"], title: "", content: "" });
  const [image, setImage] = useState<BoardImage | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [drafts, setDrafts] = useState<BoardDraft[]>([]);
  const [isDraftListOpen, setIsDraftListOpen] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isRankGuideOpen, setIsRankGuideOpen] = useState(false);
  const [isNicknameEditing, setIsNicknameEditing] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [draftToDelete, setDraftToDelete] = useState<BoardDraft | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    setPosts(getBoardPosts());
    void loadPersistentBoardPosts().then(setPosts);
    setUser(getStoredUser());
    setDrafts(getBoardDrafts());

    const view = new URLSearchParams(window.location.search).get("view");
    if (view === "my-posts" || view === "my-comments" || view === "recommended") {
      setActivityFilter(view);
    }

    return subscribeToBoardPosts(setPosts);
  }, []);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => category === "all" || post.category === category || (category === "free" && post.category === "freshman"))
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
      .sort((a, b) => comparePosts(a, b, sortOrder));
  }, [activityFilter, category, posts, query, sortOrder, user]);

  const myCommentEntries = useMemo(() => {
    if (!user || activityFilter !== "my-comments") {
      return [];
    }

    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => category === "all" || post.category === category || (category === "free" && post.category === "freshman"))
      .flatMap((post) => post.comments
        .filter((item) => item.userId === user.id)
        .map((comment): MyCommentEntry => ({ post, comment })))
      .filter(({ post, comment }) => !normalized || `${post.title} ${post.content} ${comment.content}`.toLowerCase().includes(normalized))
      .sort((a, b) => sortOrder === "latest"
        ? Date.parse(b.comment.createdAt) - Date.parse(a.comment.createdAt)
        : sortOrder === "oldest"
          ? Date.parse(a.comment.createdAt) - Date.parse(b.comment.createdAt)
          : comparePosts(a.post, b.post, sortOrder));
  }, [activityFilter, category, posts, query, sortOrder, user]);

  const totalItems = activityFilter === "my-comments" ? myCommentEntries.length : filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / POSTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(pageStart, pageStart + POSTS_PER_PAGE);
  const paginatedCommentEntries = myCommentEntries.slice(pageStart, pageStart + POSTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activityFilter, category, query, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
    .slice(0, POPULAR_POSTS_LIMIT), [posts]);

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
      const saved = await saveBoardPosts(nextPosts);
      if (!saved) {
        setError("게시글을 DB에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setPosts(nextPosts);
    } catch {
      setError("저장 공간이 부족해 사진을 저장하지 못했습니다. 더 작은 사진을 선택해 주세요.");
      return;
    }
    window.localStorage.setItem(LAST_POST_AT_KEY, String(Date.now()));
    if (currentDraftId) {
      const nextDrafts = getBoardDrafts().filter((draft) => draft.id !== currentDraftId);
      window.localStorage.setItem(`${BOARD_DRAFTS_KEY}:${currentUser.id}`, JSON.stringify(nextDrafts));
      setDrafts(nextDrafts);
    }
    setForm((current) => ({ ...current, title: "", content: "" }));
    setImage(null);
    setCurrentDraftId("");
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
    setForm({ category: "free", title: "", content: "" });
    setImage(null);
    setCurrentDraftId("");
    setIsDraftListOpen(false);
    setIsCloseConfirmOpen(false);
    setDraftToDelete(null);
    setError("");
  }

  function saveDraft() {
    const draft: BoardDraft = {
      id: currentDraftId || `draft-${crypto.randomUUID()}`,
      category: form.category,
      title: form.title,
      content: form.content,
      image,
      savedAt: new Date().toISOString()
    };
    const nextDrafts = [draft, ...getBoardDrafts().filter((item) => item.id !== draft.id)];

    try {
      const currentUser = getStoredUser();
      if (!currentUser) return false;
      window.localStorage.setItem(`${BOARD_DRAFTS_KEY}:${currentUser.id}`, JSON.stringify(nextDrafts));
      setDrafts(nextDrafts);
      return true;
    } catch {
      setError("저장 공간이 부족해 임시저장하지 못했습니다.");
      return false;
    }
  }

  function closeComposer() {
    setIsCloseConfirmOpen(true);
  }

  function saveDraftAndClose() {
    if (!saveDraft()) return;
    resetComposer();
    setIsComposerOpen(false);
  }

  function discardDraftAndClose() {
    resetComposer();
    setIsComposerOpen(false);
  }

  function loadDraft(draft: BoardDraft) {
    setForm({ category: draft.category === "freshman" ? "free" : draft.category, title: draft.title, content: draft.content });
    setImage(draft.image);
    setCurrentDraftId(draft.id);
    setIsDraftListOpen(false);
    setError("");
  }

  function deleteDraft(draft: BoardDraft) {
    setDraftToDelete(draft);
  }

  function confirmDeleteDraft() {
    const currentUser = getStoredUser();
    if (!currentUser || !draftToDelete) return;

    const nextDrafts = getBoardDrafts().filter((draft) => draft.id !== draftToDelete.id);
    window.localStorage.setItem(`${BOARD_DRAFTS_KEY}:${currentUser.id}`, JSON.stringify(nextDrafts));
    setDrafts(nextDrafts);
    if (currentDraftId === draftToDelete.id) setCurrentDraftId("");
    setDraftToDelete(null);
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

  function startNicknameEditing() {
    if (!user) return;
    setNicknameDraft(user.nickname);
    setNicknameError("");
    setIsNicknameEditing(true);
  }

  async function updateNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const nickname = nicknameDraft.trim();
    if (nickname.length < 2 || nickname.length > 12) {
      setNicknameError("닉네임은 2~12자로 입력해 주세요.");
      return;
    }

    const nextPosts = posts.map((post) => ({
      ...post,
      authorName: post.userId === user.id ? nickname : post.authorName,
      comments: post.comments.map((item) => item.userId === user.id ? { ...item, authorName: nickname } : item)
    }));
    const saved = await saveBoardPosts(nextPosts);
    if (!saved) {
      setNicknameError("닉네임을 DB에 저장하지 못했습니다.");
      return;
    }

    const updatedUser = updateStoredNickname(nickname);
    setPosts(nextPosts);
    setUser(updatedUser);
    setIsNicknameEditing(false);
    setNicknameError("");
  }

  return (
    <main className="page board-page">
      <section className="page-header board-page-header">
        <div>
          <h1>게시판</h1>
          <p>자유게시판, 학과별 게시판, 정보 공유 글을 확인합니다.</p>
        </div>
        <div className="board-banner-decoration" aria-hidden="true">
          <svg viewBox="0 0 210 100">
            <path className="board-banner-bubble board-banner-bubble-back" d="M100 19h75a13 13 0 0 1 13 13v27a13 13 0 0 1-13 13h-24l-15 14 3-14h-39a13 13 0 0 1-13-13V32a13 13 0 0 1 13-13Z" />
            <path className="board-banner-bubble" d="M27 34h80a14 14 0 0 1 14 14v26a14 14 0 0 1-14 14H65L48 98l5-10H27a14 14 0 0 1-14-14V48a14 14 0 0 1 14-14Z" />
            <circle cx="39" cy="61" r="4" />
            <circle cx="58" cy="61" r="4" />
            <circle cx="77" cy="61" r="4" />
            <g transform="translate(142 27) scale(1.15)">
              <path className="board-banner-gem" d="M8.4 8.1 12 2.6l3.6 5.5-1.15 11.6h-4.9L8.4 8.1Z" />
              <path className="board-banner-gem board-banner-gem-side" d="m7.5 7.25 2.2 3.95-.9 8-4.65-3.7-.35-5.3 3.7-2.95ZM16.5 6.2l3.7 3.2-.8 6.9-4.95 3.4-.35-7.7 2.4-5.8Z" />
              <path className="board-banner-shine" d="m12 4.9-1.35 4.25L12 17.6l1.35-8.45L12 4.9ZM5.6 10.7l3.05 2.2m9.75-3.05-3.7 3.05" />
            </g>
          </svg>
        </div>
      </section>

      <section className="board-activity-tabs" aria-label="내 게시판 활동 필터">
        {(Object.keys(activityLabels) as ActivityFilter[]).map((key) => (
          <button className={activityFilter === key ? "activity-tab active" : "activity-tab"} key={key} type="button" onClick={() => selectActivityFilter(key)}>
            {activityLabels[key]}
          </button>
        ))}
        <label className="board-sort-control">
          <span className="sr-only">게시글 정렬</span>
          <select aria-label="게시글 정렬" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            {(Object.keys(sortLabels) as SortOrder[]).map((key) => <option key={key} value={key}>{sortLabels[key]}</option>)}
          </select>
        </label>
      </section>

      <section className="board-page-layout">
        <article className="panel board-list-panel">
          <div className="form">
            <input className="search" placeholder="제목 또는 내용 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="tabs">
              <button className={category === "all" ? "tab active" : "tab"} type="button" onClick={() => setCategory("all")}>전체</button>
              {availableCategories.map((key) => (
                <button className={category === key ? "tab active" : "tab"} key={key} type="button" onClick={() => setCategory(key)}>
                  {categoryLabels[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="list" style={{ marginTop: 16 }}>
            {activityFilter === "my-comments" ? (
              <>
                {paginatedCommentEntries.map(({ post, comment }) => (
                  <div className="list-item board-list-link my-comment-list-link" key={comment.id}>
                    <div className="meta">
                      <span className="badge">{categoryLabels[post.category]}</span>
                      <BoardAuthorMenu userId={post.userId} authorName={post.authorName} currentUserId={user?.id} posts={posts} />
                      <span>조회 {post.viewCount}</span>
                      <span className="board-stat" aria-label={`댓글 ${post.comments.length}개`}><CommentIcon />{post.comments.length}</span>
                      <span className="recommend-meta board-stat" aria-label={`추천 ${post.recommendCount}개`}><RecommendIcon />{post.recommendCount}</span>
                    </div>
                    <Link className="board-entry-title" href={`/board/${post.id}?commentId=${comment.id}#comment-${comment.id}`}><strong>{post.title}</strong></Link>
                    <Link className="my-comment-preview" href={`/board/${post.id}?commentId=${comment.id}#comment-${comment.id}`}>
                      <span className="badge">내 댓글</span>
                      <p>{comment.content}</p>
                    </Link>
                  </div>
                ))}
                {myCommentEntries.length === 0 ? <div className="list-item">내가 쓴 댓글 목록이 없습니다.</div> : null}
              </>
            ) : (
              <>
                {paginatedPosts.map((post) => (
                  <div className="list-item board-list-link" key={post.id}>
                    <div className="meta">
                      <span className="badge">{categoryLabels[post.category]}</span>
                      <BoardAuthorMenu userId={post.userId} authorName={post.authorName} currentUserId={user?.id} posts={posts} />
                      <span>조회 {post.viewCount}</span>
                      <span className="board-stat" aria-label={`댓글 ${post.comments.length}개`}><CommentIcon />{post.comments.length}</span>
                      <span className="recommend-meta board-stat" aria-label={`추천 ${post.recommendCount}개`}><RecommendIcon />{post.recommendCount}</span>
                    </div>
                    <Link className="board-entry-title" href={`/board/${post.id}`}><strong>{post.title}</strong></Link>
                  </div>
                ))}
                {filteredPosts.length === 0 ? <div className="list-item">{activityFilter === "all" ? "아직 작성된 글이 없습니다." : `${activityLabels[activityFilter]} 목록이 없습니다.`}</div> : null}
              </>
            )}
          </div>
          <nav className="board-pagination" aria-label="게시글 페이지">
            <button className="board-page-button" type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>이전</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                className={safeCurrentPage === page ? "board-page-button active" : "board-page-button"}
                type="button"
                key={page}
                aria-current={safeCurrentPage === page ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button className="board-page-button" type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>다음</button>
          </nav>
        </article>

        <div className="board-sidebar-column">
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
                    <span className="board-popular-stats">
                      <span>조회 {post.viewCount}</span>
                      <span className="board-stat" aria-label={`댓글 ${post.comments.length}개`}><CommentIcon />{post.comments.length}</span>
                      <span className="board-popular-recommend board-stat" aria-label={`추천 ${post.recommendCount}개`}><RecommendIcon />{post.recommendCount}</span>
                    </span>
                  </span>
                </Link>
              ))}
              {popularPosts.length === 0 ? (
                <p className="board-popular-empty">아직 추천이나 댓글이 있는 게시글이 없습니다.</p>
              ) : null}
            </div>
          </aside>

          <section className="panel board-my-profile" aria-labelledby="board-my-profile-title">
            {user ? (
              <>
                <div className="board-profile-row">
                  <span className="board-profile-avatar"><BoardUserRank posts={posts} userId={user.id} /></span>
                  <Link className="board-profile-copy" href={`/board/users/${encodeURIComponent(user.id)}?tab=posts`}>
                    <span id="board-my-profile-title">내 프로필</span>
                    <strong>{user.nickname}</strong>
                    <small>게시판 활동 보기</small>
                  </Link>
                  <button className="board-profile-edit-button" type="button" aria-label="닉네임 수정" onClick={startNicknameEditing}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 3.7-.8L19 7.9a1.7 1.7 0 0 0 0-2.4l-.5-.5a1.7 1.7 0 0 0-2.4 0L5.8 15.3 5 19Z" /><path d="m14.8 6.3 2.9 2.9" /></svg>
                  </button>
                </div>
                {isNicknameEditing ? (
                  <form className="board-nickname-form" onSubmit={updateNickname}>
                    <input aria-label="새 닉네임" autoFocus maxLength={12} value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} />
                    <div>
                      <button className="button" type="submit">저장</button>
                      <button className="ghost-button" type="button" onClick={() => setIsNicknameEditing(false)}>취소</button>
                    </div>
                    {nicknameError ? <small className="error">{nicknameError}</small> : null}
                  </form>
                ) : null}
              </>
            ) : (
              <Link className="board-profile-login" href="/auth/login">
                <strong id="board-my-profile-title">내 프로필</strong>
                <small>로그인하고 수정 등급을 확인해 보세요.</small>
              </Link>
            )}
          </section>

          <button className="panel board-sidebar-rank-button" type="button" onClick={() => setIsRankGuideOpen(true)}>
            <BoardRankIcon className="violet" name="수정 등급" />
            <span className="board-sidebar-rank-copy">
              <strong>수정 등급</strong>
              <small>등급별 아이콘과 활동 기준 보기</small>
            </span>
            <span className="board-sidebar-rank-arrow" aria-hidden="true">›</span>
          </button>
        </div>
      </section>

      <button className="board-write-button" type="button" onClick={openComposer}>
        글 작성
      </button>

      {isRankGuideOpen ? (
        <div className="board-rank-guide-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsRankGuideOpen(false);
        }}>
          <section className="board-rank-guide" role="dialog" aria-modal="true" aria-labelledby="board-rank-guide-title">
            <div className="board-rank-guide-header">
              <div>
                <h2 id="board-rank-guide-title">수정 등급</h2>
                <p>게시판 활동에 따라 수정이 더 빛나는 모습으로 성장해요.</p>
              </div>
              <button className="board-rank-guide-close" type="button" aria-label="수정 등급 안내 닫기" onClick={() => setIsRankGuideOpen(false)}>×</button>
            </div>
            <div className="board-rank-guide-list">
              {BOARD_RANKS.map((rank) => (
                <div className="board-rank-guide-item" key={rank.name}>
                  <BoardRankIcon className={rank.className} name={rank.name} />
                  <div>
                    <strong>{rank.name}</strong>
                    <p>{rank.minimum === 0 ? "게시판 활동 시작 시" : `활동 점수 ${rank.minimum}점 이상`}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="board-rank-guide-note">게시글 1개당 3점, 댓글 1개당 1점이 쌓이며 작성한 게시글과 댓글을 기준으로 등급이 정해집니다.</p>
          </section>
        </div>
      ) : null}

      {isComposerOpen ? (
        <div className="board-composer-backdrop" role="presentation">
          <section className="board-composer" role="dialog" aria-modal="true" aria-labelledby="board-composer-title">
            <div className="section-title">
              <div>
                <h2 id="board-composer-title">글 작성</h2>
                {!user ? <Link className="badge" href="/auth/login">로그인 필요</Link> : <span className="badge">{user.nickname}</span>}
              </div>
              <div className="board-composer-actions">
                <button className="ghost-button" type="button" onClick={() => setIsDraftListOpen((open) => !open)}>
                  임시저장 {drafts.length > 0 ? `(${drafts.length})` : ""}
                </button>
                <span className="board-composer-action-divider" aria-hidden="true" />
                <button className="ghost-button board-composer-close-button" type="button" onClick={closeComposer}>
                  닫기
                </button>
              </div>
            </div>
            <form className="form board-composer-form" onSubmit={createPost}>
              {isDraftListOpen ? (
                <section className="board-draft-list" aria-label="임시저장한 글 목록">
                  <h3>임시저장한 글</h3>
                  {drafts.length > 0 ? (
                    <div className="board-draft-scroll">
                      {drafts.map((draft) => (
                        <div className="board-draft-row" key={draft.id}>
                          <button className="board-draft-item" type="button" onClick={() => loadDraft(draft)}>
                            <strong>{draft.title.trim() || "제목 없음"}</strong>
                            <span>{categoryLabels[draft.category]} · {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.savedAt))}</span>
                          </button>
                          <button className="board-draft-delete" type="button" aria-label={`${draft.title.trim() || "제목 없음"} 임시저장 삭제`} onClick={() => deleteDraft(draft)}>
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {drafts.length === 0 ? <p className="muted">임시저장한 글이 없습니다.</p> : null}
                </section>
              ) : null}
              <div className="field">
                <label htmlFor="post-category">카테고리</label>
                <select id="post-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as BoardPost["category"] }))}>
                  {availableCategories.map((key) => <option key={key} value={key}>{categoryLabels[key]}</option>)}
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
          {isCloseConfirmOpen ? (
            <div className="board-close-confirm-backdrop">
              <section className="board-close-confirm" role="alertdialog" aria-modal="true" aria-labelledby="board-close-confirm-title" aria-describedby="board-close-confirm-description">
                <div className="board-close-confirm-icon" aria-hidden="true">?</div>
                <h2 id="board-close-confirm-title">작성 중인 글을 임시저장할까요?</h2>
                <p id="board-close-confirm-description">임시저장하면 나중에 작성창에서 다시 불러올 수 있습니다.</p>
                <div className="board-close-confirm-actions">
                  <button className="button" type="button" onClick={saveDraftAndClose}>임시저장 후 닫기</button>
                  <button className="ghost-button" type="button" onClick={discardDraftAndClose}>저장하지 않고 닫기</button>
                  <button className="ghost-button" type="button" onClick={() => setIsCloseConfirmOpen(false)}>취소</button>
                </div>
              </section>
            </div>
          ) : null}
          {draftToDelete ? (
            <div className="board-close-confirm-backdrop">
              <section className="board-close-confirm board-draft-delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="board-draft-delete-title" aria-describedby="board-draft-delete-description">
                <div className="board-close-confirm-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7" /></svg>
                </div>
                <h2 id="board-draft-delete-title">임시저장 글을 삭제할까요?</h2>
                <p id="board-draft-delete-description"><strong>{draftToDelete.title.trim() || "제목 없음"}</strong><br />삭제한 임시저장 글은 다시 복구할 수 없습니다.</p>
                <div className="board-close-confirm-actions">
                  <button className="button board-draft-delete-confirm-button" type="button" onClick={confirmDeleteDraft}>삭제</button>
                  <button className="ghost-button" type="button" onClick={() => setDraftToDelete(null)}>취소</button>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
