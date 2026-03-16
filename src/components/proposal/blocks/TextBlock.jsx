import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/apiClient";
import { Upload, Plus, X, Link, AlignLeft, AlignCenter, AlignRight, Bold } from "lucide-react";
import { getBlockStyle, getButtonRadius, getBlockPadding } from "../themeUtils";

const LAYOUTS = [
  { value: "1col", label: "1 колонка" },
  { value: "2col", label: "2 колонки" },
  { value: "3col", label: "3 колонки" },
  { value: "text_img_50", label: "Текст + фото 50/50" },
  { value: "text_img_33", label: "Текст 33 + фото 67" },
  { value: "text_img_t67", label: "Текст 67 + фото 33" },
  { value: "text_img_t75", label: "Текст 75 + фото 25" },
  { value: "img_text_50", label: "Фото + текст 50/50" },
  { value: "img_text_33", label: "Фото 67 + текст 33" },
  { value: "img_text_t67", label: "Фото 33 + текст 67" },
  { value: "img_text_t75", label: "Фото 25 + текст 75" },
];


function AlignGroup({ value, onChange }) {
  const options = [
    { a: "left", Icon: AlignLeft },
    { a: "center", Icon: AlignCenter },
    { a: "right", Icon: AlignRight },
  ];
  return (
    <div className="flex border rounded overflow-hidden shrink-0">
      {options.map(({ a, Icon }) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          className={`px-2 py-1 border-r last:border-r-0 transition-colors ${
            (value || "left") === a ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:bg-gray-50"
          }`}
        >
          <Icon className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}

export default function TextBlock({ data, onChange, preview, theme = {} }) {
  const layout = data.layout || "1col";
  const buttons = data.buttons || [];
  const [uploading, setUploading] = useState(false);
  const [showBtnForm, setShowBtnForm] = useState(false);
  const [newBtn, setNewBtn] = useState({ label: "", url: "", style: "primary" });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...data, image_url: file_url });
    setUploading(false);
    e.target.value = "";
  };

  const addButton = () => {
    if (!newBtn.label) return;
    onChange({ ...data, buttons: [...buttons, { ...newBtn, id: Date.now().toString() }] });
    setNewBtn({ label: "", url: "", style: "primary" });
    setShowBtnForm(false);
  };

  const removeButton = (id) => onChange({ ...data, buttons: buttons.filter(b => b.id !== id) });

  const btnRadius = getButtonRadius(theme);
  const blockStyle = getBlockStyle(theme);
  const imgRadius = (theme.blockRadius || 0) + "px";

  const renderButtons = () => {
    if (!buttons.length) return null;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
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
                ? { border: `2px solid ${theme.accentColor || "#2563eb"}`, color: theme.accentColor || "#2563eb", backgroundColor: "#ffffff" }
                : { backgroundColor: "#f3f4f6", color: "#374151" }),
            }}
          >
            <span>{btn.label}</span>
          </a>
        ))}
      </div>
    );
  };

  const textContent = (
    <div>
      {data.heading && (
         <div style={{
           textAlign: data.headingAlign || "left",
           fontFamily: theme.fontFamily,
           fontWeight: 700, fontSize: data.headingSize || 20, color: "#1f2937",
           lineHeight: 1.3, marginBottom: 4,
         }}>
           {data.heading}
         </div>
       )}
      {data.subheading && (
         <div style={{
           textAlign: data.subheadingAlign || "left",
           fontFamily: theme.fontFamily,
           fontWeight: 500, fontSize: data.subheadingSize || 15, color: "#6b7280",
           lineHeight: 1.45, marginBottom: 10,
         }}>
           {data.subheading}
         </div>
       )}
      {data.text && (
        <div style={{
          padding: 0, fontFamily: theme.fontFamily, fontSize: data.textSize || 14, lineHeight: 1.75, color: "#374151",
          textAlign: data.textAlign || "left",
          fontWeight: data.textBold ? 700 : 400,
          whiteSpace: "pre-wrap",
        }}>
          {data.text}
        </div>
      )}
      {renderButtons()}
    </div>
  );

  const imageContent = data.image_url ? (
    <div style={{
      width: "100%", minHeight: 160,
      backgroundImage: `url(${data.image_url})`,
      backgroundSize: "cover", backgroundPosition: "center",
      borderRadius: imgRadius,
    }} />
  ) : null;

  if (preview) {
    const pad = getBlockPadding(theme);
    const padStyle = { paddingLeft: pad.paddingLeft, paddingRight: pad.paddingRight, paddingTop: 24, paddingBottom: 24 };

    if (layout === "2col" || layout === "3col") {
      const cols = layout === "3col" ? 3 : 2;
      const texts = (data.text || "").split(/\n={3,}\n|___/).filter(Boolean);
      return (
        <div style={{ ...blockStyle, ...padStyle }}>
          {data.heading && (
            <div style={{ textAlign: data.headingAlign || "left", fontFamily: theme.fontFamily, fontWeight: 700, fontSize: data.headingSize || 20, color: "#1f2937", marginBottom: 4 }}>
              {data.heading}
            </div>
          )}
          {data.subheading && (
            <div style={{ textAlign: data.subheadingAlign || "left", fontFamily: theme.fontFamily, fontWeight: 500, fontSize: data.subheadingSize || 15, color: "#6b7280", marginBottom: 12 }}>
              {data.subheading}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 24 }}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i}>
                {texts[i] ? (
                  <div style={{
                     padding: 0, fontFamily: theme.fontFamily, fontSize: data.textSize || 14, lineHeight: 1.75, color: "#374151",
                     textAlign: data.textAlign || "left",
                     fontWeight: data.textBold ? 700 : 400,
                     whiteSpace: "pre-wrap",
                   }}>
                     {texts[i]}
                   </div>
                ) : null}
              </div>
            ))}
          </div>
          {renderButtons()}
        </div>
      );
    }

    if (layout === "1col") {
      return <div style={{ ...blockStyle, ...padStyle }}>{textContent}</div>;
    }

    const isImgLeft = layout === "img_text_50" || layout === "img_text_33" || layout === "img_text_t67" || layout === "img_text_t75";

    const getFlexRatio = () => {
      switch (layout) {
        case "text_img_50": case "img_text_50": return [1, 1];
        case "text_img_33": return [1, 2]; // text:img
        case "img_text_33": return [2, 1]; // img:text
        case "text_img_t67": return [2, 1]; // text:img = 67:33
        case "img_text_t67": return [1, 2]; // img:text = 33:67
        case "text_img_t75": return [3, 1]; // text:img = 75:25
        case "img_text_t75": return [1, 3]; // img:text = 25:75
        default: return [1, 1];
      }
    };
    const [textFlex, imgFlex] = getFlexRatio();

    return (
      <div style={{ ...blockStyle, ...padStyle, display: "flex", gap: 24, alignItems: "stretch" }}>
        {isImgLeft && imageContent && (
          <div style={{ flex: imgFlex, alignSelf: "stretch" }}>
            <div style={{
              width: "100%", height: "100%", minHeight: 120,
              backgroundImage: `url(${data.image_url})`,
              backgroundSize: "cover", backgroundPosition: "center",
              borderRadius: imgRadius,
            }} />
          </div>
        )}
        <div style={{ flex: textFlex }}>{textContent}</div>
        {!isImgLeft && imageContent && (
          <div style={{ flex: imgFlex, alignSelf: "stretch" }}>
            <div style={{
              width: "100%", height: "100%", minHeight: 120,
              backgroundImage: `url(${data.image_url})`,
              backgroundSize: "cover", backgroundPosition: "center",
              borderRadius: imgRadius,
            }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Текстовый блок</p>

      <div className="flex flex-wrap gap-1.5">
        {LAYOUTS.map(l => (
          <button
            key={l.value}
            onClick={() => onChange({ ...data, layout: l.value })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              layout === l.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-gray-400 font-semibold uppercase flex-1">Заголовок</p>
          <AlignGroup value={data.headingAlign} onChange={v => onChange({ ...data, headingAlign: v })} />
        </div>
        <Input
          placeholder="Заголовок раздела (опционально)"
          value={data.heading || ""}
          onChange={e => onChange({ ...data, heading: e.target.value })}
          className="h-8 text-sm"
        />
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер шрифта:</label>
          <input
            type="number"
            min="10"
            max="60"
            value={data.headingSize || 20}
            onChange={e => onChange({ ...data, headingSize: parseInt(e.target.value) })}
            className="h-7 w-16 border rounded px-2 text-xs"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-gray-400 font-semibold uppercase flex-1">Подзаголовок</p>
          <AlignGroup value={data.subheadingAlign} onChange={v => onChange({ ...data, subheadingAlign: v })} />
        </div>
        <Input
          placeholder="Подзаголовок (опционально)"
          value={data.subheading || ""}
          onChange={e => onChange({ ...data, subheading: e.target.value })}
          className="h-8 text-sm"
        />
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер шрифта:</label>
          <input
            type="number"
            min="10"
            max="60"
            value={data.subheadingSize || 15}
            onChange={e => onChange({ ...data, subheadingSize: parseInt(e.target.value) })}
            className="h-7 w-16 border rounded px-2 text-xs"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-gray-400 font-semibold uppercase flex-1">Текст</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange({ ...data, textBold: !data.textBold })}
              className={`p-1 rounded border transition-colors ${data.textBold ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"}`}
              title="Жирный"
            >
              <Bold className="w-3 h-3" />
            </button>
            <AlignGroup value={data.textAlign} onChange={v => onChange({ ...data, textAlign: v })} />
          </div>
        </div>
        {(layout === "2col" || layout === "3col") && (
          <p className="text-[10px] text-gray-400">Разделяйте текст между колонками с помощью === на отдельной строке</p>
        )}
        <textarea
          value={data.text || ""}
          onChange={e => onChange({ ...data, text: e.target.value })}
          rows={5}
          placeholder="Текст блока..."
          className="w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер шрифта:</label>
          <input
            type="number"
            min="10"
            max="60"
            value={data.textSize || 14}
            onChange={e => onChange({ ...data, textSize: parseInt(e.target.value) })}
            className="h-7 w-16 border rounded px-2 text-xs"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

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

      {layout !== "1col" && layout !== "2col" && layout !== "3col" && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
          <p className="text-xs text-gray-400 font-medium">Изображение</p>
          {data.image_url && <img src={data.image_url} className="h-24 rounded object-cover" alt="" />}
          <div className="flex gap-2">
            <Input placeholder="URL картинки" value={data.image_url || ""} onChange={e => onChange({ ...data, image_url: e.target.value })} className="h-8 text-xs" />
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="w-3 h-3 mr-1" />{uploading ? "..." : "Загрузить"}</span>
              </Button>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}