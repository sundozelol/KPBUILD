import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Plus, X, Link } from "lucide-react";
import { base44 } from "@/api/apiClient";
import { getBlockPadding, getButtonRadius } from "../themeUtils";

export default function BannerBlock({ data, onChange, preview, theme = {} }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showBtnForm, setShowBtnForm] = useState(false);
  const [newBtn, setNewBtn] = useState({ label: "", url: "", style: "primary" });

  const buttons = data.buttons || [];

  const addButton = () => {
    if (!newBtn.label) return;
    onChange({ ...data, buttons: [...buttons, { ...newBtn, id: Date.now().toString() }] });
    setNewBtn({ label: "", url: "", style: "primary" });
    setShowBtnForm(false);
  };

  const removeButton = (id) => onChange({ ...data, buttons: buttons.filter(b => b.id !== id) });

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...data, image_url: file_url });
    setUploading(false);
  };

  const handleUpload = async (e) => {
    await uploadFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    await uploadFile(e.dataTransfer.files[0]);
  };

  if (preview) {
    const radius = theme.blockRadius || 0;
    const btnRadius = getButtonRadius(theme);
    return (
      <div
        className="relative overflow-hidden"
        style={{
          minHeight: data.height || 200,
          borderRadius: radius + "px",
        }}
      >
        {data.image_url && (
          <img
            src={data.image_url}
            alt="Banner"
            className="w-full object-cover"
            style={{ height: data.height || 200 }}
          />
        )}
        {(data.title || data.subtitle || buttons.length > 0) && (() => {
          const pad = getBlockPadding(theme);
          return (
          <div
            className="absolute inset-0 flex flex-col justify-center"
            style={{ background: data.overlay ? `rgba(0,0,0,${data.overlayOpacity || 0.4})` : "transparent", paddingLeft: pad.paddingLeft, paddingRight: pad.paddingRight }}
          >
            {data.title && (
              <h2
                className="text-3xl font-bold"
                style={{ color: data.textColor || "#ffffff", fontFamily: theme.fontFamily }}
              >
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p
                className="mt-2 text-lg opacity-90"
                style={{ color: data.textColor || "#ffffff", fontFamily: theme.fontFamily }}
              >
                {data.subtitle}
              </p>
            )}
            {buttons.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                {buttons.map((btn) => (
                  <a
                    key={btn.id}
                    data-pdf-btn="true"
                    href={btn.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block", minWidth: 80, height: 36,
                      lineHeight: btn.style === "outline" ? "32px" : "36px",
                      paddingLeft: 16, paddingRight: 16, paddingTop: 0, paddingBottom: 0,
                      margin: 0, fontSize: 14, fontWeight: 600,
                      textAlign: "center", verticalAlign: "top", borderRadius: btnRadius,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      boxSizing: "border-box", cursor: "pointer",
                      textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden",
                      ...(btn.style === "primary"
                        ? { backgroundColor: theme.accentColor || "#2563eb", color: "#ffffff" }
                        : btn.style === "outline"
                        ? { border: `2px solid ${data.textColor || "#ffffff"}`, color: data.textColor || "#ffffff", backgroundColor: "transparent" }
                        : { backgroundColor: "rgba(255,255,255,0.15)", color: data.textColor || "#ffffff" }),
                    }}
                  >
                    <span>{btn.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Баннер</p>

      {/* Image upload */}
      <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
        <p className="text-xs text-gray-400 font-medium">Изображение баннера</p>
        <label
          className={`block border-2 border-dashed rounded-lg transition-colors cursor-pointer ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          {data.image_url ? (
            <img src={data.image_url} className="h-28 w-full rounded-lg object-cover" alt="" />
          ) : (
            <div className="py-6 flex flex-col items-center gap-1 text-gray-400">
              <Upload className="w-5 h-5 text-gray-300" />
              <p className="text-[10px]">{uploading ? "Загрузка..." : "Перетащите или нажмите"}</p>
            </div>
          )}
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="URL изображения"
            value={data.image_url || ""}
            onChange={e => onChange({ ...data, image_url: e.target.value })}
            className="h-8 text-xs"
          />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-3 h-3 mr-1" />{uploading ? "..." : "Загрузить"}</span>
            </Button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Заголовок (необязательно)" value={data.title || ""} onChange={e => onChange({ ...data, title: e.target.value })} />
        <Input placeholder="Подзаголовок" value={data.subtitle || ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} />
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 whitespace-nowrap">Высота (px)</label>
          <Input
            type="number"
            value={data.height || 200}
            onChange={e => onChange({ ...data, height: parseInt(e.target.value) || 200 })}
            className="h-8 text-xs"
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 whitespace-nowrap">Цвет текста</label>
          <input
            type="color"
            value={data.textColor || "#ffffff"}
            onChange={e => onChange({ ...data, textColor: e.target.value })}
            className="w-9 h-8 rounded cursor-pointer border border-gray-200"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={data.overlay || false}
            onChange={e => onChange({ ...data, overlay: e.target.checked })}
            className="rounded"
          />
          Тёмный оверлей
        </label>
        {data.overlay && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Прозрачность</label>
            <input
              type="range" min="0.1" max="0.9" step="0.05"
              value={data.overlayOpacity || 0.4}
              onChange={e => onChange({ ...data, overlayOpacity: parseFloat(e.target.value) })}
              className="w-24"
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-medium">Кнопки</p>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowBtnForm(!showBtnForm)}>
            <Plus className="w-3 h-3 mr-1" /> Добавить
          </Button>
        </div>
        {showBtnForm && (
          <div className="flex gap-2 flex-wrap items-center">
            <Input placeholder="Текст кнопки" value={newBtn.label} onChange={e => setNewBtn(b => ({ ...b, label: e.target.value }))} className="h-7 text-xs flex-1 min-w-24" />
            <Input placeholder="URL (https://...)" value={newBtn.url} onChange={e => setNewBtn(b => ({ ...b, url: e.target.value }))} className="h-7 text-xs flex-1 min-w-32" />
            <select value={newBtn.style} onChange={e => setNewBtn(b => ({ ...b, style: e.target.value }))} className="h-7 text-xs border rounded px-2">
              <option value="primary">Основная</option>
              <option value="outline">Контурная</option>
              <option value="ghost">Призрак</option>
            </select>
            <Button size="sm" className="h-7 text-xs bg-gray-900 hover:bg-gray-700 text-white" onClick={addButton}>OK</Button>
          </div>
        )}
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buttons.map(btn => (
              <div key={btn.id} className="flex items-center gap-1 bg-white border rounded-full px-3 py-1 text-xs">
                <Link className="w-3 h-3 text-gray-400" />
                <span>{btn.label}</span>
                <button onClick={() => removeButton(btn.id)}><X className="w-3 h-3 text-red-400 ml-1" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}