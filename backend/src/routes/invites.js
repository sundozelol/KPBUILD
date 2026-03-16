const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute } = require('../db/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, requireAdmin);

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode() {
  let code = '';
  for (let i = 0; i < 9; i++) {
    if (i === 4) { code += '-'; continue; }
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

// GET /api/invites
router.get('/', async (req, res) => {
  try {
    const codes = await query('SELECT * FROM invite_codes ORDER BY created_at DESC', []);
    res.json(codes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/invites — generate new invite code
router.post('/', async (req, res) => {
  try {
    const { note, role } = req.body;
    const validRole = ['admin', 'manager'].includes(role) ? role : 'manager';

    let code;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
    } while ((await queryOne('SELECT id FROM invite_codes WHERE code = ?', [code])) && attempts < 20);

    const id = uuidv4();
    await execute(
      'INSERT INTO invite_codes (id, code, note, role, created_by) VALUES (?, ?, ?, ?, ?)',
      [id, code, note || '', validRole, req.user.id]
    );

    res.status(201).json(await queryOne('SELECT * FROM invite_codes WHERE id = ?', [id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/invites/:id — revoke unused invite
router.delete('/:id', async (req, res) => {
  try {
    const result = await execute(
      'DELETE FROM invite_codes WHERE id = ? AND used_at IS NULL',
      [req.params.id]
    );
    if (!result.changes) return res.status(404).json({ error: 'Не найден или уже использован' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
