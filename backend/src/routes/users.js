const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute } = require('../db/database');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, requireAdmin);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC',
      []
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/users - create user
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });
    if (!['admin', 'manager'].includes(role)) return res.status(400).json({ error: 'Роль: admin или manager' });

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(409).json({ error: 'Email уже занят' });

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await execute(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
      [id, email.toLowerCase().trim(), passwordHash, name || '', role]
    );
    await execute('INSERT INTO company_profiles (id, user_id) VALUES (?, ?)', [uuidv4(), id]);

    res.status(201).json({ id, email: email.toLowerCase().trim(), name: name || '', role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/users/:id - update role or name
router.patch('/:id', async (req, res) => {
  try {
    const { role, name } = req.body;
    const user = await queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (role !== undefined) {
      if (!['admin', 'manager'].includes(role)) return res.status(400).json({ error: 'Роль: admin или manager' });
      await execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    }
    if (name !== undefined) {
      await execute('UPDATE users SET name = ? WHERE id = ?', [name, req.params.id]);
    }

    const updated = await queryOne('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    const user = await queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
