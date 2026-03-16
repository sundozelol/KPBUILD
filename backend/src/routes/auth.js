const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute } = require('../db/database');
const { authMiddleware, signToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, inviteCode } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
    if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });

    const normalEmail = email.toLowerCase().trim();
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [normalEmail]);
    if (existing) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });

    // First ever user — no invite needed, becomes admin
    const countRow = await queryOne('SELECT COUNT(*) as cnt FROM users', []);
    let role = 'manager';
    let invite = null;

    if (countRow.cnt === 0) {
      role = 'admin';
    } else {
      // Invite code required
      if (!inviteCode) return res.status(400).json({ error: 'Требуется инвайт-код' });
      invite = await queryOne(
        'SELECT * FROM invite_codes WHERE code = ? AND used_at IS NULL',
        [inviteCode.trim().toUpperCase()]
      );
      if (!invite) return res.status(400).json({ error: 'Инвайт-код недействителен или уже использован' });
      role = invite.role || 'manager';
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await execute(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
      [id, normalEmail, passwordHash, name || '', role]
    );

    // Mark invite as used
    if (invite) {
      await execute(
        'UPDATE invite_codes SET used_by_email = ?, used_at = NOW() WHERE id = ?',
        [normalEmail, invite.id]
      );
    }

    // Auto-create empty company profile
    await execute('INSERT INTO company_profiles (id, user_id) VALUES (?, ?)', [uuidv4(), id]);

    const token = signToken(id);
    res.status(201).json({ token, user: { id, email: normalEmail, name: name || '', role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Все поля обязательны' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Новый пароль минимум 6 символов' });

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Текущий пароль неверный' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/auth/me - update own profile (name)
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (name !== undefined) {
      await execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    }
    const updated = await queryOne('SELECT id, email, name, role FROM users WHERE id = ?', [req.user.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
