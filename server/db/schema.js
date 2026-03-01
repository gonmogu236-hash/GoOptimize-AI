/**
 * SQLiteデータベーススキーマ
 * sql.js（Pure JS SQLite）を使用
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'gooptimize.db');

let db = null;

export async function initDB() {
    const SQL = await initSqlJs();

    // dataディレクトリ作成
    const dir = dirname(DB_PATH);
    mkdirSync(dir, { recursive: true });

    // 既存DBがあれば読み込み
    if (existsSync(DB_PATH)) {
        const buffer = readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // テーブル作成
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      rank TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      sgf_content TEXT,
      player_black TEXT,
      player_white TEXT,
      result TEXT,
      total_moves INTEGER,
      komi REAL,
      date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS analysis_results (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      scores_json TEXT,
      win_rates_json TEXT,
      weaknesses_json TEXT,
      play_style_json TEXT,
      diagnostic_json TEXT,
      learning_plan_json TEXT,
      estimated_rank TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (game_id) REFERENCES games(id)
    )
  `);

    saveDB();
    console.log('✅ Database initialized');
    return db;
}

export function getDB() {
    if (!db) throw new Error('Database not initialized');
    return db;
}

export function saveDB() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
}

export { DB_PATH };
