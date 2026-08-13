"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getBoardPosts, loadPersistentBoardPosts, subscribeToBoardPosts } from "@/lib/board-storage";
import { BOARD_RANKS, BoardRankIcon, BoardUserRank } from "@/components/board-user-rank";
import type { BoardPost, Comment } from "@/lib/types";

type UserComment = { post: BoardPost; comment: Comment };
type UserActivityTab = "posts" | "comments" | "recommended";

const categoryLabels: Record<BoardPost["category"], string> = {
  freshman: "자유게시판",
  free: "자유게시판",
  department: "학과별",
  info: "정보 공유"
};

export default function BoardUserActivityPage() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [activeTab, setActiveTab] = useState<UserActivityTab>("posts");

  useEffect(() => {
    setPosts(getBoardPosts());
    void loadPersistentBoardPosts().then(setPosts);
    return subscribeToBoardPosts(setPosts);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(tab === "comments" || tab === "recommended" ? tab : "posts");
  }, [searchParams]);

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

  return (
    <main className="page">
      <section className="page-header">
        <Link className="ghost-button" href="/board">게시판으로</Link>
        <h1 className="board-user-title">{authorName}<BoardUserRank posts={posts} userId={params.userId} />님의 활동</h1>
        <p>이 사용자가 작성한 게시글과 댓글, 추천한 글을 확인할 수 있습니다.</p>
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
        <button className={activeTab === "posts" ? "activity-tab active" : "activity-tab"} type="button" onClick={() => setActiveTab("posts")}>작성한 글 {authoredPosts.length}</button>
        <button className={activeTab === "comments" ? "activity-tab active" : "activity-tab"} type="button" onClick={() => setActiveTab("comments")}>작성한 댓글 {authoredComments.length}</button>
        <button className={activeTab === "recommended" ? "activity-tab active" : "activity-tab"} type="button" onClick={() => setActiveTab("recommended")}>추천한 글 {recommendedPosts.length}</button>
      </div>
      <section className="panel board-user-activity">
        <div className="list board-user-activity-list">
          {activeTab === "posts" ? authoredPosts.map((post) => (
            <Link className="list-item board-list-link" href={`/board/${post.id}`} key={post.id}>
              <div className="meta">
                <span className="badge">{categoryLabels[post.category]}</span>
                <span>{new Intl.DateTimeFormat("ko-KR").format(new Date(post.createdAt))}</span>
                <span>조회 {post.viewCount}</span>
                <span>댓글 {post.comments.length}</span>
                <span className="recommend-meta">추천 {post.recommendCount}</span>
              </div>
              <strong>{post.title}</strong>
            </Link>
          )) : activeTab === "comments" ? authoredComments.map(({ post, comment }) => (
            <Link className="list-item board-list-link my-comment-list-link" href={`/board/${post.id}?commentId=${comment.id}#comment-${comment.id}`} key={comment.id}>
              <div className="meta"><span className="badge">{categoryLabels[post.category]}</span><span>{post.title}</span></div>
              <div className="my-comment-preview"><p>{comment.content}</p></div>
            </Link>
          )) : recommendedPosts.map((post) => (
            <Link className="list-item board-list-link" href={`/board/${post.id}`} key={post.id}>
              <div className="meta">
                <span className="badge">{categoryLabels[post.category]}</span>
                <span>{post.authorName}</span>
                <span>조회 {post.viewCount}</span>
                <span>댓글 {post.comments.length}</span>
                <span className="recommend-meta">추천 {post.recommendCount}</span>
              </div>
              <strong>{post.title}</strong>
            </Link>
          ))}
          {activeTab === "posts" && authoredPosts.length === 0 ? <div className="list-item">작성한 게시글이 없습니다.</div> : null}
          {activeTab === "comments" && authoredComments.length === 0 ? <div className="list-item">작성한 댓글이 없습니다.</div> : null}
          {activeTab === "recommended" && recommendedPosts.length === 0 ? <div className="list-item">추천한 게시글이 없습니다.</div> : null}
        </div>
      </section>
    </main>
  );
}
