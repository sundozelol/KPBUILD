import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { XMLParser } from 'npm:fast-xml-parser@4.3.5';

async function parseFeed(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось загрузить фид: ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) => ["offer", "picture", "param"].includes(name),
    parseTagValue: true,
  });

  const parsed = parser.parse(xml);
  const shop = parsed?.yml_catalog?.shop || {};
  const offers = shop?.offers?.offer || [];

  const priceMap = {};
  for (const offer of offers) {
    if (!offer) continue;
    let sku = "";
    const params = Array.isArray(offer.param) ? offer.param : (offer.param ? [offer.param] : []);
    for (const param of params) {
      if (param["@_name"] === "Артикул") {
        sku = String(param["#text"] || "").trim();
        break;
      }
    }
    if (!sku) continue;
    const price = parseFloat(String(offer.price || 0).replace(/[^\d.]/g, "")) || 0;
    if (price > 0) priceMap[sku] = price;
  }
  return priceMap;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const feeds = await base44.asServiceRole.entities.XmlFeed.filter({ is_active: true });
    if (!feeds.length) {
      return Response.json({ error: 'Нет активных XML-фидов. Добавьте фид в разделе Товары.' }, { status: 400 });
    }

    // Merge price maps from all active feeds
    const mergedPriceMap = {};
    const feedResults = [];
    for (const feed of feeds) {
      try {
        const priceMap = await parseFeed(feed.url);
        Object.assign(mergedPriceMap, priceMap);
        feedResults.push({ name: feed.name, count: Object.keys(priceMap).length, error: null });
        await base44.asServiceRole.entities.XmlFeed.update(feed.id, {
          last_synced: new Date().toISOString(),
          last_result: `OK: ${Object.keys(priceMap).length} позиций`
        });
      } catch (e) {
        feedResults.push({ name: feed.name, count: 0, error: e.message });
        await base44.asServiceRole.entities.XmlFeed.update(feed.id, {
          last_synced: new Date().toISOString(),
          last_result: `Ошибка: ${e.message}`
        });
      }
    }

    const products = await base44.asServiceRole.entities.Product.filter({ sync_price_from_feed: true });

    let updated = 0, skipped = 0;
    const toUpdate = [];
    for (const product of products) {
      if (!product.sku || mergedPriceMap[product.sku] === undefined) { skipped++; continue; }
      const newPrice = mergedPriceMap[product.sku];
      if (newPrice !== product.price) toUpdate.push({ id: product.id, price: newPrice });
    }

    // Parallel batches of 20
    const BATCH = 20;
    for (let i = 0; i < toUpdate.length; i += BATCH) {
      const batch = toUpdate.slice(i, i + BATCH);
      await Promise.all(batch.map(p => base44.asServiceRole.entities.Product.update(p.id, { price: p.price })));
    }
    updated = toUpdate.length;

    return Response.json({ success: true, feeds: feedResults, products_with_sync: products.length, updated, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});