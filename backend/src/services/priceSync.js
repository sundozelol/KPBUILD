const { importXmlFeed } = require('./xmlImport');
const { query, transaction } = require('../db/database');

/**
 * Sync prices from all active XML feeds to products in DB.
 * Only updates products that have sync_price_from_feed = 1.
 */
// Normalize key for matching: trim, lowercase, convert to string
function normKey(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().toLowerCase();
  return s || null;
}

async function syncXmlPrices(feeds, userId) {
  const products = await query('SELECT * FROM products WHERE user_id = ? AND sync_price_from_feed = 1', [userId]);

  if (!products.length) {
    return { updated: 0, matched: 0, skipped: 0, products_with_sync: 0, message: 'Нет товаров с включённой синхронизацией цен' };
  }

  // Build lookup with normalized keys: sku → product, external_id → product
  const skuMap = {};
  const externalIdMap = {};
  for (const p of products) {
    const sk = normKey(p.sku);
    const ex = normKey(p.external_id);
    if (sk) skuMap[sk] = p;
    if (ex && ex !== sk) externalIdMap[ex] = p;
  }

  let totalUpdated = 0;
  let totalMatched = 0;
  let totalSkipped = 0;
  const feedResults = {};

  for (const feed of feeds) {
    try {
      const result = await importXmlFeed(feed.url, { uploadImages: false });
      if (result.error || !result.products?.length) {
        feedResults[feed.id] = { error: result.error || 'Нет товаров', updated: 0, matched: 0 };
        continue;
      }

      const { updated, matched, skipped } = await transaction(async (conn) => {
        let updated = 0;
        let matched = 0;
        let skipped = 0;

        for (const fp of result.products) {
          // Normalized keys from feed product
          const fpSku = normKey(fp.sku);
          const fpExtId = normKey(fp.external_id);

          let product = null;
          if (fpSku && skuMap[fpSku])                   product = skuMap[fpSku];
          else if (fpExtId && externalIdMap[fpExtId])   product = externalIdMap[fpExtId];
          else if (fpExtId && skuMap[fpExtId])          product = skuMap[fpExtId];
          else if (fpSku && externalIdMap[fpSku])       product = externalIdMap[fpSku];

          if (!product) continue;
          matched++;

          const newPrice = parseFloat(fp.price) || 0;
          const oldPrice = parseFloat(product.price) || 0;

          if (newPrice > 0 && Math.abs(newPrice - oldPrice) > 0.001) {
            const newPrice2 = fp.price2 ? (parseFloat(fp.price2) || null) : null;
            await conn.query('UPDATE products SET price = ?, price2 = ? WHERE id = ? AND user_id = ?', [newPrice, newPrice2, product.id, userId]);
            updated++;
          } else {
            skipped++;
          }
        }

        return { updated, matched, skipped };
      });

      totalUpdated += updated;
      totalMatched += matched;
      totalSkipped += skipped;
      feedResults[feed.id] = { updated, matched, skipped };
    } catch (err) {
      feedResults[feed.id] = { error: err.message, updated: 0, matched: 0 };
    }
  }

  return {
    updated: totalUpdated,
    matched: totalMatched,
    skipped: totalSkipped,
    products_with_sync: products.length,
    feedResults,
  };
}

module.exports = { syncXmlPrices };
