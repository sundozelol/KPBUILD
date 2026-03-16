const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne, execute, parseRow, parseRows } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const { importXmlFeed } = require('../services/xmlImport');
const { syncXmlPrices } = require('../services/priceSync');

async function saveSyncLog(userId, type, result, feeds) {
  try {
    const hasError = Object.values(result.feedResults || {}).some(r => r.error);
    await execute(
      'INSERT INTO sync_logs (id, user_id, type, status, updated, feeds_count, detail) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(), userId, type,
        hasError ? 'error' : 'ok',
        result.updated || 0,
        feeds.length,
        JSON.stringify({ feedResults: result.feedResults, feeds: feeds.map(f => ({ id: f.id, name: f.name })) })
      ]
    );
  } catch (e) { console.error('[SyncLog]', e.message); }
}

const router = express.Router();
router.use(authMiddleware);

// GET /api/xml-feeds
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM xml_feeds WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(parseRows(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/xml-feeds
router.post('/', async (req, res) => {
  try {
    const { name, url, is_active, default_category } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Название и URL обязательны' });

    const id = uuidv4();
    await execute(
      'INSERT INTO xml_feeds (id, user_id, name, url, is_active, default_category) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.user.id, name.trim(), url.trim(), is_active !== false ? 1 : 0, default_category || '']
    );

    res.status(201).json(parseRow(await queryOne('SELECT * FROM xml_feeds WHERE id = ?', [id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/xml-feeds/:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await queryOne('SELECT * FROM xml_feeds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(404).json({ error: 'Фид не найден' });

    const fields = ['name', 'url', 'is_active', 'default_category', 'last_synced', 'last_result'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        let val = req.body[field];
        if (field === 'is_active') val = val ? 1 : 0;
        params.push(val);
      }
    }

    if (!updates.length) return res.json(parseRow(existing));
    params.push(req.params.id);
    await execute(`UPDATE xml_feeds SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json(parseRow(await queryOne('SELECT * FROM xml_feeds WHERE id = ?', [req.params.id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/xml-feeds/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM xml_feeds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return res.status(404).json({ error: 'Фид не найден' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/xml-feeds/import — import products from a feed URL
router.post('/import', async (req, res) => {
  const { url, feedId, category, uploadImages } = req.body;
  if (!url) return res.status(400).json({ error: 'URL обязателен' });

  try {
    const result = await importXmlFeed(url, {
      uploadImages: uploadImages !== false,
      uploadsDir: process.env.UPLOADS_DIR || './uploads',
      serverUrl: `http://localhost:${process.env.PORT || 3001}`
    });

    // If feedId provided, update last_synced
    if (feedId) {
      const lastResult = result.error
        ? `Ошибка: ${result.error}`
        : `Найдено ${result.products?.length || 0} товаров`;
      await execute(
        'UPDATE xml_feeds SET last_synced = ?, last_result = ? WHERE id = ? AND user_id = ?',
        [new Date().toISOString().slice(0, 19).replace('T', ' '), lastResult, feedId, req.user.id]
      );
    }

    res.json(result);
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message || 'Ошибка импорта' });
  }
});

// POST /api/xml-feeds/:id/enable-sync — mark all products of this feed for auto-sync
router.post('/:id/enable-sync', async (req, res) => {
  try {
    const feed = await queryOne('SELECT * FROM xml_feeds WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!feed) return res.status(404).json({ error: 'Фид не найден' });

    const result = await execute(
      'UPDATE products SET sync_price_from_feed = 1 WHERE feed_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ updated: result.changes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/xml-feeds/sync-prices — sync prices from all active feeds
router.post('/sync-prices', async (req, res) => {
  try {
    const feeds = await query('SELECT * FROM xml_feeds WHERE user_id = ? AND is_active = 1', [req.user.id]);
    if (!feeds.length) return res.json({ updated: 0, products_with_sync: 0, message: 'Нет активных фидов' });

    const result = await syncXmlPrices(feeds, req.user.id);

    // Update last_synced for all synced feeds
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    for (const feed of feeds) {
      const feedResult = result.feedResults?.[feed.id];
      const msg = feedResult?.error ? `Ошибка: ${feedResult.error}` : `Обновлено ${feedResult?.updated || 0} цен`;
      await execute('UPDATE xml_feeds SET last_synced = ?, last_result = ? WHERE id = ?', [now, msg, feed.id]);
    }

    await saveSyncLog(req.user.id, 'manual', result, feeds);
    res.json(result);
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message || 'Ошибка синхронизации' });
  }
});

module.exports = router;
