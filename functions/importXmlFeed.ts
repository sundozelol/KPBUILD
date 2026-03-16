import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { XMLParser } from 'npm:fast-xml-parser@4.3.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return Response.json({ error: 'URL is required' }, { status: 400 });

    const res = await fetch(url);
    if (!res.ok) return Response.json({ error: `Не удалось загрузить фид: ${res.status}` }, { status: 400 });

    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      isArray: (name) => ["offer", "category", "picture", "param"].includes(name),
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    const shop = parsed?.yml_catalog?.shop || parsed?.КоммерческаяИнформация?.Каталог || {};
    const offers = shop?.offers?.offer || shop?.Товары?.Товар || [];
    const categories = shop?.categories?.category || shop?.Группы?.Группа || [];

    // Build category map
    const catMap = {};
    if (Array.isArray(categories)) {
      categories.forEach(c => {
        const id = c["@_id"] || c.ИД;
        const name = typeof c === "string" ? c : (c["#text"] || c.Наименование || "");
        if (id) catMap[String(id)] = name;
      });
    }

    const products = [];

    for (const offer of offers) {
      if (!offer) continue;

      const name = String(offer.name || "").trim();
      if (!name) continue;

      const price = parseFloat(String(offer.price || 0).replace(/[^\d.]/g, "")) || 0;

      // <picture> — first image
      const pics = Array.isArray(offer.picture) ? offer.picture : (offer.picture ? [offer.picture] : []);
      let image_url = String(pics[0] || "").trim();

      // Re-upload external images to base44
      if (image_url && !image_url.includes("base44") && !image_url.includes("blob:")) {
        try {
          const imgRes = await fetch(image_url);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const file = new File([blob], "product-image.jpg", { type: blob.type });
            const uploadResult = await base44.integrations.Core.UploadFile({ file });
            image_url = uploadResult.file_url;
          }
        } catch (e) {
          console.warn("Failed to re-upload image:", e);
          // Keep original URL if upload fails
        }
      }

      // <param name="Артикул"> — find among params
      let sku = "";
      const params = Array.isArray(offer.param) ? offer.param : (offer.param ? [offer.param] : []);
      for (const param of params) {
        if (param["@_name"] === "Артикул") {
          sku = String(param["#text"] || param || "").trim();
          break;
        }
      }

      products.push({ name, price, sku, image_url });
    }

    return Response.json({ products, total: products.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});