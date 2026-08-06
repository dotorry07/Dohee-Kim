"use client";

import Link from "next/link";
import { useState } from "react";
import { BoardUserRank } from "@/components/board-user-rank";
import type { BoardPost } from "@/lib/types";

type BoardAuthorMenuProps = {
  userId: string;
  authorName: string;
  currentUserId?: string;
  posts: BoardPost[];
};

export function BoardAuthorMenu({ userId, authorName, currentUserId, posts }: BoardAuthorMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (userId === currentUserId) return <span className="board-author-name">{authorName}<BoardUserRank posts={posts} userId={userId} /></span>;

  return (
    <span className="board-author-menu">
      <button className="board-author-button" type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen}>
        {authorName}<BoardUserRank posts={posts} userId={userId} />
      </button>
      {isOpen ? (
        <span className="board-author-popover">
          <Link href={`/board/users/${encodeURIComponent(userId)}?tab=posts`}>작성한 글</Link>
          <Link href={`/board/users/${encodeURIComponent(userId)}?tab=comments`}>작성한 댓글</Link>
        </span>
      ) : null}
    </span>
  );
}
