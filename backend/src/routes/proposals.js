const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute, parseRow, parseRows } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const JSON_FIELDS = ['blocks', 'theme'];

function buildSort(sortParam) {
  if (!sortParam) return 'created_date DESC';
  const desc = sortParam.startsWith('-');
  const field = desc ? sortParam.slice(1) : sortParam;
  const allowed = ['created_date', 'updated_date', 'title', 'status', 'total_amount', 'client_name'];
  if (!allowed.includes(field)) return 'created_date DESC';
  return `${field} ${desc ? 'DESC' : 'ASC'}`;
}

const isManager = (req) => req.user.role === 'manager';

// GET /api/proposals
router.get('/', async (req, res) => {
  try {
    const { sort, limit, status } = req.query;
    const sortClause = buildSort(sort);
    const lim = Math.min(parseInt(limit) || 1000, 1000);

    if (isManager(req)) {
      const rows = await query(
        `SELECT p.*, (SELECT COUNT(*) FROM proposal_views WHERE proposal_id = p.id) as view_count
         FROM proposals p WHERE p.status = 'accepted' ORDER BY p.${sortClause} LIMIT ?`,
        [lim]
      );
      return res.json(parseRows(rows, JSON_FIELDS));
    }

    let sql = `SELECT p.*, (SELECT COUNT(*) FROM proposal_views WHERE proposal_id = p.id) as view_count
               FROM proposals p WHERE p.user_id = ?`;
    const params = [req.user.id];
    if (status) { sql += ' AND p.status = ?'; params.push(status); }
    sql += ` ORDER BY p.${sortClause} LIMIT ?`;
    params.push(lim);
    const rows = await query(sql, params);
    res.json(parseRows(rows, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/proposals/:id
router.get('/:id', async (req, res) => {
  try {
    if (isManager(req)) {
      const row = await queryOne(
        "SELECT * FROM proposals WHERE id = ? AND status = 'accepted'",
        [req.params.id]
      );
      if (!row) return res.status(404).json({ error: 'КП не найдено или недоступно' });
      return res.json(parseRow(row, JSON_FIELDS));
    }

    const row = await queryOne('SELECT * FROM proposals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ error: 'КП не найдено' });
    res.json(parseRow(row, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/proposals — admin only
router.post('/', async (req, res) => {
  try {
    if (isManager(req)) return res.status(403).json({ error: 'Только администратор может создавать КП' });

    const { title, status, blocks, theme, total_amount, client_name, client_company } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await execute(
      `INSERT INTO proposals (id, user_id, title, status, blocks, theme, total_amount, client_name, client_company, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user.id,
        title || 'Новое КП',
        status || 'draft',
        JSON.stringify(blocks || []),
        JSON.stringify(theme || {}),
        total_amount || 0,
        client_name || '',
        client_company || '',
        now, now
      ]
    );
    const row = await queryOne('SELECT * FROM proposals WHERE id = ?', [id]);
    res.status(201).json(parseRow(row, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/proposals/:id
router.put('/:id', async (req, res) => {
  try {
    if (isManager(req)) {
      const existing = await queryOne(
        "SELECT * FROM proposals WHERE id = ? AND status = 'accepted'",
        [req.params.id]
      );
      if (!existing) return res.status(404).json({ error: 'КП не найдено или недоступно' });

      const fields = ['blocks', 'theme', 'total_amount'];
      const updates = [];
      const params = [];
      for (const field of fields) {
        if (field in req.body) {
          updates.push(`${field} = ?`);
          const val = req.body[field];
          params.push(typeof val === 'object' ? JSON.stringify(val) : val);
        }
      }
      if (!updates.length) return res.json(parseRow(existing, JSON_FIELDS));
      updates.push('updated_date = ?');
      params.push(new Date().toISOString().slice(0, 19).replace('T', ' '), req.params.id);
      await execute(`UPDATE proposals SET ${updates.join(', ')} WHERE id = ?`, params);
      const updated = await queryOne('SELECT * FROM proposals WHERE id = ?', [req.params.id]);
      return res.json(parseRow(updated, JSON_FIELDS));
    }

    // Admin: full update on own proposals
    const existing = await queryOne('SELECT * FROM proposals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'КП не найдено' });

    const fields = ['title', 'status', 'blocks', 'theme', 'total_amount', 'client_name', 'client_company'];
    const updates = [];
    const params = [];
    for (const field of fields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        const val = req.body[field];
        params.push(typeof val === 'object' ? JSON.stringify(val) : val);
      }
    }
    if (!updates.length) return res.json(parseRow(existing, JSON_FIELDS));
    updates.push('updated_date = ?');
    params.push(new Date().toISOString().slice(0, 19).replace('T', ' '), req.params.id, req.user.id);
    await execute(`UPDATE proposals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
    const updated = await queryOne('SELECT * FROM proposals WHERE id = ?', [req.params.id]);
    res.json(parseRow(updated, JSON_FIELDS));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/proposals/:id — admin only
router.delete('/:id', async (req, res) => {
  try {
    if (isManager(req)) return res.status(403).json({ error: 'Только администратор может удалять КП' });
    const result = await execute('DELETE FROM proposals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return res.status(404).json({ error: 'КП не найдено' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/proposals/:id/share — enable public link
router.post('/:id/share', async (req, res) => {
  try {
    if (isManager(req)) return res.status(403).json({ error: 'Нет доступа' });
    const existing = await queryOne('SELECT * FROM proposals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'КП не найдено' });

    let token = existing.public_token;
    if (!token) {
      token = uuidv4();
      await execute('UPDATE proposals SET public_token = ?, public_enabled = 1 WHERE id = ?', [token, req.params.id]);
    } else {
      await execute('UPDATE proposals SET public_enabled = 1 WHERE id = ?', [req.params.id]);
    }
    res.json({ public_token: token, public_enabled: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/proposals/:id/share — disable public link
router.delete('/:id/share', async (req, res) => {
  try {
    if (isManager(req)) return res.status(403).json({ error: 'Нет доступа' });
    const existing = await queryOne('SELECT * FROM proposals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'КП не найдено' });
    await execute('UPDATE proposals SET public_enabled = 0 WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/proposals/:id/views — view analytics with aggregates
router.get('/:id/views', async (req, res) => {
  try {
    if (isManager(req)) return res.status(403).json({ error: 'Нет доступа' });
    const existing = await queryOne('SELECT * FROM proposals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'КП не найдено' });

    const rows = await query(
      'SELECT id, viewed_at, ip, user_agent, duration_seconds, page_stats FROM proposal_views WHERE proposal_id = ? ORDER BY viewed_at DESC LIMIT 100',
      [req.params.id]
    );

    // Aggregate page stats across all views
    const pageStatsAgg = {};
    let totalDuration = 0;
    const views = rows.map(v => {
      totalDuration += v.duration_seconds || 0;
      let ps = {};
      try { ps = JSON.parse(v.page_stats || '{}'); } catch {}
      for (const [page, secs] of Object.entries(ps)) {
        pageStatsAgg[page] = (pageStatsAgg[page] || 0) + Number(secs);
      }
      return { ...v, page_stats: ps };
    });

    const viewsWithDuration = views.filter(v => v.duration_seconds > 0);
    const avgDuration = viewsWithDuration.length > 0
      ? Math.round(totalDuration / viewsWithDuration.length) : 0;

    res.json({
      total: rows.length,
      avg_duration: avgDuration,
      download_count: existing.download_count || 0,
      page_stats_agg: pageStatsAgg,
      views,
      public_token: existing.public_token,
      public_enabled: Boolean(existing.public_enabled),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
