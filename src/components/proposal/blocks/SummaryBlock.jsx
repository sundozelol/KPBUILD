import React from "react";
import { Input } from "@/components/ui/input";
import { getBlockStyle, getBlockPadding } from "../themeUtils";

export default function SummaryBlock({ data, onChange, preview, theme = {}, allBlocks = [] }) {
   const totalColor = theme.totalColor || "#1d4ed8";
   const headerColor = theme.headerColor || "#2563eb";
   const fontSize = data.fontSize || 14;
   const totalSize = data.totalSize || 28;

  // Calculate totals from all product table blocks
  const productBlocks = allBlocks.filter(b => b.type === "products_table");
  const items = productBlocks.flatMap(b => b.data?.items || []);
  const priceType = productBlocks[0]?.data?.priceType || 1;
  const getItemPrice = (item) => {
    if (priceType === 2 && item.price2 != null) return item.price2;
    if (priceType === 3 && item.price3 != null) return item.price3;
    return item.price || 0;
  };
  const subtotal = items.reduce((sum, i) => sum + (getItemPrice(i) * i.qty), 0);
  const discount = data.discount || 0;
  const discountAmt = discount > 0 ? (subtotal * discount / 100) : 0;
  const total = subtotal - discountAmt;

  if (preview) {
    const radius = theme.blockRadius || 0;
    const blockStyle = getBlockStyle(theme);
    const pad = getBlockPadding(theme);
    return (
      <div style={{ fontFamily: theme.fontFamily, paddingLeft: pad.paddingLeft, paddingRight: pad.paddingRight, paddingTop: 32, paddingBottom: 32 }}>
        {data.heading && <h2 className="text-xl font-bold text-gray-800 mb-4">{data.heading}</h2>}
        <div
          style={{ ...blockStyle, borderRadius: radius + "px", border: blockStyle.border || "1px solid rgba(0,0,0,0.08)", overflow: "hidden", width: "100%", boxSizing: "border-box" }}
        >
          <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", fontSize: fontSize + "px", color: "#4b5563", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
             <span>Итого позиций</span>
             <span style={{ fontWeight: 500, color: "#1f2937" }}>{subtotal.toLocaleString("ru-RU")} ₽</span>
           </div>
           {discountAmt > 0 && (
             <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", fontSize: fontSize + "px", color: "#15803d", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
               <span>Скидка {discount}%</span>
               <span>− {discountAmt.toLocaleString("ru-RU")} ₽</span>
             </div>
           )}
           {data.note && (
             <div style={{ padding: "12px 20px", fontSize: (fontSize - 2) + "px", color: "#9ca3af", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>{data.note}</div>
           )}
           <div
             style={{
               padding: "16px 20px",
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
               color: "#ffffff",
               backgroundColor: headerColor,
             }}
           >
             <span style={{ fontWeight: 700, fontSize: (fontSize + 4) + "px" }}>ИТОГО</span>
             <span style={{ fontWeight: 700, fontSize: totalSize + "px" }}>{total.toLocaleString("ru-RU")} ₽</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Итого (Summary)</p>
      <Input
        placeholder="Заголовок (напр. Итоговая стоимость)"
        value={data.heading || ""}
        onChange={e => onChange({ ...data, heading: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Скидка %</label>
          <Input
            type="number"
            min="0"
            max="100"
            placeholder="0"
            value={data.discount || ""}
            onChange={e => onChange({ ...data, discount: parseFloat(e.target.value) || 0 })}
            className="h-8"
          />
        </div>
        <Input
          placeholder="Примечание (напр. НДС включён)"
          value={data.note || ""}
          onChange={e => onChange({ ...data, note: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер текста:</label>
          <input type="number" min="10" max="20" value={fontSize} onChange={e => onChange({ ...data, fontSize: parseInt(e.target.value) })} className="h-7 w-16 border rounded px-2 text-xs" />
          <span className="text-xs text-gray-400">px</span>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер суммы:</label>
          <input type="number" min="16" max="48" value={totalSize} onChange={e => onChange({ ...data, totalSize: parseInt(e.target.value) })} className="h-7 w-16 border rounded px-2 text-xs" />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
        Показывает сумму из всех блоков «Таблица товаров» на странице
      </div>
    </div>
  );
}