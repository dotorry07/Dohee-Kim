import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { posts as seedPosts } from "@/lib/data";
import type { BoardPost } from "@/lib/types";

type SQLiteStatement = {
  get(...values: unknown[]): unknown;
  run(...values: unknown[]): unknown;
};

type SQLiteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SQLiteStatement;
};

type DatabaseSyncConstructor = new (path: string) => SQLiteDatabase;

const databaseDirectory = join(process.cwd(), ".data");
const databasePath = join(databaseDirectory, "board.sqlite");

const globalBoardDatabase = globalThis as typeof globalThis & {
  __newbieOnBoardDatabase?: SQLiteDatabase;
};

function getDatabase() {
  if (globalBoardDatabase.__newbieOnBoardDatabase) return globalBoardDatabase.__newbieOnBoardDatabase;

  mkdirSync(databaseDirectory, { recursive: true });
  // Node 22.5+ provides SQLite as a built-in server-only module.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: DatabaseSyncConstructor };
  const database = new DatabaseSync(databasePath);
  database.exec(`
    create table if not exists board_state (
      id text primary key,
      posts text not null,
      updated_at text not null
    )
  `);
  globalBoardDatabase.__newbieOnBoardDatabase = database;
  return database;
}

export function readBoardPosts(): BoardPost[] {
  const database = getDatabase();
  const row = database.prepare("select posts from board_state where id = ?").get("default") as { posts: string } | undefined;
  if (row) return JSON.parse(row.posts) as BoardPost[];

  writeBoardPosts(seedPosts);
  return structuredClone(seedPosts);
}

export function writeBoardPosts(posts: BoardPost[]) {
  const database = getDatabase();
  database.prepare(`
    insert into board_state (id, posts, updated_at)
    values (?, ?, ?)
    on conflict(id) do update set posts = excluded.posts, updated_at = excluded.updated_at
  `).run("default", JSON.stringify(posts), new Date().toISOString());
}
