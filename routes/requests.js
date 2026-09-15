const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const requests = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
  const withOffers = requests.map((r) => {
    const offers = db.prepare('SELECT * FROM offers WHERE request_id = ?').all(r.id);
    const isOwner = r.buyer_phone === req.user.phone;
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      subcategory: r.subcategory,
      description: r.description,
      createdAt: r.created_at,
      buyerName: isOwner ? r.buyer_name : undefined,
      buyerPhone: isOwner ? r.buyer_phone : undefined,
      offersCount: offers.length,
      offers: isOwner
        ? offers.map((o) => ({ sellerName: o.seller_name, sellerPhone: o.seller_phone }))
        : [],
      alreadyOffered: offers.some((o) => o.seller_phone === req.user.phone),
      isOwner,
    };
  });
  res.json(withOffers);
});

router.post('/', requireAuth, (req, res) => {
  const { title, category, subcategory, description } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: 'عنوان، دسته‌بندی و توضیحات الزامیه' });
  }
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(req.user.phone);
  const id = Date.now().toString();
  db.prepare(
    `INSERT INTO requests (id, title, category, subcategory, description, buyer_phone, buyer_name)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title, category, subcategory || '', description, req.user.phone, user?.name || '');
  res.json({ success: true, id });
});

router.post('/:id/offer', requireAuth, (req, res) => {
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
  if (!request) return res.status(404).json({ error: 'درخواست پیدا نشد' });
  if (request.buyer_phone === req.user.phone) {
    return res.status(400).json({ error: 'نمی‌تونی به درخواست خودت پاسخ بدی' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(req.user.phone);
  const id = Date.now().toString();
  try {
    db.prepare(
      `INSERT INTO offers (id, request_id, seller_phone, seller_name) VALUES (?, ?, ?, ?)`
    ).run(id, request.id, req.user.phone, user?.name || '');
  } catch (err) {
    // قبلاً پاسخ داده بود
  }

  res.json({
    success: true,
    buyerName: request.buyer_name,
    buyerPhone: request.buyer_phone,
  });
});

module.exports = router;
