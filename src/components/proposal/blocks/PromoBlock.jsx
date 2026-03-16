import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/apiClient";

export default function PromoBlock({ data, onChange, preview, theme = {} }) {
  const [uploading, setUploading] = useState(false);
  const headingSize = data.headingSize || 36;
  const textSize = data.textSize || 16;
  const overlayOpacity = data.overlayOpacity || 0.5;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      onChange({ ...data, image_url: response.file_url });
    } finally {
      setUploading(false);
    }
  };

  const addStat = () => {
    const items = data.items || [];
    items.push({ label: "", value: "" });
    onChange({ ...data, items: [...items] });
  };

  const updateStat = (idx, field, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...data, items });
  };

  const deleteStat = (idx) => {
    const items = (data.items || []).filter((_, i) => i !== idx);
    onChange({ ...data, items });
  };

  if (preview) {
    const textColor = data.textColor || "#ffffff";
    const titleColor = data.titleColor || textColor;
    const valueColor = data.valueColor || textColor;
    const radius = theme.blockRadius || 0;
    const items = data.items || [];
    const cols = 2;

    return (
      <div
        style={{
          borderRadius: radius + "px",
          overflow: "hidden",
          backgroundImage: data.image_url ? `url("${data.image_url}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: data.overlayColor || "#cc0000",
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          minHeight: "180px",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: data.overlayColor || "#cc0000",
            opacity: overlayOpacity,
            zIndex: 1,
          }}
        />

        {/* Left: title / logo area */}
        {data.title && (
          <div
            style={{
              position: "relative",
              zIndex: 2,
              flex: "0 0 35%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 28px",
              borderRight: `1px solid rgba(255,255,255,0.25)`,
            }}
          >
            <div
              style={{
                fontSize: headingSize + "px",
                fontWeight: 900,
                color: titleColor,
                textAlign: "center",
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
              }}
            >
              {data.title}
            </div>
          </div>
        )}

        {/* Right: stats grid */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            alignItems: "stretch",
          }}
        >
          {items.map((item, idx) => {
            const isRightCol = (idx % cols) === cols - 1;
            const isLastRow = idx >= items.length - cols;
            return (
              <div
                key={idx}
                style={{
                  padding: "22px 24px",
                  borderRight: !isRightCol ? "1px solid rgba(255,255,255,0.25)" : undefined,
                  borderBottom: !isLastRow ? "1px solid rgba(255,255,255,0.25)" : undefined,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: headingSize + "px",
                    fontWeight: 900,
                    color: valueColor,
                    lineHeight: 1,
                    letterSpacing: "-1px",
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: textSize + "px",
                    color: textColor,
                    marginTop: "6px",
                    lineHeight: 1.3,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    opacity: 0.85,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
      {/* Title */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Заголовок</label>
        <Input
          placeholder="Введите заголовок"
          value={data.title || ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Background Image */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Фоновое изображение</label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="URL изображения"
            value={data.image_url || ""}
            onChange={(e) => onChange({ ...data, image_url: e.target.value })}
            className="h-8 text-sm flex-1"
          />
          <label className="h-8 px-3 bg-gray-900 text-white text-xs rounded flex items-center cursor-pointer hover:bg-gray-700">
            {uploading ? "..." : "Загрузить"}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Overlay Settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Цвет оверлея</label>
          <input
            type="color"
            value={data.overlayColor || "#000000"}
            onChange={(e) => onChange({ ...data, overlayColor: e.target.value })}
            className="h-8 w-full cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Прозрачность</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => onChange({ ...data, overlayOpacity: parseFloat(e.target.value) })}
            className="w-full h-8"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Цвет текста</label>
          <input
            type="color"
            value={data.textColor || "#ffffff"}
            onChange={(e) => onChange({ ...data, textColor: e.target.value })}
            className="h-8 w-full cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Цвет заголовка</label>
          <input
            type="color"
            value={data.titleColor || data.textColor || "#ffffff"}
            onChange={(e) => onChange({ ...data, titleColor: e.target.value })}
            className="h-8 w-full cursor-pointer"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Цвет значений</label>
          <input
            type="color"
            value={data.valueColor || data.textColor || "#ffffff"}
            onChange={(e) => onChange({ ...data, valueColor: e.target.value })}
            className="h-8 w-full cursor-pointer"
          />
        </div>
      </div>

      {/* Font Sizes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер заголовка:</label>
          <input
            type="number"
            min="20"
            max="48"
            value={headingSize}
            onChange={(e) => onChange({ ...data, headingSize: parseInt(e.target.value) })}
            className="h-7 w-14 border rounded px-2 text-xs"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер текста:</label>
          <input
            type="number"
            min="12"
            max="24"
            value={textSize}
            onChange={(e) => onChange({ ...data, textSize: parseInt(e.target.value) })}
            className="h-7 w-14 border rounded px-2 text-xs"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

      {/* Statistics Items */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-600">Статистика</label>
          <button
            onClick={addStat}
            className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-700"
          >
            + Добавить
          </button>
        </div>
        {(data.items || []).map((item, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded">
            <Input
              placeholder="Значение (210)"
              value={item.value || ""}
              onChange={(e) => updateStat(idx, "value", e.target.value)}
              className="h-7 text-xs"
            />
            <Input
              placeholder="Описание"
              value={item.label || ""}
              onChange={(e) => updateStat(idx, "label", e.target.value)}
              className="h-7 text-xs col-span-2"
            />
            <button
              onClick={() => deleteStat(idx)}
              className="col-span-3 text-xs text-red-600 hover:text-red-700 text-left"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}