import type { BoardPost } from "@/lib/types";

type BoardUserRankProps = {
  posts: BoardPost[];
  userId: string;
};

export const BOARD_RANKS = [
  { minimum: 0, name: "새싹 수정", className: "seed" },
  { minimum: 5, name: "보랏빛 수정", className: "violet" },
  { minimum: 15, name: "푸른 수정", className: "blue" },
  { minimum: 30, name: "빛나는 수정", className: "radiant" }
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
  return (
    <span className={`board-rank-badge ${className}`} data-rank-name={name} aria-label={ariaLabel}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="rank-gem" d="M8.4 8.1 12 2.6l3.6 5.5-1.15 11.6h-4.9L8.4 8.1Z" />
        <path className="rank-gem rank-gem-side" d="m7.5 7.25 2.2 3.95-.9 8-4.65-3.7-.35-5.3 3.7-2.95ZM16.5 6.2l3.7 3.2-.8 6.9-4.95 3.4-.35-7.7 2.4-5.8Z" />
        <path className="rank-shine" d="m12 4.9-1.35 4.25L12 17.6l1.35-8.45L12 4.9ZM5.6 10.7l3.05 2.2m9.75-3.05-3.7 3.05" />
      </svg>
    </span>
  );
}
