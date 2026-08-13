"use client";

import Link from "next/link";
import { BoardUserRank } from "@/components/board-user-rank";
import type { BoardPost } from "@/lib/types";

type BoardAuthorMenuProps = {
  userId: string;
  authorName: string;
  currentUserId?: string;
  posts: BoardPost[];
};

export function BoardAuthorMenu({ userId, authorName, currentUserId, posts }: BoardAuthorMenuProps) {
  if (userId === currentUserId) return <span className="board-author-name">{authorName}<BoardUserRank posts={posts} userId={userId} /></span>;

  return (
    <Link className="board-author-name" href={`/board/users/${encodeURIComponent(userId)}?tab=posts`}>
      {authorName}<BoardUserRank posts={posts} userId={userId} />
    </Link>
  );
}
