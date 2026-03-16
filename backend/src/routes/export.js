const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { generatePdf } = require('../services/pdfExport');

const router = express.Router();
router.use(authMiddleware);

// POST /api/export/pdf
// Body: { html: string, styles: string, title: string }
router.post('/pdf', async (req, res) => {
  const { html, styles, title } = req.body;
  if (!html) return res.status(400).json({ error: 'html обязателен' });

  try {
    const pdfBuffer = await generatePdf(html, styles || '', {
      title: title || 'КП',
      format: req.body.format || 'A4',
    });

    const safeTitle = (title || 'КП').replace(/[^а-яёa-z0-9\s_-]/gi, '').trim() || 'КП';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Ошибка генерации PDF: ' + err.message });
  }
});

module.exports = router;
