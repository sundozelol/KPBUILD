const { XMLParser } = require('fast-xml-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Import products from XML or YML feed URL.
 * Supports:
 *   - Яндекс.Маркет YML (yml_catalog / shop / offers / offer)
 *   - Generic XML with product/item/good/товар elements
 *   - RSS-style feeds
 */
async function importXmlFeed(url, options = {}) {
  const { uploadImages = true, uploadsDir = './uploads', serverUrl = 'http://localhost:3001' } = options;

  // ── 1. Fetch XML ──────────────────────────────────────────────────────────────
  let xmlText;
  try {
    const response = await axios.get(url, {
      timeout: 120000, // 2 min — large feeds can be slow
      responseType: 'text', // always get raw string, prevent axios auto-parse
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KPGenerator/1.0)',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Encoding': 'gzip, deflate',
      },
      maxContentLength: 200 * 1024 * 1024, // 200 MB max
      maxBodyLength: 200 * 1024 * 1024,
    });
    xmlText = response.data;
  } catch (err) {
    return { error: `Не удалось загрузить фид: ${err.message}`, products: [] };
  }

  if (typeof xmlText !== 'string') {
    try { xmlText = xmlText.toString('utf-8'); } catch { return { error: 'Не удалось декодировать XML', products: [] }; }
  }

  // Log feed size for diagnostics
  console.log(`[XML Import] Загружено: ${(xmlText.length / 1024).toFixed(0)} KB`);

  // ── 2. Parse XML ──────────────────────────────────────────────────────────────
  let parsed;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
      isArray: (name) => ['offer', 'item', 'product', 'good', 'category', 'picture', 'param'].includes(name.toLowerCase()),
    });
    parsed = parser.parse(xmlText);
  } catch (err) {
    return { error: `Ошибка парсинга XML: ${err.message}`, products: [] };
  }

  // ── 3. Detect format and extract offers ──────────────────────────────────────
  let rawOffers = [];
  let categories = {};

  // Яндекс.Маркет YML
  const shop = parsed?.yml_catalog?.shop || parsed?.YML_CATALOG?.shop;
  if (shop) {
    rawOffers = toArray(shop?.offers?.offer);
    // Build category map
    const cats = toArray(shop?.categories?.category);
    cats.forEach(c => {
      const id = c['@_id'] || c.id;
      const name = c['#text'] || c.name || String(c);
      if (id) categories[String(id)] = String(name);
    });
  }

  // Generic XML — search for common element names
  if (!rawOffers.length) {
    const root = Object.values(parsed)[0] || parsed;
    rawOffers = (
      toArray(root?.offers?.offer) ||
      toArray(root?.products?.product) ||
      toArray(root?.items?.item) ||
      toArray(root?.catalog?.item) ||
      toArray(root?.goods?.good) ||
      toArray(root?.product) ||
      toArray(root?.item) ||
      []
    );
  }

  if (!rawOffers.length) {
    return { error: 'Товары не найдены в фиде. Поддерживаются форматы: Яндекс.Маркет YML, XML с тегами offer/product/item/good', products: [] };
  }

  console.log(`[XML Import] Найдено офферов в XML: ${rawOffers.length}`);

  // ── 4. Map offers to products ─────────────────────────────────────────────────
  const products = [];
  const imageUploadErrors = [];

  for (const offer of rawOffers) {
    if (!offer || typeof offer !== 'object') continue;

    const product = mapOffer(offer, categories);
    if (!product.name) continue;

    // Upload image to local server
    if (uploadImages && product.image_url && !product.image_url.startsWith('http://localhost')) {
      try {
        const localUrl = await downloadImage(product.image_url, uploadsDir, serverUrl);
        if (localUrl) product.image_url = localUrl;
      } catch (e) {
        imageUploadErrors.push(product.image_url);
        product.image_url = null; // Keep product but without image
      }
    }

    products.push(product);
  }

  console.log(`[XML Import] Товаров после маппинга: ${products.length} из ${rawOffers.length} офферов`);

  return {
    products,
    total: products.length,
    rawTotal: rawOffers.length,
    imageErrors: imageUploadErrors.length,
    categories: Object.values(categories),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function extractText(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return val['#text'] || val._ || '';
  return String(val);
}

function extractPrice(val) {
  if (!val) return 0;
  const str = extractText(val);
  const num = parseFloat(str.replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

function mapOffer(offer, categories) {
  // Name
  const name = extractText(offer.name || offer.model || offer.typePrefix || offer.title || offer.Name || '');

  // SKU / article — also check <param name="Артикул"> or <param name="Articul">
  const params = toArray(offer.param);
  const paramSku = params.find(p => {
    const n = (p['@_name'] || '').toLowerCase();
    return n === 'артикул' || n === 'articul' || n === 'article' || n === 'sku';
  });
  const sku = extractText(paramSku || offer['@_id'] || offer.vendorCode || offer.article || offer.sku || offer.SKU || offer.articul || '');

  // Price: try price, then oldprice, then price_rrc
  const price = extractPrice(offer.price || offer.Price || offer.price_rrc);
  const price2 = extractPrice(offer.oldprice || offer.price_old || offer.compareAtPrice) || undefined;

  // Images — YML has <picture> elements
  const pictures = toArray(offer.picture || offer.image || offer.Image || offer.img);
  const image_url = pictures.length ? extractText(pictures[0]) : '';

  // Category
  let category = '';
  const catId = extractText(offer.categoryId || offer.category_id);
  if (catId && categories[catId]) {
    category = categories[catId];
  } else {
    category = extractText(offer.category || offer.Category || offer.categoryName || '');
  }

  // Description
  const description = extractText(offer.description || offer.Description || offer.body || '');

  // Unit
  const unit = extractText(offer.unit || offer.Unit || offer.measure || 'шт');

  return {
    name: name.trim() || extractText(offer['#text'] || ''),
    sku: sku || null,
    price: price || 0,
    price2: price2 || null,
    image_url: image_url || null,
    category: category || '',
    description: description.slice(0, 2000) || '',
    unit: unit || 'шт',
    external_id: sku || null,
  };
}

async function downloadImage(url, uploadsDir, serverUrl) {
  if (!url || !url.startsWith('http')) return null;
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 10000,
    headers: { 'User-Agent': 'KPGenerator/1.0' },
  });

  const contentType = response.headers['content-type'] || 'image/jpeg';
  const ext = contentType.includes('png') ? '.png'
    : contentType.includes('gif') ? '.gif'
    : contentType.includes('webp') ? '.webp'
    : contentType.includes('svg') ? '.svg'
    : '.jpg';

  const filename = `${uuidv4()}${ext}`;
  fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(response.data));
  return `${serverUrl}/uploads/${filename}`;
}

module.exports = { importXmlFeed };
