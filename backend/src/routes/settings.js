const express = require('express');
const { query, queryOne, execute } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/settings/sync
router.get('/sync', async (req, res) => {
  try {
    const profile = await queryOne(
      'SELECT auto_sync_enabled, auto_sync_interval, last_auto_sync FROM company_profiles WHERE user_id = ?',
      [req.user.id]
    );
    res.json({
      auto_sync_enabled: profile ? Boolean(profile.auto_sync_enabled) : false,
      auto_sync_interval: profile?.auto_sync_interval || 120,
      last_auto_sync: profile?.last_auto_sync || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/settings/sync-logs
router.get('/sync-logs', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM sync_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows.map(r => ({ ...r, detail: JSON.parse(r.detail || '{}') })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/settings/sync
router.patch('/sync', async (req, res) => {
  try {
    const { auto_sync_enabled, auto_sync_interval } = req.body;
    const profile = await queryOne('SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile) return res.status(404).json({ error: 'Профиль не найден' });

    const updates = [];
    const params = [];
    if (auto_sync_enabled !== undefined) { updates.push('auto_sync_enabled = ?'); params.push(auto_sync_enabled ? 1 : 0); }
    if (auto_sync_interval !== undefined) { updates.push('auto_sync_interval = ?'); params.push(Number(auto_sync_interval)); }

    if (updates.length) {
      params.push(req.user.id);
      await execute(`UPDATE company_profiles SET ${updates.join(', ')} WHERE user_id = ?`, params);
    }

    const updated = await queryOne(
      'SELECT auto_sync_enabled, auto_sync_interval, last_auto_sync FROM company_profiles WHERE user_id = ?',
      [req.user.id]
    );
    res.json({
      auto_sync_enabled: Boolean(updated.auto_sync_enabled),
      auto_sync_interval: updated.auto_sync_interval,
      last_auto_sync: updated.last_auto_sync,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
