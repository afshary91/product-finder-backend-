const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const listings = db.prepare('SELECT * FROM listings ORDER BY created_at DESC').all();
  res.json(
    listings.map((l) => ({
      id: l.id,
      title: l.title,
      category: l.category,
      subcategory: l.subcategory,
      price: l.price,
      description: l.description,
      sellerName: l.seller_name,
      sellerPhone: l.seller_phone,
      createdAt: l.created_at,
    }))
  );
});

router.post('/', requireAuth, (req, res) => {
  const { title, category, subcategory, price, description } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: 'عنوان، دسته‌بندی و توضیحات الزامیه' });
  }
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(req.user.phone);
  const id = Date.now().toString();
  db.prepare(
    `INSERT INTO listings (id, title, category, subcategory, price, description, seller_phone, seller_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title, category, subcategory || '', price || '', description, req.user.phone, user?.name || '');
  res.json({ success: true, id });
});

module.exports = router;
