import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Upload } from "lucide-react";
import { base44 } from "@/api/apiClient";
import { getBlockStyle, getBlockPadding } from "../themeUtils";

const COLS_OPTIONS = [1, 2, 3, 4];

export default function TermsBlock({ data, onChange, preview, theme = {} }) {
   const [uploading, setUploading] = useState(null);
   const fontSize = data.fontSize || 13;
   const labelSize = data.labelSize || 11;
   const terms = data.terms || [
     { icon: "🕐", label: "Срок поставки", value: "", image_url: "" },
     { icon: "💳", label: "Условия оплаты", value: "", image_url: "" },
     { icon: "📦", label: "Упаковка", value: "", image_url: "" },
     { icon: "🛡️", label: "Гарантия", value: "", image_url: "" },
   ];
   const cols = data.cols || 2;

   const uploadTermImage = async (i, file) => {
     setUploading(i);
     const { file_url } = await base44.integrations.Core.UploadFile({ file });
     updateTerm(i, "image_url", file_url);
     setUploading(null);
   };

  const updateTerm = (i, field, val) => {
    const newTerms = [...terms];
    newTerms[i] = { ...newTerms[i], [field]: val };
    onChange({ ...data, terms: newTerms });
  };

  const addTerm = () => {
    onChange({ ...data, terms: [...terms, { icon: "✅", label: "", value: "" }] });
  };

  const removeTerm = (i) => {
    onChange({ ...data, terms: terms.filter((_, idx) => idx !== i) });
  };

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[cols] || "grid-cols-2";

  if (preview) {
    const filled = terms.filter(t => t.value || t.label);
    const accentColor = theme.accentColor || "#2563eb";
    const blockStyle = getBlockStyle(theme);
    const radius = (theme.blockRadius || 0) + "px";
    const pad = getBlockPadding(theme);
    return (
      <div style={{ fontFamily: theme.fontFamily, paddingLeft: pad.paddingLeft, paddingRight: pad.paddingRight, paddingTop: 24, paddingBottom: 24 }}>
        <h2 className="text-xl font-bold text-gray-800 mb-5">{data.heading || "Условия предложения"}</h2>
        <div className={`grid ${gridClass} gap-4`}>
          {filled.map((term, i) => (
            <div key={i} className="bg-white p-4 flex items-start gap-3" style={{ ...blockStyle, borderRadius: radius || "16px", border: blockStyle.border || "1px solid rgba(0,0,0,0.06)" }}>
              <div
                className="w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl"
                style={{ backgroundColor: accentColor + "18", borderRadius: Math.max(parseInt(radius) - 4, 8) + "px" }}
              >
                {term.image_url ? <img src={term.image_url} className="w-full h-full object-cover rounded" alt="" /> : term.icon}
              </div>
              <div className="min-w-0">
                 <div className="text-gray-400 uppercase tracking-wide leading-none mb-1" style={{ fontSize: labelSize + "px" }}>{term.label}</div>
                 <div className="font-semibold text-gray-800 leading-snug" style={{ fontSize: fontSize + "px" }}>{term.value}</div>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Условия</p>
        <Button size="sm" variant="outline" onClick={addTerm}>
          <Plus className="w-3 h-3 mr-1" /> Добавить
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <Input
          placeholder="Заголовок раздела"
          value={data.heading || ""}
          onChange={e => onChange({ ...data, heading: e.target.value })}
          className="flex-1"
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400">Колонок:</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {COLS_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => onChange({ ...data, cols: n })}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${cols === n ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-xs text-gray-500 flex-1">Размер названия:</label>
        <input type="number" min="10" max="14" value={labelSize} onChange={e => onChange({ ...data, labelSize: parseInt(e.target.value) })} className="h-7 w-16 border rounded px-2 text-xs" />
        <span className="text-xs text-gray-400">px</span>
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-xs text-gray-500 flex-1">Размер значения:</label>
        <input type="number" min="11" max="16" value={fontSize} onChange={e => onChange({ ...data, fontSize: parseInt(e.target.value) })} className="h-7 w-16 border rounded px-2 text-xs" />
        <span className="text-xs text-gray-400">px</span>
      </div>

      <div className="space-y-2">
        {terms.map((term, i) => (
          <div key={i} className="flex gap-2 items-center group">
            <div className="relative flex-shrink-0">
              {term.image_url ? (
                <div className="w-14 h-8 rounded border flex items-center justify-center overflow-hidden">
                  <img src={term.image_url} className="w-full h-full object-cover" alt="" />
                </div>
              ) : (
                <Input
                  value={term.icon}
                  onChange={e => updateTerm(i, "icon", e.target.value)}
                  className="h-8 w-14 text-center text-lg"
                  placeholder="🔹"
                />
              )}
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded">
                <Upload className="w-3 h-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => uploadTermImage(i, e.target.files[0])}
                  className="hidden"
                  disabled={uploading === i}
                />
              </label>
            </div>
            <Input
              value={term.label}
              onChange={e => updateTerm(i, "label", e.target.value)}
              className="h-8 text-xs flex-1"
              placeholder="Название"
            />
            <Input
              value={term.value}
              onChange={e => updateTerm(i, "value", e.target.value)}
              className="h-8 text-xs flex-1"
              placeholder="Значение"
            />
            <Button
              variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeTerm(i)}
            >
              <X className="w-3 h-3 text-red-400" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}