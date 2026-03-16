import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/apiClient";
import { getBlockPadding } from "../themeUtils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

export default function LogoBlock({ data, onChange, preview, theme = {} }) {
  const [uploading, setUploading] = useState(null);
  const fontSize = data.fontSize || 13;
  const descSize = data.descSize || 11;

  const handleImageUpload = async (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(idx);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      const items = [...(data.items || [])];
      items[idx] = { ...items[idx], logo_url: response.file_url };
      onChange({ ...data, items });
    } finally {
      setUploading(null);
    }
  };

  const addLogo = () => {
    const items = data.items || [];
    items.push({ logo_url: "", title: "", description: "" });
    onChange({ ...data, items: [...items] });
  };

  const updateLogo = (idx, field, val) => {
    const items = [...(data.items || [])];
    items[idx] = { ...items[idx], [field]: val };
    onChange({ ...data, items });
  };

  const deleteLogo = (idx) => {
    const items = (data.items || []).filter((_, i) => i !== idx);
    onChange({ ...data, items });
  };

  const handleLogoDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...(data.items || [])];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onChange({ ...data, items });
  };

  if (preview) {
    const pad = getBlockPadding(theme);
    const headingColor = theme.headerColor || "#1f2937";
    const textColor = theme.foreground || "#1f2937";
    const mutedColor = "#6b7280";

    return (
      <div
        style={{
          paddingLeft: pad.paddingLeft,
          paddingRight: pad.paddingRight,
          paddingTop: 32,
          paddingBottom: 32,
          backgroundColor: "#ffffff",
          textAlign: "center",
        }}
      >
        {data.heading && (
          <h2
            style={{
              fontSize: (fontSize + 4) + "px",
              fontWeight: 700,
              marginBottom: "30px",
              color: headingColor,
            }}
          >
            {data.heading}
          </h2>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
          }}
        >
          {(data.items || []).map((item, idx) => (
            <div key={idx} style={{ textAlign: "center" }}>
              {item.logo_url && (
                <div style={{ marginBottom: "12px" }}>
                  <img
                    src={item.logo_url}
                    alt={item.title}
                    style={{
                      maxHeight: "60px",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
              {item.title && (
                <div
                  style={{
                    fontSize: fontSize + "px",
                    fontWeight: 600,
                    color: textColor,
                    marginBottom: "4px",
                  }}
                >
                  {item.title}
                </div>
              )}
              {item.description && (
                <div
                  style={{
                    fontSize: descSize + "px",
                    color: mutedColor,
                    lineHeight: 1.4,
                  }}
                >
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
      {/* Heading */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Заголовок раздела</label>
        <Input
          placeholder="Наши бренды"
          value={data.heading || ""}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Font Sizes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер названия:</label>
          <input
            type="number"
            min="11"
            max="18"
            value={fontSize}
            onChange={(e) => onChange({ ...data, fontSize: parseInt(e.target.value) })}
            className="h-7 w-14 border rounded px-2 text-xs"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер описания:</label>
          <input
            type="number"
            min="9"
            max="14"
            value={descSize}
            onChange={(e) => onChange({ ...data, descSize: parseInt(e.target.value) })}
            className="h-7 w-14 border rounded px-2 text-xs"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

      {/* Logos */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-gray-600">Логотипы брендов</label>
          <button
            onClick={addLogo}
            className="text-xs bg-gray-900 text-white px-2 py-1 rounded hover:bg-gray-700"
          >
            + Добавить
          </button>
        </div>
        <DragDropContext onDragEnd={handleLogoDragEnd}>
          <Droppable droppableId="logos">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
        {(data.items || []).map((item, idx) => (
          <Draggable key={idx} draggableId={String(idx)} index={idx}>
            {(dragProvided, snapshot) => (
          <div
            ref={dragProvided.innerRef}
            {...dragProvided.draggableProps}
            className={`bg-gray-50 p-3 rounded space-y-2 border border-gray-200 ${snapshot.isDragging ? "shadow-md opacity-80" : ""}`}
          >
            <div className="flex items-center gap-1 mb-1">
              <div {...dragProvided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </div>
            {/* Logo Image */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Логотип</label>
              <div className="flex gap-2">
                {item.logo_url && (
                  <div className="w-12 h-12 rounded border border-gray-300 flex items-center justify-center bg-white flex-shrink-0">
                    <img
                      src={item.logo_url}
                      alt="logo"
                      className="max-h-10 max-w-10 object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="URL логотипа"
                    value={item.logo_url || ""}
                    onChange={(e) => updateLogo(idx, "logo_url", e.target.value)}
                    className="h-8 text-xs mb-1"
                  />
                  <label className="block text-xs bg-gray-900 text-white px-2 py-1 rounded text-center cursor-pointer hover:bg-gray-700">
                    {uploading === idx ? "..." : "Загрузить"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(idx, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Title and Description */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Название бренда"
                value={item.title || ""}
                onChange={(e) => updateLogo(idx, "title", e.target.value)}
                className="h-7 text-xs"
              />
              <Input
                placeholder="Описание"
                value={item.description || ""}
                onChange={(e) => updateLogo(idx, "description", e.target.value)}
                className="h-7 text-xs"
              />
            </div>

            {/* Delete Button */}
            <button
              onClick={() => deleteLogo(idx)}
              className="text-xs text-red-600 hover:text-red-700 w-full text-left"
            >
              Удалить
            </button>
          </div>
            )}
          </Draggable>
        ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}