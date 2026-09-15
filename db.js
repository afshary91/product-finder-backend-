const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('data.db');

db.exec('PRAGMA journal_mode = WAL;');

// جدول کاربران - هر کاربر فقط با شماره تلفن شناخته می‌شه
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// جدول کدهای یک‌بارمصرف (OTP)
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    phone TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )
`);

// جدول درخواست‌های مشتری
db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT,
    buyer_phone TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// جدول پاسخ فروشگاه‌ها به درخواست‌ها (اعلام موجودی)
db.exec(`
  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    seller_phone TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id, seller_phone)
  )
`);

// جدول آگهی‌های مستقل فروشگاه‌ها
db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    price TEXT,
    description TEXT,
    seller_phone TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
