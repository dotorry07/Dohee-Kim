import { posts as seedPosts } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { createClient } from "@supabase/supabase-js";
import type { BoardPost } from "@/lib/types";

type BoardStateRow = {
  id: string;
  posts: BoardPost[];
};

type SupabaseRestError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const BOARD_STATE_ID = "default";

function createBoardSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseAdminClient();
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false
    }
  });
}

function normalizeBoardPosts(posts: BoardPost[]) {
  return posts.map((post) => ({
    ...post,
    recommendCount: post.recommendCount ?? post.recommendedUserIds?.length ?? 0,
    recommendedUserIds: post.recommendedUserIds ?? [],
    comments: post.comments ?? []
  }));
}

export async function readBoardPosts(): Promise<BoardPost[]> {
  const supabase = createBoardSupabaseClient();
  const { data, error } = await supabase
    .from("board_state")
    .select("id, posts")
    .eq("id", BOARD_STATE_ID)
    .maybeSingle<BoardStateRow>();

  if (error) {
    throw error as Error & SupabaseRestError;
  }

  if (data) {
    return normalizeBoardPosts(data.posts);
  }

  const posts = normalizeBoardPosts(structuredClone(seedPosts));
  await writeBoardPosts(posts);
  return posts;
}

export async function writeBoardPosts(posts: BoardPost[]) {
  const supabase = createBoardSupabaseClient();
  const { error } = await supabase
    .from("board_state")
    .upsert(
      {
        id: BOARD_STATE_ID,
        posts: normalizeBoardPosts(posts),
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

  if (error) {
    throw error as Error & SupabaseRestError;
  }
}
