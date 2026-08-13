"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBoardPosts, loadPersistentBoardPosts, subscribeToBoardPosts } from "@/lib/board-storage";
import { BOARD_RANKS, BoardRankIcon, BoardUserRank } from "@/components/board-user-rank";
import { getStoredUser } from "@/lib/auth/client";
import type { BoardPost, Comment } from "@/lib/types";

type UserComment = { post: BoardPost; comment: Comment };
type UserActivityTab = "posts" | "comments" | "recommended";
type ActivityIconName = "post" | "comment" | "like" | "arrow" | "back";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "자유게시판",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

function ActivityIcon({ icon }: { icon: ActivityIconName }) {
  return (
    <svg className="board-user-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      {icon === "post" ? <><path d="M7 4.5h7.5L18 8v11.5H7z" /><path d="M14.5 4.5V8H18M9.5 12h5M9.5 15.5h5" /></> : null}
      {icon === "comment" ? <><path d="M5.5 6.5h13v8.2H9.3l-3.8 3z" /><path d="M9 10h6M9 12.8h3.8" /></> : null}
      {icon === "like" ? <><path d="M7.5 10.5v8H5v-8zM7.5 10.5l4-6c.8.2 1.2.9 1 1.8L12 9.5h5.4c1 0 1.8.9 1.6 1.9l-.9 5.1c-.2 1.2-1.2 2-2.4 2H7.5" /></> : null}
      {icon === "arrow" ? <path d="m9 5 7 7-7 7" /> : null}
      {icon === "back" ? <path d="m14.5 6-6 6 6 6" /> : null}
    </svg>
  );
}

