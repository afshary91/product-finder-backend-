const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendOtpSms } = require('../utils/sms');

const router = express.Router();

const IRAN_PHONE_REGEX = /^09\d{9}$/;
const OTP_EXPIRY_MS = 2 * 60 * 1000;

router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !IRAN_PHONE_REGEX.test(phone)) {
    return res.status(400).json({ error: 'شماره موبایل معتبر نیست (فرمت صحیح: 09123456789)' });
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  db.prepare(
    `INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)
     ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at`
  ).run(phone, code, expiresAt);

  try {
    await sendOtpSms(phone, code);
    res.json({ success: true, message: 'کد تایید ارسال شد' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ارسال پیامک با خطا مواجه شد' });
  }
});

router.post('/verify-otp', (req, res) => {
  const { phone, code, name } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'شماره و کد الزامیه' });
  }

  const record = db.prepare('SELECT * FROM otp_codes WHERE phone = ?').get(phone);
  if (!record || record.code !== code) {
    return res.status(400).json({ error: 'کد وارد شده اشتباهه' });
  }
  if (Date.now() > record.expires_at) {
    return res.status(400).json({ error: 'کد منقضی شده، دوباره درخواست بده' });
  }

  db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);

  const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!existing) {
    db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)').run(phone, name || '');
  } else if (name && name !== existing.name) {
    db.prepare('UPDATE users SET name = ? WHERE phone = ?').run(name, phone);
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  const token = jwt.sign({ phone: user.phone }, process.env.JWT_SECRET, { expiresIn: '90d' });

  res.json({ token, user: { phone: user.phone, name: user.name } });
});

module.exports = router;
