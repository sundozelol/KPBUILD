import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Plus, X, Star } from "lucide-react";
import { base44 } from "@/api/apiClient";
import { getBlockStyle, getBlockPadding } from "../themeUtils";

export default function AdvantagesBlock({ data, onChange, preview, theme = {} }) {
  const items = data.items || [];
  const columns = data.columns || 3;
  const iconSize = data.iconSize || 40;

  const [uploading, setUploading] = useState(null);

  const handleIconUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(idx);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...items];
    updated[idx] = { ...updated[idx], icon_url: file_url };
    onChange({ ...data, items: updated });
    setUploading(null);
    e.target.value = "";
  };

  const addItem = () => {
    onChange({ ...data, items: [...items, { title: "", text: "", icon_url: "" }] });
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...data, items: updated });
  };

  const removeItem = (idx) => {
    onChange({ ...data, items: items.filter((_, i) => i !== idx) });
  };

  if (preview) {
    const blockStyle = getBlockStyle(theme);
    const pad = getBlockPadding(theme);
    const padStyle = { paddingLeft: pad.paddingLeft, paddingRight: pad.paddingRight, paddingTop: 24, paddingBottom: 24 };
    const radius = theme.blockRadius || 0;

    return (
      <div style={{ fontFamily: theme.fontFamily, ...padStyle }}>
        {data.heading && <h2 className="text-xl font-bold text-gray-800 mb-4">{data.heading}</h2>}
        <div className="gap-4" style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="p-4 bg-white flex flex-col items-center text-center"
              style={{ ...blockStyle, borderRadius: radius + "px", border: blockStyle.border || "1px solid rgba(0,0,0,0.08)" }}
            >
              {item.icon_url ? (
                <img
                  src={item.icon_url}
                  alt=""
                  className="object-cover mb-3 flex-shrink-0"
                  style={{ width: iconSize, height: iconSize, borderRadius: "6px" }}
                />
              ) : (
                <div
                  className="mb-3 flex items-center justify-center flex-shrink-0"
                  style={{ width: iconSize, height: iconSize, backgroundColor: (theme.accentColor || "#2563eb") + "15", borderRadius: "6px" }}
                >
                  <Star className="text-current" style={{ width: iconSize * 0.5, height: iconSize * 0.5, color: theme.accentColor || "#2563eb" }} />
                </div>
              )}
              {item.title && <div className="font-semibold text-sm text-gray-800 mb-1">{item.title}</div>}
              {item.text && <div className="text-xs text-gray-500 leading-relaxed">{item.text}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Преимущества</p>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="w-3 h-3 mr-1" /> Добавить
        </Button>
      </div>

      <Input
        placeholder="Заголовок раздела"
        value={data.heading || ""}
        onChange={e => onChange({ ...data, heading: e.target.value })}
        className="h-8"
      />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase">Колонки</span>
          {[2, 3, 4].map(c => (
            <button
              key={c}
              onClick={() => onChange({ ...data, columns: c })}
              className={`text-xs px-2 py-0.5 rounded border ${columns === c ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"}`}
            >{c}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-gray-400 uppercase whitespace-nowrap">Иконка</span>
          <input
            type="range" min="24" max="64" step="4"
            value={iconSize}
            onChange={e => onChange({ ...data, iconSize: parseInt(e.target.value) })}
            className="w-20"
          />
          <span className="text-xs text-gray-500 w-8">{iconSize}px</span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border rounded-lg p-3 bg-gray-50 space-y-2 relative">
            <button onClick={() => removeItem(i)} className="absolute top-2 right-2">
              <X className="w-3 h-3 text-red-400" />
            </button>
            <div className="flex gap-2 items-center">
              {item.icon_url ? (
                 <img src={item.icon_url} className="w-8 h-8 object-cover rounded" alt="" />
               ) : (
                 <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                   <Star className="w-4 h-4 text-gray-400" />
                 </div>
               )}
              <label className="cursor-pointer">
                <input type="file" accept="image/png,image/svg+xml" className="hidden" onChange={e => handleIconUpload(e, i)} />
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-3 h-3 mr-1" />{uploading === i ? "..." : "Иконка"}</span>
                </Button>
              </label>
              {item.icon_url && (
                <button onClick={() => updateItem(i, "icon_url", "")} className="text-xs text-red-400 hover:underline">Удалить</button>
              )}
            </div>
            <Input
              placeholder="Заголовок"
              value={item.title || ""}
              onChange={e => updateItem(i, "title", e.target.value)}
              className="h-7 text-sm"
            />
            <Input
              placeholder="Описание"
              value={item.text || ""}
              onChange={e => updateItem(i, "text", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}