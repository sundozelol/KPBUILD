const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute, parseRow } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/company-profile
router.get('/', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM company_profiles WHERE user_id = ?', [req.user.id]);
    res.json(row ? [parseRow(row)] : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/company-profile
router.post('/', async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]);
    if (existing) {
      // Update existing instead of creating
      return updateProfile(req, res, existing.id);
    }

    const id = uuidv4();
    const { company_name, logo_url, address, phone, email, website, inn, kpp, bank_details } = req.body;
    await execute(
      `INSERT INTO company_profiles (id, user_id, company_name, logo_url, address, phone, email, website, inn, kpp, bank_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, company_name || '', logo_url || '', address || '', phone || '', email || '', website || '', inn || '', kpp || '', bank_details || '']
    );
    res.status(201).json(parseRow(await queryOne('SELECT * FROM company_profiles WHERE id = ?', [id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

async function updateProfile(req, res, id) {
  try {
    const fields = ['company_name', 'logo_url', 'address', 'phone', 'email', 'website', 'inn', 'kpp', 'bank_details'];
    const updates = [];
    const params = [];
    for (const field of fields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }
    if (!updates.length) {
      const row = await queryOne('SELECT * FROM company_profiles WHERE id = ?', [id]);
      return res.json(parseRow(row));
    }
    params.push(id);
    await execute(`UPDATE company_profiles SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json(parseRow(await queryOne('SELECT * FROM company_profiles WHERE id = ?', [id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// PUT /api/company-profile/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM company_profiles WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Профиль не найден' });
    updateProfile(req, res, req.params.id);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
