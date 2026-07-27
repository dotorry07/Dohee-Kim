import { posts as seedPosts } from "@/lib/data";
import type { BoardPost } from "@/lib/types";

const STORAGE_KEY = "newbie-on-board-posts";

function normalizeBoardPosts(posts: BoardPost[]) {
  return posts.map((post) => ({
    ...post,
    recommendCount: post.recommendCount ?? post.recommendedUserIds?.length ?? 0,
    recommendedUserIds: post.recommendedUserIds ?? []
  }));
}

export function getBoardPosts() {
  if (typeof window === "undefined") {
    return normalizeBoardPosts(seedPosts);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return normalizeBoardPosts(seedPosts);
  }

  try {
    return normalizeBoardPosts(JSON.parse(stored) as BoardPost[]);
  } catch {
    return normalizeBoardPosts(seedPosts);
  }
}

export function saveBoardPosts(posts: BoardPost[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}
