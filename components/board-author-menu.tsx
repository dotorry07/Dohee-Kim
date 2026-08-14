"use client";

import Link from "next/link";
import { BoardUserRank } from "@/components/board-user-rank";
import type { BoardPost } from "@/lib/types";

type BoardAuthorMenuProps = {
  userId: string;
  authorName: string;
  currentUserId?: string;
  profileImage?: string;
  posts: BoardPost[];
};

export function BoardAuthorMenu({ userId, authorName, currentUserId, profileImage, posts }: BoardAuthorMenuProps) {
  const avatar = (
    <span
      className={profileImage ? "board-author-avatar has-image" : "board-author-avatar"}
      style={profileImage ? { backgroundImage: `url(${profileImage})` } : undefined}
      aria-hidden="true"
    >
      {profileImage ? <img src={profileImage} alt="" /> : authorName.slice(0, 1)}
    </span>
  );

  if (userId === currentUserId) {
    return <span className="board-author-name">{avatar}{authorName}<BoardUserRank posts={posts} userId={userId} /></span>;
  }

  return (
    <Link className="board-author-name" href={`/board/users/${encodeURIComponent(userId)}?tab=posts`} onClick={(event) => event.stopPropagation()}>
      {avatar}{authorName}<BoardUserRank posts={posts} userId={userId} />
    </Link>
  );
}
