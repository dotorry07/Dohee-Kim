import { posts as seedPosts } from "@/lib/data";
import type { BoardPost } from "@/lib/types";

const STORAGE_KEY = "newbie-on-board-posts";
const BOARD_POSTS_CHANGED_EVENT = "newbie-on-board-posts-changed";

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
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeBoardPosts(posts)));
  window.queueMicrotask(() => window.dispatchEvent(new Event(BOARD_POSTS_CHANGED_EVENT)));
}

export function subscribeToBoardPosts(onChange: (posts: BoardPost[]) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onChange(getBoardPosts());
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      handleChange();
    }
  };

  window.addEventListener(BOARD_POSTS_CHANGED_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(BOARD_POSTS_CHANGED_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}
