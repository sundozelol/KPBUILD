const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { query, queryOne, execute, parseRow, parseRows } = require('../db/database');

const router = express.Router();
router.use(authMiddleware);

const JSON_FIELDS = ['blocks', 'theme'];

function newId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// GET /api/proposal-templates — list user's templates (newest first)
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM proposal_templates WHERE user_id = ? ORDER BY created_date DESC',
      [req.user.id]
    );
    res.json(parseRows(rows, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/proposal-templates/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await queryOne(
      'SELECT * FROM proposal_templates WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'Шаблон не найден' });
    res.json(parseRow(row, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/proposal-templates — create
router.post('/', async (req, res) => {
  try {
    const { name, description = '', category = 'custom', blocks = [], theme = {} } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Название обязательно' });

    const id = newId();
    await execute(
      `INSERT INTO proposal_templates (id, user_id, name, description, category, blocks, theme)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, name.trim(), description.trim(), category,
        JSON.stringify(blocks), JSON.stringify(theme)]
    );

    const row = await queryOne('SELECT * FROM proposal_templates WHERE id = ?', [id]);
    res.status(201).json(parseRow(row, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/proposal-templates/:id — update name/description
router.patch('/:id', async (req, res) => {
  try {
    const row = await queryOne(
      'SELECT id FROM proposal_templates WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'Шаблон не найден' });

    const { name, description } = req.body;
    if (typeof name === 'string') {
      await execute('UPDATE proposal_templates SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    }
    if (typeof description === 'string') {
      await execute('UPDATE proposal_templates SET description = ? WHERE id = ?', [description.trim(), req.params.id]);
    }

    const updated = await queryOne('SELECT * FROM proposal_templates WHERE id = ?', [req.params.id]);
    res.json(parseRow(updated, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/proposal-templates/:id
router.delete('/:id', async (req, res) => {
  try {
    const row = await queryOne(
      'SELECT id FROM proposal_templates WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'Шаблон не найден' });

    await execute('DELETE FROM proposal_templates WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