export default function BoardUserActivityPage() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [activeTab, setActiveTab] = useState<UserActivityTab>("posts");
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const isOwnPage = user?.id === params.userId;

  useEffect(() => {
    setPosts(getBoardPosts());
    void loadPersistentBoardPosts().then(setPosts);
    setUser(getStoredUser());
    return subscribeToBoardPosts(setPosts);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(tab === "comments" || (tab === "recommended" && isOwnPage) ? tab : "posts");
  }, [isOwnPage, searchParams]);

  const authoredPosts = useMemo(() => posts
    .filter((post) => post.userId === params.userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)), [params.userId, posts]);

  const authoredComments = useMemo(() => posts
    .flatMap((post) => post.comments
      .filter((comment) => comment.userId === params.userId)
      .map((comment): UserComment => ({ post, comment })))
    .sort((a, b) => Date.parse(b.comment.createdAt) - Date.parse(a.comment.createdAt)), [params.userId, posts]);

  const recommendedPosts = useMemo(() => posts
    .filter((post) => post.recommendedUserIds.includes(params.userId))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [params.userId, posts]);

  const authorName = authoredPosts[0]?.authorName ?? authoredComments[0]?.comment.authorName ?? "사용자";
  const activityExp = authoredPosts.length * 3 + authoredComments.length;
  const currentRankIndex = Math.max(0, BOARD_RANKS.findIndex((rank, index) => {
    const nextRank = BOARD_RANKS[index + 1];
    return activityExp >= rank.minimum && (!nextRank || activityExp < nextRank.minimum);
  }));
  const currentRank = BOARD_RANKS[currentRankIndex] ?? BOARD_RANKS[0];
  const nextRank = BOARD_RANKS[currentRankIndex + 1] ?? null;
  const currentMinimum = currentRank.minimum;
  const nextMinimum = nextRank?.minimum ?? currentRank.minimum;
  const progressRange = Math.max(1, nextMinimum - currentMinimum);
  const progressPercent = nextRank ? Math.min(100, Math.max(0, ((activityExp - currentMinimum) / progressRange) * 100)) : 100;
  const expToNext = nextRank ? Math.max(0, nextRank.minimum - activityExp) : 0;
  const visibleTab = activeTab === "recommended" && !isOwnPage ? "posts" : activeTab;

  return (
    <main className="page board-user-page">
      <section className="page-header board-user-hero">
        <div className="app-banner-inner">
          <div className="board-user-hero-copy app-banner-copy">
            <Link className="ghost-button board-user-back-link" href="/board"><ActivityIcon icon="back" />게시판으로</Link>
            <h1 className="board-user-title">{authorName}<BoardUserRank posts={posts} userId={params.userId} />님의 활동</h1>
            <p>{isOwnPage ? "내가 작성한 게시글과 댓글, 추천한 글을 확인할 수 있습니다." : "이 사용자가 작성한 게시글과 댓글을 확인할 수 있습니다."}</p>
            <div className="app-banner-tags" aria-hidden="true">
              <span>작성한 글 {authoredPosts.length}</span>
              <span>작성한 댓글 {authoredComments.length}</span>
              {isOwnPage ? <span>추천한 글 {recommendedPosts.length}</span> : null}
            </div>
          </div>
          <div className="app-banner-art board-user-hero-art" aria-hidden="true">
            <img src="/images/board-user-hero.png" alt="" />
          </div>
        </div>
      </section>

      <section className="board-user-exp-card" aria-label={`${authorName}님의 게시판 활동 EXP`}>
        <div className="board-user-exp-rank">
          <BoardRankIcon className={currentRank.className} name={currentRank.name} />
        </div>
        <div className="board-user-exp-content">
          <div className="board-user-exp-stages">
            <div className="board-user-exp-stage current">
              <span>현재 단계</span>
              <strong>{currentRank.name}</strong>
              <em>{activityExp} EXP</em>
            </div>
            {nextRank ? (
              <div className="board-user-exp-stage">
                <span>다음 단계</span>
                <strong>{nextRank.name}</strong>
                <em>{nextRank.minimum} EXP</em>
              </div>
            ) : (
              <div className="board-user-exp-stage">
                <span>최고 단계</span>
                <strong>{currentRank.name}</strong>
                <em>MAX</em>
              </div>
            )}
          </div>
          <div className="board-user-exp-track" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
            <i className="current" style={{ left: `${progressPercent}%` }} />
            {nextRank ? <i style={{ left: "100%" }} /> : null}
          </div>
          <div className="board-user-exp-meta">
            <span>{activityExp} / {nextRank ? nextRank.minimum : activityExp} EXP</span>
            {nextRank ? <span>{expToNext} EXP 남음</span> : <span>최고 단계 달성</span>}
          </div>
        </div>
      </section>

      <div className="board-user-activity-tabs" role="tablist" aria-label="사용자 게시판 활동">
        <button className={visibleTab === "posts" ? "activity-tab active" : "activity-tab"} type="button" onClick={() => setActiveTab("posts")}><ActivityIcon icon="post" />작성한 글 {authoredPosts.length}</button>
        <button className={visibleTab === "comments" ? "activity-tab active" : "activity-tab"} type="button" onClick={() => setActiveTab("comments")}><ActivityIcon icon="comment" />작성한 댓글 {authoredComments.length}</button>
        {isOwnPage ? <button className={visibleTab === "recommended" ? "activity-tab active" : "activity-tab"} type="button" onClick={() => setActiveTab("recommended")}><ActivityIcon icon="like" />추천한 글 {recommendedPosts.length}</button> : null}
      </div>
      <section className="panel board-user-activity">
        <div className="list board-user-activity-list">
          {visibleTab === "posts" ? authoredPosts.map((post) => (
            <Link className="list-item board-list-link board-user-row" href={`/board/${post.id}`} key={post.id}>
              <span className="board-user-row-icon"><ActivityIcon icon="post" /></span>
              <div className="board-user-row-main">
                <div className="meta">
                  <span className="badge">{categoryLabels[post.category]}</span>
                  <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(post.createdAt))}</span>
                  <span>조회 {post.viewCount}</span>
                  <span>댓글 {post.comments.length}</span>
                  <span className="recommend-meta">추천 {post.recommendCount}</span>
                </div>
                <strong>{post.title}</strong>
              </div>
              <ActivityIcon icon="arrow" />
            </Link>
          )) : visibleTab === "comments" ? authoredComments.map(({ post, comment }) => (
            <Link className="list-item board-list-link board-user-row my-comment-list-link" href={`/board/${post.id}?commentId=${comment.id}#comment-${comment.id}`} key={comment.id}>
              <span className="board-user-row-icon"><ActivityIcon icon="comment" /></span>
              <div className="board-user-row-main">
                <div className="meta"><span className="badge">{categoryLabels[post.category]}</span><span>{post.title}</span></div>
                <div className="my-comment-preview"><p>{comment.content}</p></div>
              </div>
              <ActivityIcon icon="arrow" />
            </Link>
          )) : recommendedPosts.map((post) => (
            <Link className="list-item board-list-link board-user-row" href={`/board/${post.id}`} key={post.id}>
              <span className="board-user-row-icon"><ActivityIcon icon="like" /></span>
              <div className="board-user-row-main">
                <div className="meta">
                  <span className="badge">{categoryLabels[post.category]}</span>
                  <span>{post.authorName}</span>
                  <span>조회 {post.viewCount}</span>
                  <span>댓글 {post.comments.length}</span>
                  <span className="recommend-meta">추천 {post.recommendCount}</span>
                </div>
                <strong>{post.title}</strong>
              </div>
              <ActivityIcon icon="arrow" />
            </Link>
          ))}
          {visibleTab === "posts" && authoredPosts.length === 0 ? <div className="list-item board-user-empty">작성한 게시글이 없습니다.</div> : null}
          {visibleTab === "comments" && authoredComments.length === 0 ? <div className="list-item board-user-empty">작성한 댓글이 없습니다.</div> : null}
          {isOwnPage && visibleTab === "recommended" && recommendedPosts.length === 0 ? <div className="list-item board-user-empty">추천한 게시글이 없습니다.</div> : null}
        </div>
      </section>
    </main>
  );
}
