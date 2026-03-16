import React, { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Package, GripVertical, Trash } from "lucide-react";
import { getBlockStyle, getBlockPadding } from "../themeUtils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ProductsTableBlock({ data, onChange, preview, theme = {} }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSkuInput, setShowSkuInput] = useState(false);
  const [skuText, setSkuText] = useState("");

  const items = data.items || [];
  const tableHeaderColor = theme.tableHeaderColor || "#2563eb";
  const tableStyle = data.tableStyle || theme.tableStyle || "classic";

  const showSku = data.showSku !== false;
  const showUnit = data.showUnit !== false;
  const showTotal = data.showTotal !== false;
  const showQty = data.showQty !== false;
  const showImages = data.showImages === true;
  const priceType = data.priceType || 1;
  const fontSize = data.fontSize || 14;

  useEffect(() => {
    if (!preview) base44.entities.Product.list("name", 50000).then(setProducts);
  }, [preview]);

  // Get live product data to supplement potentially stale stored item prices
  const getLiveProduct = (item) => products.find(p => p.id === item.product_id);

  const getItemPrices = (item) => {
    const live = getLiveProduct(item);
    return {
      price:  item.price  ?? live?.price  ?? 0,
      price2: item.price2 ?? live?.price2 ?? null,
      price3: item.price3 ?? live?.price3 ?? null,
      price_label:  item.price_label  || live?.price_label  || "Цена",
      price2_label: item.price2_label || live?.price2_label || "Опт",
      price3_label: item.price3_label || live?.price3_label || "Дилер",
    };
  };

  const getItemPrice = (item) => {
    if (item._customPrice != null) return item._customPrice;
    const pt = item.activePriceType != null ? item.activePriceType : priceType;
    const prices = getItemPrices(item);
    if (pt === 2 && prices.price2 != null) return prices.price2;
    if (pt === 3 && prices.price3 != null) return prices.price3;
    return prices.price;
  };

  const addProduct = (product) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      onChange({ ...data, items: items.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      const heading = data.heading || product.category || "Состав предложения";
      onChange({
        ...data,
        heading,
        items: [...items, {
          product_id: product.id, name: product.name, sku: product.sku || "",
          price: product.price || 0, price2: product.price2 ?? null, price2_label: product.price2_label || "Опт",
          price3: product.price3 ?? null, price3_label: product.price3_label || "Дилер",
          unit: product.unit || "шт.", qty: 1,
          price_label: product.price_label || "Цена",
          category: product.category || "",
          image_url: product.image_url || null,
          activePriceType: null,
          _customPrice: null,
        }]
      });
    }
    setSearch("");
  };



  const removeItem = (idx) => onChange({ ...data, items: items.filter((_, i) => i !== idx) });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newItems = [...items];
    const [moved] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, moved);
    onChange({ ...data, items: newItems });
  };
  const updateQty = (idx, qty) => { const n = [...items]; n[idx] = { ...n[idx], qty: Math.max(1, parseInt(qty) || 1) }; onChange({ ...data, items: n }); };
  const updatePrice = (idx, val) => {
    const n = [...items];
    const v = val === "" ? null : parseFloat(val);
    n[idx] = { ...n[idx], _customPrice: isNaN(v) ? null : v };
    onChange({ ...data, items: n });
  };
  const setItemPriceType = (idx, pt) => {
    const n = [...items];
    const item = n[idx];
    const live = getLiveProduct(item);
    // Refresh all prices from live catalog when switching type
    const refreshed = {
      ...item,
      price:        item.price  ?? live?.price  ?? 0,
      price2:       item.price2 ?? live?.price2 ?? null,
      price3:       item.price3 ?? live?.price3 ?? null,
      price_label:  item.price_label  || live?.price_label  || "Цена",
      price2_label: item.price2_label || live?.price2_label || "Опт",
      price3_label: item.price3_label || live?.price3_label || "Дилер",
      activePriceType: item.activePriceType === pt ? null : pt,
      _customPrice: null,
    };
    n[idx] = refreshed;
    onChange({ ...data, items: n });
  };
  const resetItemPrice = (idx) => {
    const n = [...items];
    n[idx] = { ...n[idx], _customPrice: null, activePriceType: null };
    onChange({ ...data, items: n });
  };

  const addBySku = () => {
    const skus = skuText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (!skus.length) return;
    let newItems = [...items];
    skus.forEach(sku => {
      const product = products.find(p => p.sku?.toLowerCase() === sku.toLowerCase());
      if (!product) return;
      const existing = newItems.find(i => i.product_id === product.id);
      if (existing) {
        newItems = newItems.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        newItems.push({
          product_id: product.id, name: product.name, sku: product.sku || "",
          price: product.price || 0, price2: product.price2 ?? null, price2_label: product.price2_label || "Опт",
          price3: product.price3 ?? null, price3_label: product.price3_label || "Дилер",
          unit: product.unit || "шт.", qty: 1,
          price_label: product.price_label || "Цена",
          category: product.category || "",
          image_url: product.image_url || null,
          activePriceType: null, _customPrice: null,
        });
      }
    });
    onChange({ ...data, items: newItems });
    setSkuText("");
    setShowSkuInput(false);
  };

  const total = items.reduce((sum, i) => sum + getItemPrice(i) * i.qty, 0);
  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));
  const priceTypeLabel = priceType === 2 ? (items[0]?.price2_label || "Опт") : priceType === 3 ? (items[0]?.price3_label || "Дилер") : (data.price1_label || "Цена");

  if (preview) {
    const radius = theme.blockRadius || 0;
    const blockStyle = getBlockStyle(theme);
    const heading = data.heading || "Состав предложения";
    const blockRadius = theme.blockRadius || 0;

    const pad = getBlockPadding(theme);
    const isGlass = theme.blockMode === "glass";
    const padStyle = {
      paddingLeft: pad.paddingLeft,
      paddingRight: pad.paddingRight,
      paddingTop: 24,
      paddingBottom: 24,
      borderRadius: blockRadius + "px",
    };
    const containerStyle = {
      fontFamily: theme.fontFamily,
      ...padStyle,
      ...blockStyle,
      ...(isGlass ? {} : { backgroundColor: "#ffffff" }),
    };

    const fs = fontSize + "px";
    const fsSmall = Math.max(fontSize - 2, 10) + "px";

    // --- CARDS style ---
    if (tableStyle === "cards") {
      return (
        <div style={containerStyle}>
          <h2 style={{ fontSize: Math.max(fontSize + 4, 16) + "px", fontWeight: 700, marginBottom: 16, color: theme.headerColor || "#1f2937" }}>{heading}</h2>
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, i) => {
              const price = getItemPrice(item);
              return (
                <div key={i} style={{ ...blockStyle, borderRadius: radius + "px", border: blockStyle.border || "1px solid rgba(0,0,0,0.08)", overflow: "hidden", backgroundColor: "#fff" }}>
                  {showImages && item.image_url && (
                    <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
                  )}
                  <div style={{ padding: "10px 12px" }}>
                    <div className="font-semibold text-gray-800" style={{ fontSize: fs, wordBreak: "break-word" }}>{item.name}</div>
                    {showSku && item.sku && <div className="text-gray-400" style={{ fontSize: fsSmall }}>арт. {item.sku}</div>}
                    <div className="text-right font-semibold text-gray-800" style={{ fontSize: fs, whiteSpace: "nowrap", marginTop: 6 }}>
                      {price?.toLocaleString("ru-RU")}&nbsp;₽
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // --- TABLE STYLES ---
    const rowEvenColor = data.rowEvenColor;
    const rowOddColor = data.rowOddColor;
    const getRowBg = (i) => {
      const isEven = i % 2 === 0;
      if (isEven && rowEvenColor) return rowEvenColor;
      if (!isEven && rowOddColor) return rowOddColor;
      if (isGlass) return isEven ? "transparent" : "rgba(255,255,255,0.08)";
      if (tableStyle === "striped" || tableStyle === "classic") return isEven ? "#fff" : "#f9fafb";
      if (tableStyle === "dark") return isEven ? "#1f2937" : "#111827";
      if (tableStyle === "modern") return isEven ? "#fff" : `${tableHeaderColor}08`;
      return "#fff";
    };
    const getRowTextColor = () => tableStyle === "dark" ? "#e5e7eb" : "#374151";
    const getHeaderBg = () => {
      if (isGlass) return "rgba(255,255,255,0.18)";
      if (tableStyle === "minimal" || tableStyle === "flat") return "transparent";
      if (tableStyle === "dark") return "#111827";
      if (tableStyle === "modern") return `${tableHeaderColor}15`;
      return tableHeaderColor;
    };
    const getHeaderText = () => {
      if (isGlass) return tableHeaderColor;
      if (tableStyle === "minimal") return "#6b7280";
      if (tableStyle === "flat") return tableHeaderColor;
      if (tableStyle === "modern") return tableHeaderColor;
      if (tableStyle === "dark") return "#e5e7eb";
      return "#fff";
    };
    const getBorder = () => {
      if (tableStyle === "bordered") return `1px solid ${tableHeaderColor}30`;
      if (tableStyle === "minimal") return "none";
      if (tableStyle === "flat") return "none";
      if (tableStyle === "dark") return "1px solid #374151";
      return "none";
    };
    const getRowBorder = () => {
      if (isGlass) return "1px solid rgba(255,255,255,0.12)";
      if (tableStyle === "bordered") return `1px solid ${tableHeaderColor}20`;
      if (tableStyle === "minimal") return "1px solid #e5e7eb";
      if (tableStyle === "compact") return "1px solid #f3f4f6";
      if (tableStyle === "flat") return "1px solid #f3f4f6";
      if (tableStyle === "dark") return "1px solid #374151";
      if (tableStyle === "modern") return `1px solid ${tableHeaderColor}10`;
      return "none";
    };
    const rowHeight = data.rowHeight || (tableStyle === "compact" ? "compact" : "normal");
    const cellPad = rowHeight === "compact" ? "4px 8px" : rowHeight === "large" ? "14px 12px" : "8px 12px";
    const tableRadius = (tableStyle === "rounded" || tableStyle === "modern") ? radius || 12 : (tableStyle === "bordered" ? radius : 0);

    return (
      <div style={containerStyle}>
        <h2 style={{ fontSize: Math.max(fontSize + 4, 16) + "px", fontWeight: 700, marginBottom: 16, color: theme.headerColor || "#1f2937" }}>{heading}</h2>
        <div style={{ borderRadius: tableRadius + "px", overflow: "hidden", border: tableStyle === "bordered" ? `1px solid ${tableHeaderColor}30` : "none" }}>
          <table className="w-full" style={{ fontSize: fs, borderCollapse: "collapse", tableLayout: "auto" }}>
            <thead>
              <tr style={{ backgroundColor: getHeaderBg(), color: getHeaderText(), borderBottom: tableStyle === "minimal" ? "2px solid #e5e7eb" : getBorder() }}>
                {showImages && <th style={{ padding: cellPad, width: "52px" }}></th>}
                <th style={{ textAlign: "left", padding: cellPad, fontWeight: 600 }}>Наименование</th>
                {showSku && <th style={{ textAlign: "center", padding: cellPad, fontWeight: 600, whiteSpace: "nowrap" }}>Арт.</th>}
                {showQty && <th style={{ textAlign: "center", padding: cellPad, fontWeight: 600, whiteSpace: "nowrap" }}>Кол-во</th>}
                {showUnit && <th style={{ textAlign: "center", padding: cellPad, fontWeight: 600, whiteSpace: "nowrap" }}>Ед.</th>}
                <th style={{ textAlign: "right", padding: cellPad, fontWeight: 600, whiteSpace: "nowrap" }}>{priceTypeLabel}</th>
                {showTotal && <th style={{ textAlign: "right", padding: cellPad, fontWeight: 600, whiteSpace: "nowrap" }}>Сумма</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const price = getItemPrice(item);
                return (
                  <tr key={i} style={{ backgroundColor: getRowBg(i), color: getRowTextColor(), borderBottom: getRowBorder() }}>
                    {showImages && (
                      <td style={{ padding: "4px 8px", verticalAlign: "middle", width: "52px", backgroundColor: "#fff" }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", display: "block" }} />
                        ) : (
                          <div style={{ width: "40px", height: "40px", backgroundColor: "#f3f4f6", borderRadius: "4px" }} />
                        )}
                      </td>
                    )}
                    <td style={{ padding: cellPad, fontWeight: 500, verticalAlign: "middle" }}>{item.name}</td>
                    {showSku && <td style={{ textAlign: "center", padding: cellPad, opacity: 0.7, verticalAlign: "middle", whiteSpace: "nowrap" }}>{item.sku}</td>}
                    {showQty && <td style={{ textAlign: "center", padding: cellPad, verticalAlign: "middle", whiteSpace: "nowrap" }}>{item.qty}</td>}
                    {showUnit && <td style={{ textAlign: "center", padding: cellPad, opacity: 0.7, verticalAlign: "middle", whiteSpace: "nowrap" }}>{item.unit}</td>}
                    <td style={{ textAlign: "right", padding: cellPad, verticalAlign: "middle", whiteSpace: "nowrap" }}>{price?.toLocaleString("ru-RU")}&nbsp;₽</td>
                    {showTotal && <td style={{ textAlign: "right", padding: cellPad, fontWeight: 600, verticalAlign: "middle", whiteSpace: "nowrap" }}>{(price * item.qty).toLocaleString("ru-RU")}&nbsp;₽</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- EDITOR ---
  return (
    <div className="p-4 bg-white rounded-xl border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Таблица товаров</p>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => { setShowSkuInput(s => !s); setShowSearch(false); }} title="Добавить списком артикулов">
            <Plus className="w-3 h-3 mr-1" /> По артикулам
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setShowSearch(s => !s); setShowSkuInput(false); }}>
            <Search className="w-3 h-3 mr-1" /> Поиск
          </Button>
          {items.length > 0 && (
            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => { if (confirm("Удалить все товары из таблицы?")) onChange({ ...data, items: [] }); }} title="Удалить все товары">
              <Trash className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Heading */}
      <Input
        placeholder="Заголовок блока (напр. Состав предложения)"
        value={data.heading || ""}
        onChange={e => onChange({ ...data, heading: e.target.value })}
        className="h-8 text-sm"
      />

      {/* Table style selector */}
      <div>
        <p className="text-[10px] text-gray-400 uppercase mb-1">Стиль таблицы</p>
        <div className="flex flex-wrap gap-1">
          {["classic","striped","bordered","minimal","cards","compact","modern","dark","rounded","flat"].map(s => (
            <button
              key={s}
              onClick={() => onChange({ ...data, tableStyle: s })}
              className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                (data.tableStyle || "classic") === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {s === "classic" ? "Классика" : s === "striped" ? "Полоски" : s === "bordered" ? "Рамка" : s === "minimal" ? "Минимал" : s === "cards" ? "Карточки" : s === "compact" ? "Компакт" : s === "modern" ? "Модерн" : s === "dark" ? "Тёмная" : s === "rounded" ? "Округлая" : "Flat"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
          <input type="checkbox" checked={showImages} onChange={e => onChange({ ...data, showImages: e.target.checked })} className="rounded" /> Фото
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
          <input type="checkbox" checked={showSku} onChange={e => onChange({ ...data, showSku: e.target.checked })} className="rounded" /> Артикул
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
          <input type="checkbox" checked={showQty} onChange={e => onChange({ ...data, showQty: e.target.checked })} className="rounded" /> Кол-во
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
          <input type="checkbox" checked={showUnit} onChange={e => onChange({ ...data, showUnit: e.target.checked })} className="rounded" /> Ед. изм.
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
          <input type="checkbox" checked={showTotal} onChange={e => onChange({ ...data, showTotal: e.target.checked })} className="rounded" /> Сумма
        </label>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-gray-400">Цена:</span>
          {[1,2,3].map(pt => (
            <button key={pt} onClick={() => onChange({
              ...data,
              priceType: pt,
              items: (data.items || []).map(({ activePriceType, _customPrice, ...item }) => {
                const live = getLiveProduct(item);
                return {
                  ...item,
                  price:        item.price        ?? live?.price        ?? 0,
                  price2:       item.price2        != null ? item.price2        : (live?.price2        ?? null),
                  price3:       item.price3        != null ? item.price3        : (live?.price3        ?? null),
                  price_label:  item.price_label  || live?.price_label  || 'Цена',
                  price2_label: item.price2_label || live?.price2_label || 'Опт',
                  price3_label: item.price3_label || live?.price3_label || 'Дилер',
                };
              }),
            })}
              className={`px-2 py-0.5 rounded text-xs border ${priceType === pt ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
            >{pt}</button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 uppercase whitespace-nowrap">Размер шрифта</span>
        <input
          type="range" min="10" max="22" step="1"
          value={data.fontSize || 14}
          onChange={e => onChange({ ...data, fontSize: parseInt(e.target.value) })}
          className="flex-1"
        />
        <span className="text-xs text-gray-500 w-8 text-right">{data.fontSize || 14}px</span>
      </div>

      {/* Row height */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 uppercase whitespace-nowrap">Размер строки</span>
        <div className="flex gap-1">
          {[["compact", "Маленький"], ["normal", "Обычный"], ["large", "Большой"]].map(([v, label]) => (
            <button
              key={v}
              onClick={() => onChange({ ...data, rowHeight: v })}
              className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                (data.rowHeight || "normal") === v ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Row colors */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] text-gray-400 uppercase whitespace-nowrap">Цвет строк</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">Чётные</span>
          <input type="color" value={data.rowEvenColor || "#ffffff"} onChange={e => onChange({ ...data, rowEvenColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer" title="Цвет чётных строк" />
          {data.rowEvenColor && <button onClick={() => onChange({ ...data, rowEvenColor: null })} className="text-[10px] text-gray-400 hover:text-gray-600 leading-none">×</button>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">Нечётные</span>
          <input type="color" value={data.rowOddColor || "#f9fafb"} onChange={e => onChange({ ...data, rowOddColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer" title="Цвет нечётных строк" />
          {data.rowOddColor && <button onClick={() => onChange({ ...data, rowOddColor: null })} className="text-[10px] text-gray-400 hover:text-gray-600 leading-none">×</button>}
        </div>
      </div>

      {showSkuInput && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
          <p className="text-xs text-gray-500">Введите артикулы через запятую, точку с запятой или по одному на строке:</p>
          <textarea
            className="w-full border rounded p-2 text-sm h-24 resize-none"
            placeholder={"SR-057100300\nSR-057150300\nSAMC-057952050"}
            value={skuText}
            onChange={e => setSkuText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addBySku} className="bg-gray-900 hover:bg-gray-700 text-white">Добавить</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowSkuInput(false); setSkuText(""); }}>Отмена</Button>
          </div>
        </div>
      )}

      {showSearch && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="relative mb-2">
            <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-gray-400" />
            <Input placeholder="Поиск товаров..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-sm" />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredProducts.slice(0, 20).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer" onClick={() => addProduct(p)}>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-medium">{p.name}</span>
                  {p.sku && <span className="text-xs text-gray-400">{p.sku}</span>}
                </div>
                <span className="text-sm font-semibold text-gray-900">{p.price?.toLocaleString("ru-RU")} ₽</span>
              </div>
            ))}
            {filteredProducts.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Ничего не найдено</p>}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-6"></th>
                <th className="text-left p-2 text-gray-600">Товар</th>
                <th className="text-center p-2 text-gray-600 w-16">Кол-во</th>
                <th className="text-right p-2 text-gray-600">Цена</th>
                <th className="text-right p-2 text-gray-600 w-24">Сумма</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="items">
                {(provided) => (
                  <tbody ref={provided.innerRef} {...provided.droppableProps}>
                    {items.map((item, i) => {
                      const price = getItemPrice(item);
                      const activePt = item.activePriceType != null ? item.activePriceType : priceType;
                      const isCustom = item._customPrice != null;
                      const priceInputVal = isCustom ? item._customPrice : price;
                      const prices = getItemPrices(item);
                      return (
                        <Draggable key={item.product_id || i} draggableId={String(item.product_id || i)} index={i}>
                          {(dragProvided, snapshot) => (
                            <tr
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`border-t ${snapshot.isDragging ? "bg-gray-50" : ""}`}
                            >
                              <td className="pl-2" {...dragProvided.dragHandleProps}>
                                <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-grab" />
                              </td>
                              <td className="p-2 font-medium">
                                <div className="flex items-center gap-2">
                                  {(item.image_url || getLiveProduct(item)?.image_url) && (
                                    <img
                                      src={item.image_url || getLiveProduct(item)?.image_url}
                                      alt=""
                                      className="w-8 h-8 rounded object-cover flex-shrink-0 bg-gray-100"
                                      onError={e => { e.target.style.display = "none"; }}
                                    />
                                  )}
                                  {item.name}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <Input type="number" value={item.qty} onChange={e => updateQty(i, e.target.value)} className="h-7 text-center w-14 mx-auto" />
                              </td>
                              <td className="p-2">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Price type buttons */}
                                  <div className="flex gap-0.5">
                                    {[
                                      { pt: 1, val: prices.price,  label: prices.price_label },
                                      { pt: 2, val: prices.price2, label: prices.price2_label },
                                      { pt: 3, val: prices.price3, label: prices.price3_label },
                                    ].map(({ pt, val, label }) => {
                                      const hasPrice = val != null && val !== 0;
                                      const isActive = !isCustom && activePt === pt;
                                      return (
                                        <button
                                          key={pt}
                                          title={`${label}: ${hasPrice ? val.toLocaleString("ru-RU") + " ₽" : "нет цены"}`}
                                          onClick={() => hasPrice && setItemPriceType(i, pt)}
                                          className={`text-[10px] w-5 h-5 rounded border transition-all leading-none font-semibold ${
                                            isActive
                                              ? "bg-gray-900 text-white border-gray-900"
                                              : hasPrice
                                                ? "bg-white text-gray-500 border-gray-300 hover:border-gray-600 cursor-pointer"
                                                : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                          }`}
                                        >{pt}</button>
                                      );
                                    })}
                                    {isCustom && (
                                      <button
                                        title="Сбросить к прайсу"
                                        onClick={() => resetItemPrice(i)}
                                        className="text-[10px] w-5 h-5 rounded border border-orange-300 bg-orange-50 text-orange-500 leading-none"
                                      >↺</button>
                                    )}
                                  </div>
                                  {/* Price input */}
                                  <Input
                                    type="number"
                                    value={priceInputVal ?? ""}
                                    onChange={e => updatePrice(i, e.target.value)}
                                    className={`h-7 text-right w-24 ${isCustom ? "border-orange-300 bg-orange-50" : ""}`}
                                    title="Введите цену вручную"
                                  />
                                </div>
                              </td>
                              <td className="p-2 text-right font-semibold whitespace-nowrap">{(price * item.qty).toLocaleString("ru-RU")}&nbsp;₽</td>
                              <td className="p-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(i)}><X className="w-3 h-3 text-red-400" /></Button></td>
                            </tr>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </DragDropContext>
          </table>
        </div>
      )}
    </div>
  );
}