"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BoardAuthorMenu } from "@/components/board-author-menu";
import { BannerTagIcon } from "@/components/BannerTagIcon";
import { BOARD_RANKS, BoardRankIcon, BoardUserRank } from "@/components/board-user-rank";
import { getStoredUser } from "@/lib/auth/client";
import { getBoardPosts, loadPersistentBoardPosts, saveBoardPosts, subscribeToBoardPosts } from "@/lib/board-storage";
import type { BoardPost } from "@/lib/types";
import { TimetableSelect } from "../timetable/TimetableSelect";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "자유게시판",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

const availableCategories: BoardPost["category"][] = ["free", "department", "info"];

type SortOrder = "latest" | "recommended" | "views" | "oldest";

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

const sortLabels: Record<SortOrder, string> = {
  latest: "최신순",
  recommended: "추천순",
  views: "조회순",
  oldest: "오래된 순"
};

const sortOptions = (Object.keys(sortLabels) as SortOrder[]).map((key) => ({
  value: key,
  label: sortLabels[key]
}));

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
  const [draftToLoad, setDraftToLoad] = useState<BoardDraft | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<BoardDraft | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    setPosts(getBoardPosts());
    void loadPersistentBoardPosts().then(setPosts);
    setUser(getStoredUser());
    setDrafts(getBoardDrafts());

    return subscribeToBoardPosts(setPosts);
  }, []);

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => category === "all" || post.category === category || (category === "free" && post.category === "freshman"))
      .filter((post) => !normalized || `${post.title} ${post.content}`.toLowerCase().includes(normalized))
      .sort((a, b) => comparePosts(a, b, sortOrder));
  }, [category, posts, query, sortOrder]);

  const totalItems = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / POSTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(pageStart, pageStart + POSTS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, query, sortOrder]);

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
      setPosts(nextPosts);
      if (!saved) {
        setError("Supabase DB에는 저장하지 못했습니다. 이 브라우저에는 임시 저장했습니다. Supabase SQL 적용 상태를 확인해 주세요.");
        return;
      }
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
    setDraftToLoad(null);
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
    setDraftToLoad(null);
    setError("");
  }

  function requestLoadDraft(draft: BoardDraft) {
    setDraftToLoad(draft);
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

  return (
    <main className="page board-page">
      <section className="page-header board-page-header">
        <div className="app-banner-inner">
          <div className="app-banner-copy">
            <h1>게시판</h1>
            <p>자유게시판, 학과별 게시판, 정보 공유 글을 확인합니다.</p>
            <div className="app-banner-tags" aria-hidden="true">
              <span><BannerTagIcon icon="chat" />자유게시판</span>
              <span><BannerTagIcon icon="building" />학과별 게시판</span>
              <span><BannerTagIcon icon="bulb" />정보 공유</span>
              <span><BannerTagIcon icon="write" />글 작성</span>
              <span><BannerTagIcon icon="like" />댓글/추천</span>
            </div>
          </div>
          <div className="app-banner-art board-banner-art" aria-hidden="true">
            <img src="/images/banner-board.png" alt="" />
          </div>
        </div>
      </section>

      <section className="board-page-layout">
        <article className="panel board-list-panel">
          <div className="form">
            <input className="search" placeholder="제목 또는 내용 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="board-filter-row">
              <div className="tabs">
                <button className={category === "all" ? "tab active" : "tab"} type="button" onClick={() => setCategory("all")}>전체</button>
                {availableCategories.map((key) => (
                  <button className={category === key ? "tab active" : "tab"} key={key} type="button" onClick={() => setCategory(key)}>
                    {categoryLabels[key]}
                  </button>
                ))}
              </div>
              <div className="board-sort-control">
                <TimetableSelect
                  ariaLabel="게시글 정렬"
                  value={sortOrder}
                  options={sortOptions}
                  onChange={(nextOrder) => setSortOrder(nextOrder as SortOrder)}
                />
              </div>
            </div>
          </div>
          <div className="list" style={{ marginTop: 16 }}>
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
            {filteredPosts.length === 0 ? <div className="list-item">아직 작성된 글이 없습니다.</div> : null}
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
          <section className="panel board-my-profile" aria-labelledby="board-my-profile-title">
            {user ? (
              <>
                <div className="board-profile-card">
                  <Link className="board-profile-avatar" href={`/board/users/${encodeURIComponent(user.id)}?tab=posts`} aria-label={`${user.nickname} 게시판 활동 보기`}>
                    <BoardUserRank posts={posts} userId={user.id} />
                  </Link>
                  <div className="board-profile-copy">
                    <span id="board-my-profile-title">내 프로필</span>
                    <div className="board-profile-name-row">
                      <Link href={`/board/users/${encodeURIComponent(user.id)}?tab=posts`}>
                        <strong>{user.nickname}</strong>
                      </Link>
                    </div>
                    <Link className="board-profile-activity-button" href={`/board/users/${encodeURIComponent(user.id)}?tab=posts`}>
                      게시판 활동 보기
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <Link className="board-profile-login" href="/auth/login">
                <strong id="board-my-profile-title">내 프로필</strong>
                <small>로그인하고 수정 등급을 확인해 보세요.</small>
              </Link>
            )}
          </section>

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

          <button className="panel board-sidebar-rank-button" type="button" onClick={() => setIsRankGuideOpen(true)}>
            <BoardRankIcon className="rank-4" name="수정 등급" />
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
        <div className="board-composer-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeComposer();
        }}>
          <section className="board-composer" role="dialog" aria-modal="true" aria-labelledby="board-composer-title">
            <div className="section-title">
              <div className="board-composer-title-copy">
                <span className="board-composer-title-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="m4.5 16.5-.7 3.7 3.7-.7L18.6 8.4 15.6 5.4 4.5 16.5Z" /><path d="m14.4 6.6 3 3" /></svg>
                </span>
                <div>
                  <h2 id="board-composer-title">글 작성</h2>
                  {!user ? <Link className="badge" href="/auth/login">로그인 필요</Link> : <span className="badge">새내기</span>}
                </div>
              </div>
              <div className="board-composer-actions">
                <button className="ghost-button" type="button" onClick={() => setIsDraftListOpen((open) => !open)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11l3 3v13H5V4Z" /><path d="M8 4v6h8V4M8 17h8" /></svg>
                  임시저장 {drafts.length > 0 ? `(${drafts.length})` : ""}
                </button>
                <span className="board-composer-action-divider" aria-hidden="true" />
                <button className="ghost-button board-composer-close-button" type="button" onClick={closeComposer}>
                  <span aria-hidden="true">×</span> 닫기
                </button>
              </div>
            </div>
            <form className="form board-composer-form" onSubmit={createPost}>
              {isDraftListOpen ? (
                <section className="board-draft-list" aria-label="임시저장한 글 목록">
                  <h3>임시저장한 글</h3>
                  <p className="board-draft-guide">클릭으로 불러오기</p>
                  {drafts.length > 0 ? (
                    <div className="board-draft-scroll">
                      {drafts.map((draft) => (
                        <div className="board-draft-row" key={draft.id}>
                          <button className="board-draft-item" type="button" onClick={() => requestLoadDraft(draft)}>
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
                <input id="post-title" maxLength={100} placeholder="제목을 입력해주세요" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="field board-content-field">
                <label htmlFor="post-content">내용</label>
                <textarea id="post-content" maxLength={5000} placeholder="내용을 입력해주세요" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />
              </div>
              <div className="field board-image-field">
                <label htmlFor="post-image">사진 첨부 (최대 750KB)</label>
                <div className="board-file-control">
                  <input id="post-image" type="file" accept="image/*" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => selectImage(event.target.files?.[0])} />
                  <label className="board-file-button" htmlFor="post-image">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 15v4h14v-4" /></svg>
                    파일 선택
                  </label>
                  <span>{image?.name ?? "선택된 파일 없음"}</span>
                </div>
              </div>
              {image ? (
                <div className="board-image-preview">
                  <img src={image.dataUrl} alt="첨부 이미지 미리보기" />
                  <button className="ghost-button mt-2" type="button" onClick={() => setImage(null)}>사진 제거</button>
                </div>
              ) : null}
              {error ? <div className="error">{error}</div> : null}
              <div className="board-submit-row">
                <button className="button board-submit-button" type="submit">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 16.5-.7 3.7 3.7-.7L18.6 8.4 15.6 5.4 4.5 16.5Z" /><path d="m14.4 6.6 3 3" /></svg>
                  등록
                </button>
              </div>
            </form>
          </section>
          {isCloseConfirmOpen ? (
            <div className="board-close-confirm-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsCloseConfirmOpen(false);
            }}>
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
          {draftToLoad ? (
            <div className="board-close-confirm-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDraftToLoad(null);
            }}>
              <section className="board-close-confirm board-draft-load-confirm" role="alertdialog" aria-modal="true" aria-labelledby="board-draft-load-title" aria-describedby="board-draft-load-description">
                <div className="board-close-confirm-icon" aria-hidden="true">?</div>
                <h2 id="board-draft-load-title">임시저장된 글을 불러오시겠습니까?</h2>
                <p id="board-draft-load-description"><strong>{draftToLoad.title.trim() || "제목 없음"}</strong></p>
                <div className="board-close-confirm-actions">
                  <button className="button" type="button" onClick={() => loadDraft(draftToLoad)}>예</button>
                  <button className="ghost-button" type="button" onClick={() => setDraftToLoad(null)}>아니오</button>
                </div>
              </section>
            </div>
          ) : null}
          {draftToDelete ? (
            <div className="board-close-confirm-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDraftToDelete(null);
            }}>
              <section className="board-close-confirm board-draft-delete-confirm delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="board-draft-delete-title" aria-describedby="board-draft-delete-description">
                <div className="board-close-confirm-icon delete-confirm-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 10v7m4-7v7" /></svg>
                </div>
                <h2 id="board-draft-delete-title">임시저장 글을 삭제할까요?</h2>
                <p id="board-draft-delete-description"><strong>{draftToDelete.title.trim() || "제목 없음"}</strong><br />삭제한 임시저장 글은 다시 복구할 수 없습니다.</p>
                <div className="board-close-confirm-actions">
                  <button className="button" type="button" onClick={confirmDeleteDraft}>삭제</button>
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
