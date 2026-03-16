require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

const { query, execute, ready } = require('./db/database');
const { syncXmlPrices } = require('./services/priceSync');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || './uploads');

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://test.ecokont.ru',
  ],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' })); // Large limit for HTML PDF payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/products', require('./routes/products'));
app.use('/api/company-profile', require('./routes/companyProfile'));
app.use('/api/xml-feeds', require('./routes/xmlFeeds'));
app.use('/api/export', require('./routes/export'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/invites', require('./routes/invites'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/public', require('./routes/public'));
app.use('/api/proposal-templates', require('./routes/templates'));

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Serve frontend in production ───────────────────────────────────────────────
const FRONTEND_DIST = path.resolve(__dirname, '../../dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    }
  });
}

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});

// ── Auto price sync cron (every 15 min — checks who is due) ────────────────────
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = Date.now();
    const profiles = await query(
      'SELECT user_id, auto_sync_interval, last_auto_sync FROM company_profiles WHERE auto_sync_enabled = 1',
      []
    );

    for (const profile of profiles) {
      const intervalMs = (profile.auto_sync_interval || 120) * 60 * 1000;
      const lastSync = profile.last_auto_sync ? new Date(profile.last_auto_sync).getTime() : 0;
      if (now - lastSync < intervalMs) continue;

      const feeds = await query('SELECT * FROM xml_feeds WHERE user_id = ? AND is_active = 1', [profile.user_id]);
      if (!feeds.length) continue;

      console.log(`[AutoSync] Синхронизация цен для user ${profile.user_id} (${feeds.length} фидов)`);
      try {
        const result = await syncXmlPrices(feeds, profile.user_id);
        const syncTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await execute('UPDATE company_profiles SET last_auto_sync = ? WHERE user_id = ?', [syncTime, profile.user_id]);
        for (const feed of feeds) {
          const fr = result.feedResults?.[feed.id];
          const msg = fr?.error ? `Ошибка: ${fr.error}` : `Авто: обновлено ${fr?.updated || 0} цен`;
          await execute('UPDATE xml_feeds SET last_synced = ?, last_result = ? WHERE id = ?', [syncTime, msg, feed.id]);
        }
        // Save sync log
        const hasError = Object.values(result.feedResults || {}).some(r => r.error);
        await execute(
          'INSERT INTO sync_logs (id, user_id, type, status, updated, feeds_count, detail) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            uuidv4(), profile.user_id, 'auto', hasError ? 'error' : 'ok',
            result.updated || 0, feeds.length,
            JSON.stringify({ feedResults: result.feedResults, feeds: feeds.map(f => ({ id: f.id, name: f.name })) })
          ]
        );
        console.log(`[AutoSync] Готово: обновлено ${result.updated || 0} цен`);
      } catch (err) {
        console.error(`[AutoSync] Ошибка для user ${profile.user_id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[AutoSync] Крон ошибка:', err.message);
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
ready.then(() => {
  app.listen(PORT, () => {
    console.log(`\nKP Generator backend запущен`);
    console.log(`   API:     http://localhost:${PORT}/api`);
    console.log(`   Uploads: http://localhost:${PORT}/uploads`);
    if (fs.existsSync(FRONTEND_DIST)) {
      console.log(`   App:     http://localhost:${PORT}`);
    } else {
      console.log(`   Dev frontend: http://localhost:5173`);
    }
    console.log('');
  });
}).catch(err => {
  console.error('[DB] Failed to initialize:', err);
  process.exit(1);
});

module.exports = app;
