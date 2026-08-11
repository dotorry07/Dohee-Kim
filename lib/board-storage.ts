import { posts as seedPosts } from "@/lib/data";
import type { BoardPost } from "@/lib/types";

const STORAGE_KEY = "newbie-on-board-posts";
const BOARD_POSTS_CHANGED_EVENT = "newbie-on-board-posts-changed";
let cachedPosts = normalizeBoardPosts(seedPosts);

function normalizeBoardPosts(posts: BoardPost[]) {
  return posts.map((post) => ({
    ...post,
    recommendCount: post.recommendCount ?? post.recommendedUserIds?.length ?? 0,
    recommendedUserIds: post.recommendedUserIds ?? [],
    comments: post.comments ?? []
  }));
}

function readLocalBoardPosts() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const posts = JSON.parse(stored);
    return Array.isArray(posts) ? normalizeBoardPosts(posts as BoardPost[]) : null;
  } catch {
    return null;
  }
}

function writeLocalBoardPosts(posts: BoardPost[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeBoardPosts(posts)));
}

export function getBoardPosts() {
  if (typeof window === "undefined") {
    return normalizeBoardPosts(seedPosts);
  }
  const localPosts = readLocalBoardPosts();
  if (localPosts) {
    cachedPosts = localPosts;
    return localPosts;
  }
  return cachedPosts;
}

export async function loadPersistentBoardPosts() {
  try {
    const response = await fetch("/api/board-state", { cache: "no-store" });
    if (!response.ok) return cachedPosts;

    const body = await response.json() as { posts: BoardPost[] };
    const posts = normalizeBoardPosts(body.posts);
    cachedPosts = posts;
    writeLocalBoardPosts(posts);
    return posts;
  } catch {
    return readLocalBoardPosts() ?? cachedPosts;
  }
}

export async function saveBoardPosts(posts: BoardPost[]) {
  if (typeof window === "undefined") {
    return false;
  }

  const normalizedPosts = normalizeBoardPosts(posts);
  cachedPosts = normalizedPosts;
  writeLocalBoardPosts(normalizedPosts);
  window.queueMicrotask(() => window.dispatchEvent(new Event(BOARD_POSTS_CHANGED_EVENT)));
  try {
    const response = await fetch("/api/board-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: normalizedPosts })
    });
    return response.ok;
  } catch {
    return false;
  }
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
