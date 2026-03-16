const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute, transaction, parseRow, parseRows } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function buildSort(sortParam) {
  if (!sortParam) return 'name ASC';
  const desc = sortParam.startsWith('-');
  const field = desc ? sortParam.slice(1) : sortParam;
  const allowed = ['name', 'price', 'category', 'sku', 'created_at'];
  if (!allowed.includes(field)) return 'name ASC';
  return `${field} ${desc ? 'DESC' : 'ASC'}`;
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { sort, limit, offset, search, category, filters } = req.query;
    const sortClause = buildSort(sort);
    const lim = Math.min(parseInt(limit) || 1000, 50000);
    const off = parseInt(offset) || 0;

    let sql = 'SELECT * FROM products WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      sql += ' AND (name LIKE ? OR sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    // Support filters[field]=value pattern
    if (filters) {
      try {
        const f = typeof filters === 'string' ? JSON.parse(filters) : filters;
        for (const [key, val] of Object.entries(f)) {
          const allowed = ['category', 'sync_price_from_feed', 'feed_id'];
          if (allowed.includes(key)) {
            sql += ` AND ${key} = ?`;
            params.push(val);
          }
        }
      } catch {}
    }

    sql += ` ORDER BY ${sortClause} LIMIT ? OFFSET ?`;
    params.push(lim, off);

    const rows = await query(sql, params);
    res.json(parseRows(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await queryOne('SELECT * FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!row) return res.status(404).json({ error: 'Товар не найден' });
    res.json(parseRow(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const id = uuidv4();
    const { name, sku, price, price2, price3, image_url, category, description, unit, sync_price_from_feed, feed_id, external_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Название обязательно' });

    await execute(
      `INSERT INTO products (id, user_id, name, sku, price, price2, price3, image_url, category, description, unit, sync_price_from_feed, feed_id, external_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.user.id, name,
        sku || null, price || 0, price2 || null, price3 || null,
        image_url || null, category || '', description || '',
        unit || 'шт', sync_price_from_feed ? 1 : 0,
        feed_id || null, external_id || null
      ]
    );

    res.status(201).json(parseRow(await queryOne('SELECT * FROM products WHERE id = ?', [id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/products/bulk — bulk create
router.post('/bulk', async (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'products должен быть массивом' });

    const ids = await transaction(async (conn) => {
      const created = [];
      for (const p of products) {
        if (!p.name) continue;
        const id = uuidv4();
        await conn.query(
          `INSERT INTO products (id, user_id, name, sku, price, price2, price3, image_url, category, description, unit, sync_price_from_feed, feed_id, external_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, req.user.id, p.name,
            p.sku || null, p.price || 0, p.price2 || null, p.price3 || null,
            p.image_url || null, p.category || '', p.description || '',
            p.unit || 'шт', p.sync_price_from_feed ? 1 : 0,
            p.feed_id || null, p.external_id || null
          ]
        );
        created.push(id);
      }
      return created;
    });

    res.status(201).json({ created: ids.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Товар не найден' });

    const fields = ['name', 'sku', 'price', 'price2', 'price3', 'image_url', 'category', 'description', 'unit', 'sync_price_from_feed', 'feed_id', 'external_id'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        let val = req.body[field];
        if (field === 'sync_price_from_feed') val = val ? 1 : 0;
        params.push(val);
      }
    }

    if (!updates.length) return res.json(parseRow(existing));

    params.push(req.params.id, req.user.id);
    await execute(`UPDATE products SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
    res.json(parseRow(await queryOne('SELECT * FROM products WHERE id = ?', [req.params.id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/products/bulk-update — bulk update fields
router.put('/bulk-update', async (req, res) => {
  try {
    const { ids, data } = req.body;
    if (!Array.isArray(ids) || !data) return res.status(400).json({ error: 'ids и data обязательны' });

    const allowed = ['category', 'sync_price_from_feed'];
    const updates = [];
    const vals = [];
    for (const f of allowed) {
      if (f in data) {
        updates.push(`${f} = ?`);
        vals.push(f === 'sync_price_from_feed' ? (data[f] ? 1 : 0) : data[f]);
      }
    }
    if (!updates.length) return res.json({ updated: 0 });

    const updated = await transaction(async (conn) => {
      let count = 0;
      for (const id of ids) {
        const [result] = await conn.query(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
          [...vals, id, req.user.id]
        );
        count += result.affectedRows;
      }
      return count;
    });

    res.json({ updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return res.status(404).json({ error: 'Товар не найден' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/products/bulk-delete
router.delete('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids обязателен' });

    const deleted = await transaction(async (conn) => {
      let count = 0;
      for (const id of ids) {
        const [result] = await conn.query('DELETE FROM products WHERE id = ? AND user_id = ?', [id, req.user.id]);
        count += result.affectedRows;
      }
      return count;
    });

    res.json({ deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
