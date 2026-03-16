import React, { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2, RefreshCcw, CheckCircle2, AlertCircle, Download, Eye, Loader2, Zap } from "lucide-react";

export default function XmlFeedsModal({ onClose, onSyncDone }) {
  const [feeds, setFeeds] = useState([]);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [enablingSync, setEnablingSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importingFeedId, setImportingFeedId] = useState(null);
  const [feedCategories, setFeedCategories] = useState({});
  const [syncResult, setSyncResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSelected, setPreviewSelected] = useState([]);

  useEffect(() => { loadFeeds(); }, []);

  const loadFeeds = async () => {
    const data = await base44.entities.XmlFeed.list("-created_date");
    setFeeds(data);
    const cats = {};
    data.forEach(f => { if (f.default_category) cats[f.id] = f.default_category; });
    setFeedCategories(cats);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return;
    setAdding(true);
    await base44.entities.XmlFeed.create({ name: newName.trim(), url: newUrl.trim(), is_active: true, default_category: newCategory.trim() || undefined });
    setNewName(""); setNewUrl(""); setNewCategory("");
    await loadFeeds();
    setAdding(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить фид?")) return;
    await base44.entities.XmlFeed.delete(id);
    await loadFeeds();
  };

  const handleToggle = async (feed) => {
    await base44.entities.XmlFeed.update(feed.id, { is_active: !feed.is_active });
    await loadFeeds();
  };

  const handleSaveFeedCategory = async (feedId, category) => {
    setFeedCategories(prev => ({ ...prev, [feedId]: category }));
    await base44.entities.XmlFeed.update(feedId, { default_category: category });
  };

  const handlePreviewFeed = async (feed) => {
    setImportingFeedId(feed.id);
    setSyncResult(null);
    try {
      const resp = await base44.functions.invoke("importXmlFeed", { url: feed.url, uploadImages: false });
      const products = resp.data && resp.data.products ? resp.data.products : [];
      if (!products.length) {
        setSyncResult({ error: (resp.data && resp.data.error) || "Фид не содержит товаров или не удалось распарсить" });
        return;
      }
      const categoryFromFeed = feedCategories[feed.id] || feed.default_category || "";
      const withCategory = products.map(p => ({ ...p, category: p.category || categoryFromFeed }));
      setPreview({ feed, products: withCategory, total: (resp.data && resp.data.total) || products.length });
      setPreviewSelected(withCategory.map((_, i) => i));
      setShowPreview(true);
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setImportingFeedId(null);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !previewSelected.length) return;
    setImporting(true);
    try {
      const toImport = previewSelected.map(i => preview.products[i]);
      const feedId = preview.feed.id;

      const existing = await base44.entities.Product.list("name", 99999);
      const skuMap = {};
      existing.forEach(p => { if (p.sku) skuMap[p.sku] = p.id; });

      const toCreate = [];
      let updated = 0;
      for (const p of toImport) {
        const enriched = { ...p, sync_price_from_feed: true, feed_id: feedId };
        if (p.sku && skuMap[p.sku]) { await base44.entities.Product.update(skuMap[p.sku], enriched); updated++; }
        else toCreate.push(enriched);
      }
      if (toCreate.length) await base44.entities.Product.bulkCreate(toCreate);
      setSyncResult({ importDone: true, created: toCreate.length, updated });
      setShowPreview(false);
      setPreview(null);
      if (onSyncDone) onSyncDone();
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setImporting(false);
    }
  };

  const handleImportFeed = async (feed) => {
    setImportingFeedId(feed.id);
    setSyncResult(null);
    try {
      const resp = await base44.functions.invoke("importXmlFeed", { url: feed.url, uploadImages: false });
      const products = resp.data && resp.data.products ? resp.data.products : [];
      if (!products.length) { setSyncResult({ error: (resp.data && resp.data.error) || "Фид не содержит товаров" }); return; }

      const category = feedCategories[feed.id] || feed.default_category || "";
      const existing = await base44.entities.Product.list("name", 99999);
      const skuMap = {};
      existing.forEach(p => { if (p.sku) skuMap[p.sku] = p.id; });
      const toCreate = [];
      let updated = 0;
      for (const p of products) {
        const enriched = { ...p, sync_price_from_feed: true, feed_id: feed.id, ...(category ? { category } : {}) };
        if (p.sku && skuMap[p.sku]) { await base44.entities.Product.update(skuMap[p.sku], enriched); updated++; }
        else toCreate.push(enriched);
      }
      if (toCreate.length) await base44.entities.Product.bulkCreate(toCreate);
      setSyncResult({ importDone: true, created: toCreate.length, updated });
      if (onSyncDone) onSyncDone();
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setImportingFeedId(null);
    }
  };

  const handleEnableSync = async (feed) => {
    setEnablingSync(feed.id);
    try {
      const resp = await base44.functions.invoke("enableFeedSync", { feedId: feed.id });
      setSyncResult({ enableDone: true, updated: resp.data?.updated || 0 });
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setEnablingSync(null);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress({ step: "Загрузка XML-фидов...", percent: 10 });
    const t1 = setTimeout(() => setSyncProgress({ step: "Парсинг товаров из фидов...", percent: 35 }), 1500);
    const t2 = setTimeout(() => setSyncProgress({ step: "Сравнение цен с базой...", percent: 60 }), 3500);
    const t3 = setTimeout(() => setSyncProgress({ step: "Обновление цен...", percent: 85 }), 6000);
    try {
      const resp = await base44.functions.invoke("syncXmlPrices", {});
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setSyncProgress({ step: "Готово!", percent: 100 });
      setSyncResult(resp.data);
      setTimeout(() => setSyncProgress(null), 1000);
      if (resp.data && !resp.data.error && onSyncDone) onSyncDone();
    } catch (e) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setSyncResult({ error: e.message });
      setSyncProgress(null);
    } finally {
      setSyncing(false);
    }
  };

  if (showPreview && preview) {
    const togglePrev = (i) => setPreviewSelected(sel => sel.includes(i) ? sel.filter(x => x !== i) : [...sel, i]);
    const toggleAllPrev = () => setPreviewSelected(sel => sel.length === preview.products.length ? [] : preview.products.map((_, i) => i));
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b">
            <div>
              <h2 className="font-bold text-lg">Предпросмотр импорта</h2>
              <p className="text-xs text-gray-400 mt-0.5">{preview.feed.name} — найдено товаров: {preview.total}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Выбрано: {previewSelected.length} из {preview.products.length}</span>
              <button onClick={toggleAllPrev} className="text-xs text-gray-900 hover:underline">
                {previewSelected.length === preview.products.length ? "Снять все" : "Выбрать все"}
              </button>
            </div>
            <div className="space-y-1.5">
              {preview.products.slice(0, 200).map((p, i) => (
                <div key={i} onClick={() => togglePrev(i)}
                  className={["flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all text-sm", previewSelected.includes(i) ? "border-gray-300 bg-gray-50" : "border-gray-200 hover:border-gray-300"].join(" ")}>
                  <div className={["w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center", previewSelected.includes(i) ? "bg-gray-900 border-gray-900" : "border-gray-300"].join(" ")}>
                    {previewSelected.includes(i) && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="white" strokeWidth="2"><polyline points="2,6 5,9 10,3"/></svg>
                    )}
                  </div>
                  {p.image_url && <img src={p.image_url} alt="" className="w-8 h-8 object-cover rounded bg-gray-100 flex-shrink-0" onError={e => { e.target.style.display = "none"; }} />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-gray-400">{[p.sku && ("Арт: " + p.sku), p.category].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-gray-700">{p.price != null ? p.price.toLocaleString("ru-RU") : "—"} ₽</div>
                    {p.price2 && <div className="text-xs text-gray-400 line-through">{p.price2.toLocaleString("ru-RU")} ₽</div>}
                  </div>
                </div>
              ))}
              {preview.products.length > 200 && (
                <p className="text-xs text-center text-gray-400 py-2">Показаны первые 200 из {preview.products.length} товаров.</p>
              )}
            </div>
          </div>
          <div className="p-5 border-t flex gap-3">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">Назад</Button>
            <Button onClick={handleConfirmImport} disabled={!previewSelected.length || importing} className="flex-1 bg-gray-900 hover:bg-gray-700">
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {importing ? "Импортирую..." : ("Импортировать " + previewSelected.length)}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">XML / YML фиды</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-gray-600">Добавить фид</p>
            <Input placeholder="Название (напр. Поставщик А)" value={newName} onChange={e => setNewName(e.target.value)} className="h-8 text-sm" />
            <Input placeholder="https://example.com/feed.xml или .yml" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="h-8 text-sm" />
            <Input placeholder="Категория по умолчанию (необязательно)" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="h-8 text-sm" />
            <Button size="sm" onClick={handleAdd} disabled={adding || !newName.trim() || !newUrl.trim()} className="w-full bg-gray-900 hover:bg-gray-700">
              <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </div>

          {feeds.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Нет добавленных фидов</p>
          ) : (
            <div className="space-y-2">
              {feeds.map(feed => (
                <div key={feed.id} className="flex items-start gap-3 border rounded-xl p-3">
                  <input type="checkbox" className="mt-1 w-4 h-4 cursor-pointer accent-gray-900"
                    checked={!!feed.is_active} onChange={() => handleToggle(feed)} title="Включить в автосинк цен" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">{feed.name}</div>
                    <div className="text-xs text-gray-400 truncate">{feed.url}</div>
                    <div className="mt-2">
                      <Input placeholder="Категория для новых товаров"
                        value={feedCategories[feed.id] != null ? feedCategories[feed.id] : (feed.default_category || "")}
                        onChange={e => setFeedCategories(prev => ({ ...prev, [feed.id]: e.target.value }))}
                        onBlur={e => handleSaveFeedCategory(feed.id, e.target.value)}
                        className="h-7 text-xs" />
                    </div>
                    {feed.last_synced && (
                      <div className={["text-xs mt-1.5 flex items-center gap-1", feed.last_result && feed.last_result.startsWith("Ошибка") ? "text-red-500" : "text-green-600"].join(" ")}>
                        {feed.last_result && feed.last_result.startsWith("Ошибка") ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {feed.last_result} · {new Date(feed.last_synced).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handlePreviewFeed(feed)} disabled={importingFeedId === feed.id}>
                      {importingFeedId === feed.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
                      Просмотр
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleImportFeed(feed)} disabled={importingFeedId === feed.id}>
                      <Download className="w-3 h-3 mr-1" /> Импорт
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleEnableSync(feed)} disabled={enablingSync === feed.id} title="Включить синк для всех товаров этого фида">
                      {enablingSync === feed.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 mr-1" />}
                      Синк ВКЛ
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(feed.id)}>
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {syncProgress && (
            <div className="rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-700 font-medium">
                <span>{syncProgress.step}</span>
                <span>{syncProgress.percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-900 h-2 rounded-full transition-all duration-700" style={{ width: syncProgress.percent + "%" }} />
              </div>
            </div>
          )}

          {syncResult && (
            <div className={["rounded-lg p-3 text-sm flex items-start gap-2", syncResult.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"].join(" ")}>
              {syncResult.error ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>
                {syncResult.error ? ("Ошибка: " + syncResult.error)
                  : syncResult.importDone ? ("Создано " + syncResult.created + ", обновлено " + syncResult.updated + " товаров")
                  : syncResult.enableDone ? ("Синхронизация включена для " + syncResult.updated + " товаров")
                  : ("Обновлено " + syncResult.updated + " из " + syncResult.products_with_sync + " товаров" + (syncResult.matched != null ? " · Совпало: " + syncResult.matched + ", без изменений: " + (syncResult.skipped || 0) : ""))}
              </span>
            </div>
          )}
        </div>

        <div className="p-5 border-t flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Закрыть</Button>
          <Button onClick={handleSyncNow} disabled={syncing || feeds.filter(f => f.is_active).length === 0} className="flex-1 bg-gray-900 hover:bg-gray-700">
            <RefreshCcw className={"w-4 h-4 mr-2 " + (syncing ? "animate-spin" : "")} />
            {syncing ? "Обновление..." : "Обновить цены"}
          </Button>
        </div>
      </div>
    </div>
  );
}
