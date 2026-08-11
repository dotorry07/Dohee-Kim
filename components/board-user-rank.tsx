import type { BoardPost } from "@/lib/types";

type BoardUserRankProps = {
  posts: BoardPost[];
  userId: string;
};

export const BOARD_RANKS = [
  { minimum: 0, name: "투명 수정", className: "rank-1", imageSrc: "/images/board-rank-1.png" },
  { minimum: 5, name: "하늘 수정", className: "rank-2", imageSrc: "/images/board-rank-2.png" },
  { minimum: 15, name: "푸른 수정", className: "rank-3", imageSrc: "/images/board-rank-3.png" },
  { minimum: 30, name: "연보라 수정", className: "rank-4", imageSrc: "/images/board-rank-4.png" },
  { minimum: 50, name: "보라 수정", className: "rank-5", imageSrc: "/images/board-rank-5.png" }
] as const;

export function BoardUserRank({ posts, userId }: BoardUserRankProps) {
  const postCount = posts.filter((post) => post.userId === userId).length;
  const commentCount = posts.reduce((count, post) => count + post.comments.filter((comment) => comment.userId === userId).length, 0);
  const score = postCount * 3 + commentCount;
  const rank = [...BOARD_RANKS].reverse().find((item) => score >= item.minimum) ?? BOARD_RANKS[0];

  return (
    <BoardRankIcon className={rank.className} name={rank.name} ariaLabel={`${rank.name}, 게시글 ${postCount}개, 댓글 ${commentCount}개`} />
  );
}

type BoardRankIconProps = {
  className: (typeof BOARD_RANKS)[number]["className"];
  name: string;
  ariaLabel?: string;
};

export function BoardRankIcon({ className, name, ariaLabel = name }: BoardRankIconProps) {
  const rank = BOARD_RANKS.find((item) => item.className === className) ?? BOARD_RANKS[0];

  return (
    <span className={`board-rank-badge ${className}`} data-rank-name={name} aria-label={ariaLabel}>
      <img src={rank.imageSrc} alt="" aria-hidden="true" />
    </span>
  );
}
