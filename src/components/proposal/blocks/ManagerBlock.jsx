import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { base44 } from "@/api/apiClient";
import { getBlockStyle, getBlockPadding, getButtonRadius } from "../themeUtils";

// Inline SVG icons for messengers
const IconTelegram = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline", verticalAlign: "middle", marginRight: 4, flexShrink: 0 }}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const IconWhatsApp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline", verticalAlign: "middle", marginRight: 4, flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const IconMax = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: "inline", verticalAlign: "middle", marginRight: 4, flexShrink: 0 }}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.5 6h1.3l2.7 4.5L18.2 6h1.3v8h-1.3v-5.8l-2.7 4.3-2.7-4.3V14h-1.3V6zm-4 0h1.3v8H7.5V6z"/>
  </svg>
);

// Small messenger icon buttons for editor preview
const messengerIcons = {
  telegram: { icon: "✈", color: "#29b6f6", label: "TG" },
  whatsapp: { icon: "💬", color: "#25d366", label: "WA" },
  max: { icon: "M", color: "#0077ff", label: "Max" },
};

export default function ManagerBlock({ data, onChange, preview, theme = {} }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...data, photo_url: file_url });
    setUploading(false);
  };

  const handlePhotoUpload = async (e) => {
    await uploadPhoto(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    await uploadPhoto(e.dataTransfer.files[0]);
  };

  if (preview) {
    const blockStyle = getBlockStyle(theme);
    const accentColor = theme.accentColor || "#2563eb";
    const btnRadius = getButtonRadius(theme);
    const pad = getBlockPadding(theme);
    const bgColor = data.bgColor || "#f8f9fa";
    const textColor = data.textColor || "#111827";

    const btnBase = {
      display: "inline-flex", alignItems: "center", height: 30, paddingLeft: 10, paddingRight: 10,
      fontSize: 12, fontWeight: 600, borderRadius: btnRadius, textDecoration: "none",
      whiteSpace: "nowrap", fontFamily: "Arial, Helvetica, sans-serif", verticalAlign: "top",
    };

    return (
      <div style={{
        fontFamily: theme.fontFamily,
        backgroundColor: bgColor,
        paddingLeft: pad.paddingLeft,
        paddingRight: pad.paddingRight,
        paddingTop: 24,
        paddingBottom: 24,
        ...blockStyle,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, maxWidth: "100%" }}>
          {/* Left: photo */}
          {data.photo_url && (
            <div style={{
              width: 120, height: 120, flexShrink: 0, alignSelf: "stretch",
              borderRadius: (theme.blockRadius || 12) + "px",
              backgroundImage: `url(${data.photo_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              minHeight: 120,
            }} />
          )}

          {/* Right: content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {data.block_title && (
              <div style={{ fontSize: 11, color: accentColor, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>
                {data.block_title}
              </div>
            )}
            {data.name && (
              <div style={{ fontSize: 22, fontWeight: 700, color: textColor, lineHeight: 1.2, marginBottom: data.description ? 10 : 16 }}>
                {data.name}
              </div>
            )}
            {data.description && (
              <div style={{ fontSize: 14, color: textColor, opacity: 0.7, lineHeight: 1.6, marginBottom: 16, maxWidth: 560 }}>
                {data.description}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.phone && (
                <a data-pdf-btn="true" href={`tel:${data.phone}`}
                  style={{ ...btnBase, backgroundColor: accentColor, color: "#ffffff" }}>
                  {data.phone}
                </a>
              )}
              {data.email && (
                <a data-pdf-btn="true" href={`mailto:${data.email}`}
                  style={{ ...btnBase, lineHeight: "32px", border: `1.5px solid ${accentColor}`, color: accentColor, backgroundColor: "transparent" }}>
                  {data.email}
                </a>
              )}
              {data.telegram && (
                <a data-pdf-btn="true" href={`https://t.me/${data.telegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ ...btnBase, backgroundColor: "#29b6f6", color: "#ffffff" }}>
                  <IconTelegram />Telegram
                </a>
              )}
              {data.whatsapp && (
                <a data-pdf-btn="true" href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ ...btnBase, backgroundColor: "#25d366", color: "#ffffff" }}>
                  <IconWhatsApp />WhatsApp
                </a>
              )}
              {data.max && (
                <a data-pdf-btn="true" href={`https://max.ru/im?sel=${data.max.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ ...btnBase, backgroundColor: "#0077ff", color: "#ffffff" }}>
                  <IconMax />Max
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Менеджер</p>

      {/* Background & text colors */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase">Оформление</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-400 mb-1">ФОН</p>
            <div className="flex gap-1.5 items-center">
              <input type="color" value={data.bgColor || "#f8f9fa"} onChange={e => onChange({ ...data, bgColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5" />
              <Input value={data.bgColor || "#f8f9fa"} onChange={e => onChange({ ...data, bgColor: e.target.value })} className="h-7 text-[10px] font-mono flex-1" />
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 mb-1">ТЕКСТ</p>
            <div className="flex gap-1.5 items-center">
              <input type="color" value={data.textColor || "#111827"} onChange={e => onChange({ ...data, textColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5" />
              <Input value={data.textColor || "#111827"} onChange={e => onChange({ ...data, textColor: e.target.value })} className="h-7 text-[10px] font-mono flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-gray-400 mb-1">НАЗВАНИЕ БЛОКА</p>
          <Input placeholder="Ваш менеджер:" value={data.block_title || ""} onChange={e => onChange({ ...data, block_title: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1">ФИО</p>
          <Input placeholder="Иванов Иван Иванович" value={data.name || ""} onChange={e => onChange({ ...data, name: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1">ТЕЛЕФОН</p>
          <Input placeholder="+7 964 638 32 13" value={data.phone || ""} onChange={e => onChange({ ...data, phone: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1">EMAIL</p>
          <Input placeholder="manager@company.ru" value={data.email || ""} onChange={e => onChange({ ...data, email: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
            <span style={{ display:"inline-flex", width:14, height:14, borderRadius:"50%", backgroundColor:"#29b6f6", alignItems:"center", justifyContent:"center" }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </span>
            TELEGRAM
          </p>
          <Input placeholder="@username" value={data.telegram || ""} onChange={e => onChange({ ...data, telegram: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
            <span style={{ display:"inline-flex", width:14, height:14, borderRadius:"50%", backgroundColor:"#25d366", alignItems:"center", justifyContent:"center" }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            </span>
            WHATSAPP
          </p>
          <Input placeholder="+79641234567" value={data.whatsapp || ""} onChange={e => onChange({ ...data, whatsapp: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
            <span style={{ display:"inline-flex", width:14, height:14, borderRadius:"50%", backgroundColor:"#0077ff", alignItems:"center", justifyContent:"center", fontSize:8, color:"white", fontWeight:700 }}>M</span>
            MAX
          </p>
          <Input placeholder="+79641234567" value={data.max || ""} onChange={e => onChange({ ...data, max: e.target.value })} className="h-8 text-sm" />
        </div>
      </div>

      <div>
        <p className="text-[10px] text-gray-400 mb-1">ОПИСАНИЕ</p>
        <textarea
          placeholder="Краткое описание, специализация, опыт..."
          value={data.description || ""}
          onChange={e => onChange({ ...data, description: e.target.value })}
          className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      <div>
        <p className="text-[10px] text-gray-400 mb-1">ФОТО</p>
        <label
          className={`block border-2 border-dashed rounded-lg mb-2 cursor-pointer transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
        >
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          {data.photo_url ? (
            <img src={data.photo_url} className="w-full h-24 object-cover rounded-lg" alt="" />
          ) : (
            <div className="py-4 flex flex-col items-center gap-1 text-gray-400">
              <Upload className="w-4 h-4 text-gray-300" />
              <p className="text-[10px]">{uploading ? "Загрузка..." : "Перетащите или нажмите"}</p>
            </div>
          )}
        </label>
        <div className="flex gap-2">
          <Input placeholder="URL фото" value={data.photo_url || ""} onChange={e => onChange({ ...data, photo_url: e.target.value })} className="h-8 text-xs" />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-3 h-3 mr-1" />{uploading ? "..." : "Загрузить"}</span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}
