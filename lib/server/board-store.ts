import { posts as seedPosts } from "@/lib/data";
import type { BoardPost } from "@/lib/types";

const globalBoardStore = globalThis as typeof globalThis & {
  __newbieOnBoardPosts?: BoardPost[];
};

export function getBoardPostStore() {
  globalBoardStore.__newbieOnBoardPosts ??= structuredClone(seedPosts);
  return globalBoardStore.__newbieOnBoardPosts;
}
