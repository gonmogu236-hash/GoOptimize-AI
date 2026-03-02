/**
 * SQLiteデータベーススキーマ
 * sql.js（Pure JS SQLite）を使用
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DB_DIR, 'gooptimize.db');

let db = null;

export async function initDB() {
  try {
    const SQL = await initSqlJs();

    // dataディレクトリ作成（必ず存在を保証）
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }

    // 既存DBがあれば読み込み
    if (existsSync(DB_PATH)) {
      console.log('📂 Loading existing database from:', DB_PATH);
      const buffer = readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      console.log('🆕 Creating new in-memory database');
      db = new SQL.Database();
    }

    // テーブル作成（エラーが出ても個別に処理）
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                rank TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )`,
      `CREATE TABLE IF NOT EXISTS games (
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
            )`,
      `CREATE TABLE IF NOT EXISTS analysis_results (
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
            )`
    ];

    for (const sql of tables) {
      try {
        db.run(sql);
      } catch (e) {
        console.error('Table creation error:', e.message);
      }
    }

    saveDB();
    console.log('✅ Database initialized and synchronized');
    return db;
  } catch (err) {
    console.error('CRITICAL: Database initialization failed:', err);
    throw err;
  }
}

export function getDB() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function saveDB() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving database to file:', err.message);
  }
}

export { DB_PATH };
