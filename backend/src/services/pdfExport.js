const puppeteer = require('puppeteer');

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
  }
  return browserInstance;
}

/**
 * Generate PDF from rendered HTML string.
 * Frontend renders the proposal preview, captures the HTML + CSS, sends here.
 * Puppeteer renders it in a real browser, returns perfect PDF.
 */
async function generatePdf(html, styles = '', options = {}) {
  const { title = 'КП', format = 'A4' } = options;

  const fullHtml = buildFullHtml(html, styles, title);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 });

    // Set HTML content and wait for all resources (images, fonts) to load
    await page.setContent(fullHtml, {
      waitUntil: ['domcontentloaded'],
      timeout: 30000,
    });

    // Wait for any custom fonts / animations to settle
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    // Compress oversized images via canvas before PDF rendering
    await page.evaluate(() => {
      const MAX_W = 1200;
      const QUALITY = 0.82;
      const imgs = Array.from(document.querySelectorAll('img'));
      imgs.forEach(img => {
        if (!img.complete || !img.naturalWidth) return;
        if (img.naturalWidth <= MAX_W) return;
        try {
          const scale = MAX_W / img.naturalWidth;
          const canvas = document.createElement('canvas');
          canvas.width = MAX_W;
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          img.src = canvas.toDataURL('image/jpeg', QUALITY);
        } catch (e) { /* cross-origin — skip */ }
      });
    });

    const pdfBuffer = await page.pdf({
      format,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
    });

    return pdfBuffer;
  } finally {
    await page.close();
  }
}

function buildFullHtml(html, styles, title) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 794px; background: white; }
    body { font-family: 'Inter', 'Roboto', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    /* Page breaks */
    [data-pdf-page] { page-break-after: always; page-break-inside: avoid; }
    [data-pdf-page]:last-child { page-break-after: auto; }
    /* Hide UI elements not meant for PDF */
    [data-no-pdf] { display: none !important; }
    ${styles}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

// Graceful shutdown
process.on('exit', async () => {
  if (browserInstance) await browserInstance.close().catch(() => {});
});

module.exports = { generatePdf };
