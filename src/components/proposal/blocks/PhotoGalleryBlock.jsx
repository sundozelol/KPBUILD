import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Plus, X, Grid3x3, Columns3, LayoutGrid, GripVertical } from "lucide-react";
import { base44 } from "@/api/apiClient";
import { getBlockPadding } from "../themeUtils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const LAYOUT_TYPES = [
  { value: "grid", label: "Сетка", icon: Grid3x3 },
  { value: "columns", label: "Колонки", icon: Columns3 },
  { value: "bento", label: "Bento", icon: LayoutGrid },
];

export default function PhotoGalleryBlock({ data, onChange, preview, theme = {} }) {
  const images = data.images || [];
  const layout = data.layout || "grid";
  const columns = data.columns || 3;
  const gap = data.gap || 8;
  const radius = theme.blockRadius || 0;

  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const newImages = [...images];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newImages.push({ url: file_url, span: "1x1" });
    }
    onChange({ ...data, images: newImages });
    setUploading(false);
  };

  const handleUpload = async (e) => {
    await uploadFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    await uploadFiles(files);
  };

  const handleImageDragEnd = (result) => {
    if (!result.destination) return;
    const newImages = [...images];
    const [moved] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, moved);
    onChange({ ...data, images: newImages });
  };

  const removeImage = (idx) => {
    onChange({ ...data, images: images.filter((_, i) => i !== idx) });
  };

  const updateSpan = (idx, span) => {
    const updated = [...images];
    updated[idx] = { ...updated[idx], span };
    onChange({ ...data, images: updated });
  };

  const getSpanStyle = (span) => {
    if (layout !== "bento") return {};
    switch (span) {
      case "2x1": return { gridColumn: "span 2" };
      case "1x2": return { gridRow: "span 2" };
      case "2x2": return { gridColumn: "span 2", gridRow: "span 2" };
      default: return {};
    }
  };

  if (preview) {
    const pad = getBlockPadding(theme);
    const padStyle = { paddingLeft: pad.paddingLeft, paddingRight: pad.paddingRight, paddingTop: 24, paddingBottom: 24 };

    const imgHeight = layout === "columns" ? 180 : layout === "bento" ? 180 : 160;

    const gridStyle = {
      display: "grid",
      gap: gap + "px",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      ...(layout === "bento" ? { gridAutoRows: imgHeight + "px" } : {}),
    };

    return (
      <div style={{ fontFamily: theme.fontFamily, ...padStyle }}>
        {data.heading && <h2 className="text-xl font-bold text-gray-800 mb-4">{data.heading}</h2>}
        <div style={gridStyle}>
          {images.map((img, i) => (
            <div
              key={i}
              onClick={() => setLightbox(img.url)}
              style={{
                borderRadius: radius + "px",
                overflow: "hidden",
                cursor: "pointer",
                ...(layout === "bento"
                  ? { ...getSpanStyle(img.span) }
                  : { height: imgHeight + "px" }
                ),
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url(${img.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
            onClick={() => setLightbox(null)}
          >
            <img src={lightbox} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  // --- EDITOR ---
  return (
    <div className="p-4 bg-white rounded-xl border space-y-3 overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Фотогалерея</p>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button variant="outline" size="sm" asChild>
            <span><Plus className="w-3 h-3 mr-1" />{uploading ? "Загрузка..." : "Добавить фото"}</span>
          </Button>
        </label>
      </div>

      {/* Drop zone */}
      <label
        className={`cursor-pointer block border-2 border-dashed rounded-lg py-4 text-center transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <Upload className="w-4 h-4 text-gray-300 mx-auto mb-1" />
        <p className="text-[10px] text-gray-400">{uploading ? "Загрузка..." : "Перетащите фото сюда или нажмите"}</p>
      </label>

      <Input
        placeholder="Заголовок раздела"
        value={data.heading || ""}
        onChange={e => onChange({ ...data, heading: e.target.value })}
        className="h-8"
      />

      {/* Layout selector */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {LAYOUT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ ...data, layout: value })}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-all ${
                layout === value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-gray-400">Колонки</span>
          {[2, 3, 4].map(c => (
            <button
              key={c}
              onClick={() => onChange({ ...data, columns: c })}
              className={`text-xs px-2 py-0.5 rounded border ${columns === c ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"}`}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 uppercase whitespace-nowrap">Отступ</span>
        <input
          type="range" min="0" max="24" step="2"
          value={gap}
          onChange={e => onChange({ ...data, gap: parseInt(e.target.value) })}
          className="flex-1"
        />
        <span className="text-xs text-gray-500 w-8 text-right">{gap}px</span>
      </div>

      {/* Images list — drag to reorder */}
      {images.length > 0 && (
        <DragDropContext onDragEnd={handleImageDragEnd}>
          <Droppable droppableId="gallery-images">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap gap-2 w-full"
              >
                {images.map((img, i) => (
                  <Draggable key={img.url + "-" + i} draggableId={img.url + "-" + i} index={i}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`relative group rounded overflow-hidden border transition-opacity ${snapshot.isDragging ? "opacity-60 shadow-lg" : ""}`}
                        style={{ width: "calc(33.333% - 6px)", ...(dragProvided.draggableProps.style || {}) }}
                      >
                        {/* Drag handle */}
                        <div
                          {...dragProvided.dragHandleProps}
                          className="absolute top-1 left-1 z-10 bg-white/80 rounded p-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <GripVertical className="w-3 h-3 text-gray-500" />
                        </div>
                        <img src={img.url} alt="" className="w-full h-20 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button onClick={() => removeImage(i)} className="bg-white rounded-full p-1">
                            <X className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                        {layout === "bento" && (
                          <select
                            value={img.span || "1x1"}
                            onChange={e => updateSpan(i, e.target.value)}
                            className="absolute bottom-1 left-1 text-[9px] bg-white/90 rounded px-1 py-0.5 border"
                          >
                            <option value="1x1">1×1</option>
                            <option value="2x1">2×1</option>
                            <option value="1x2">1×2</option>
                            <option value="2x2">2×2</option>
                          </select>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}