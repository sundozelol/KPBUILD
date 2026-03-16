const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, execute, parseRow } = require('../db/database');
const { generatePdf } = require('../services/pdfExport');

const router = express.Router();

// GET /api/public/:token
router.get('/:token', async (req, res) => {
  try {
    const row = await queryOne(
      'SELECT * FROM proposals WHERE public_token = ? AND public_enabled = 1',
      [req.params.token]
    );
    if (!row) return res.status(404).json({ error: 'КП не найдено или ссылка отключена' });

    const proposal = parseRow(row, ['blocks', 'theme']);
    res.json({
      id: proposal.id,
      title: proposal.title,
      blocks: proposal.blocks,
      theme: proposal.theme,
      client_name: proposal.client_name,
      client_company: proposal.client_company,
      total_amount: proposal.total_amount,
      created_date: proposal.created_date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/public/:token/view — log a view, return view_id
router.post('/:token/view', async (req, res) => {
  try {
    const row = await queryOne(
      'SELECT id FROM proposals WHERE public_token = ? AND public_enabled = 1',
      [req.params.token]
    );
    if (!row) return res.status(404).json({ error: 'not found' });

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket?.remoteAddress || '';
    const ua = (req.headers['user-agent'] || '').slice(0, 500);
    const viewId = uuidv4();

    await execute(
      'INSERT INTO proposal_views (id, proposal_id, ip, user_agent) VALUES (?, ?, ?, ?)',
      [viewId, row.id, ip, ua]
    );

    res.json({ ok: true, view_id: viewId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PATCH /api/public/:token/view-end — save duration + page engagement
router.patch('/:token/view-end', async (req, res) => {
  try {
    const { view_id, duration_seconds, page_stats } = req.body;
    if (!view_id) return res.status(400).json({ error: 'view_id required' });

    await execute(
      'UPDATE proposal_views SET duration_seconds = ?, page_stats = ? WHERE id = ?',
      [Math.round(Math.max(0, duration_seconds || 0)), JSON.stringify(page_stats || {}), view_id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/public/:token/pdf — generate PDF without auth, log download
router.post('/:token/pdf', async (req, res) => {
  const { html, styles, title } = req.body;
  if (!html) return res.status(400).json({ error: 'html required' });

  const row = await queryOne(
    'SELECT id, title FROM proposals WHERE public_token = ? AND public_enabled = 1',
    [req.params.token]
  );
  if (!row) return res.status(404).json({ error: 'not found' });

  try {
    const pdfBuffer = await generatePdf(html, styles || '', {
      title: title || row.title || 'КП',
      format: 'A4',
    });
    await execute('UPDATE proposals SET download_count = download_count + 1 WHERE id = ?', [row.id]);

    const safeTitle = (title || row.title || 'КП').replace(/[^а-яёa-z0-9\s_-]/gi, '').trim() || 'КП';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Public PDF error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
