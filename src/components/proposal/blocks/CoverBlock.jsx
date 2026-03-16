import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { X, FileImage, ChevronDown } from "lucide-react";
import { base44 } from "@/api/apiClient";

export default function CoverBlock({ data, onChange, preview, theme = {} }) {
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(null); // "cover" | "logo" | null

  // --- field defaults ---
  const titleSize      = data.titleSize      || 48;
  const subtitleSize   = data.subtitleSize   || 20;
  const overlayType    = data.overlayType    || "gradient"; // "full" | "gradient"
  const overlayOpacity = data.overlayOpacity ?? 0.55;
  const textColor      = data.textColor      || "#ffffff";
  const showAccentBar  = data.showAccentBar  !== false;
  const accentBarColor = data.accentBarColor || theme.accentColor || "#e53e3e";
  const showBottomBar  = data.showBottomBar  === true;
  const websiteBg      = data.websiteBg      || "#ffffff";
  const websiteText    = data.websiteTextColor || "#111827";
  const phoneBg        = data.phoneBg        || "#111827";
  const phoneText      = data.phoneTextColor || "#ffffff";
  const addressBg      = data.addressBg      || "#1a202c";
  const addressText    = data.addressTextColor || "#ffffff";

  const set = (key, val) => onChange({ ...data, [key]: val });

  const uploadFile = async (file, field = "image_url") => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(field, file_url);
    setUploading(false);
  };

  const handleUpload = async (e, field = "image_url") => {
    await uploadFile(e.target.files[0], field);
    e.target.value = "";
  };

  const handleDrop = async (e, field = "image_url", zone) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) await uploadFile(file, field);
  };

  // ── PREVIEW ──────────────────────────────────────────────────────────────────
  if (preview) {
    if (!data.image_url) return null;

    const logoPos = data.logoPosition || "left";
    const logoLeft  = logoPos === "right" ? "auto" : "40px";
    const logoRight = logoPos === "right" ? "40px" : "auto";
    const logoXform = logoPos === "center" ? "translateX(-50%)" : "none";
    const logoLeftCenter = logoPos === "center" ? "50%" : logoLeft;

    const overlayStyle = overlayType === "full"
      ? { background: `rgba(0,0,0,${overlayOpacity})` }
      : { background: `linear-gradient(to top, rgba(0,0,0,${Math.min(overlayOpacity + 0.2, 0.95)}) 0%, rgba(0,0,0,${overlayOpacity * 0.4}) 50%, rgba(0,0,0,${overlayOpacity * 0.15}) 100%)` };

    const bottomBarHeight = showBottomBar ? 64 : 0;

    return (
      <div style={{ position: "relative", width: "100%", minHeight: "100%", overflow: "hidden" }}>
        {/* Background image */}
        <img
          src={data.image_url}
          alt="Cover"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Overlay */}
        {data.overlay !== false && (
          <div style={{ position: "absolute", inset: 0, ...overlayStyle }} />
        )}

        {/* Logo */}
        {data.logo_url && (
          <div style={{
            position: "absolute", top: "40px",
            left: logoLeftCenter, right: logoRight,
            transform: logoXform,
            zIndex: 3,
          }}>
            <img
              src={data.logo_url}
              alt="Logo"
              style={{ height: `${data.logoSize || 48}px`, objectFit: "contain", display: "block" }}
            />
          </div>
        )}

        {/* Text block */}
        {(data.title || data.subtitle || data.date) && (
          <div style={{
            position: "absolute",
            bottom: `${bottomBarHeight + 36}px`,
            left: "40px", right: "40px",
            zIndex: 3,
            display: "flex", alignItems: "stretch", gap: 0,
          }}>
            {/* Accent bar */}
            {showAccentBar && (
              <div style={{
                width: "3px",
                background: accentBarColor,
                borderRadius: "2px",
                marginRight: "18px",
                flexShrink: 0,
                alignSelf: "stretch",
                minHeight: "100%",
              }} />
            )}
            <div style={{ fontFamily: theme.fontFamily }}>
              {data.title && (
                <h1 style={{
                  color: textColor,
                  fontSize: titleSize + "px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginBottom: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                }}>
                  {data.title}
                </h1>
              )}
              {data.subtitle && (
                <p style={{ color: textColor, fontSize: subtitleSize + "px", opacity: 0.9, marginBottom: "6px" }}>
                  {data.subtitle}
                </p>
              )}
              {data.date && (
                <p style={{ color: textColor, fontSize: "14px", opacity: 0.75, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {data.date}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        {showBottomBar && (data.website || data.phone || data.address) && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "0 40px 16px",
            zIndex: 3,
            display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
          }}>
            {data.website && (
              <span style={{
                background: websiteBg, color: websiteText,
                padding: "6px 18px", borderRadius: "999px",
                fontSize: "13px", fontWeight: 500,
                fontFamily: theme.fontFamily,
                whiteSpace: "nowrap",
              }}>
                {data.website}
              </span>
            )}
            {data.phone && (
              <span style={{
                background: phoneBg, color: phoneText,
                padding: "6px 18px", borderRadius: "999px",
                fontSize: "13px", fontWeight: 600,
                fontFamily: theme.fontFamily,
                whiteSpace: "nowrap",
              }}>
                {data.phone}
              </span>
            )}
            {data.address && (
              <span style={{
                background: addressBg, color: addressText,
                padding: "6px 18px", borderRadius: "999px",
                fontSize: "13px",
                fontFamily: theme.fontFamily,
              }}>
                {data.address}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── EDITOR ───────────────────────────────────────────────────────────────────
  const ColorRow = ({ label, bgKey, textKey, defaultBg, defaultText }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-400 w-16 shrink-0">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-300">фон</span>
        <input type="color" value={data[bgKey] || defaultBg}
          onChange={e => set(bgKey, e.target.value)}
          className="w-6 h-6 rounded border cursor-pointer p-0.5" />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-300">текст</span>
        <input type="color" value={data[textKey] || defaultText}
          onChange={e => set(textKey, e.target.value)}
          className="w-6 h-6 rounded border cursor-pointer p-0.5" />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Титульный лист</p>
        <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 rounded">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "" : "-rotate-90"}`} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">

          {/* Image upload */}
          <label
            className="cursor-pointer block"
            onDrop={(e) => handleDrop(e, "image_url", "cover")}
            onDragOver={(e) => { e.preventDefault(); setDragOver("cover"); }}
            onDragLeave={() => setDragOver(null)}
          >
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <div className={`border-2 border-dashed rounded-xl transition-colors ${dragOver === "cover" ? "border-blue-400 bg-blue-50" : data.image_url ? "border-gray-200" : "border-gray-300 hover:border-gray-400"}`}>
              {data.image_url ? (
                <div className="relative">
                  <img src={data.image_url} className="w-full h-40 object-cover rounded-xl" alt="" />
                  <button className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border hover:bg-red-50"
                    onClick={e => { e.preventDefault(); set("image_url", ""); }}>
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
                  <FileImage className="w-8 h-8 text-gray-300" />
                  <div className="text-xs font-medium text-gray-500">{uploading ? "Загрузка..." : "Загрузить обложку"}</div>
                  <div className="text-[10px] text-gray-300">1240 × 1754 px (A4)</div>
                </div>
              )}
            </div>
          </label>

          {/* Title / Subtitle */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Заголовок</p>
              <Input placeholder="НОВИНКИ В ОДНОМ ПРЕДЛОЖЕНИИ" value={data.title || ""} onChange={e => set("title", e.target.value)} className="h-8 text-sm rounded-xl" />
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-400">px:</span>
                <input type="number" min="20" max="80" value={titleSize} onChange={e => set("titleSize", parseInt(e.target.value))} className="h-6 w-14 border rounded-lg px-1 text-xs" />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Подзаголовок</p>
              <Input placeholder="Для компании..." value={data.subtitle || ""} onChange={e => set("subtitle", e.target.value)} className="h-8 text-sm rounded-xl" />
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-400">px:</span>
                <input type="number" min="12" max="40" value={subtitleSize} onChange={e => set("subtitleSize", parseInt(e.target.value))} className="h-6 w-14 border rounded-lg px-1 text-xs" />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Дата</p>
            <Input placeholder="МАРТ 2026" value={data.date || ""} onChange={e => set("date", e.target.value)} className="h-8 text-sm rounded-xl" />
          </div>

          {/* Overlay */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Оверлей</p>
            <div className="flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                <input type="checkbox" checked={data.overlay !== false} onChange={e => set("overlay", e.target.checked)} className="rounded" />
                Включён
              </label>
              {data.overlay !== false && (
                <>
                  <div className="flex gap-1">
                    {["full", "gradient"].map(t => (
                      <button key={t} onClick={() => set("overlayType", t)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${overlayType === t ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"}`}>
                        {t === "full" ? "Полный" : "Градиент"}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Тёмность:</span>
                    <input type="range" min="0.1" max="0.95" step="0.05"
                      value={overlayOpacity}
                      onChange={e => set("overlayOpacity", parseFloat(e.target.value))}
                      className="w-20 h-1 accent-gray-900" />
                    <span className="text-[10px] text-gray-500 w-6">{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Цвет текста:</span>
                    <input type="color" value={textColor} onChange={e => set("textColor", e.target.value)} className="w-6 h-6 rounded border cursor-pointer p-0.5" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Accent bar */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Акцент-полоска</p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                <input type="checkbox" checked={showAccentBar} onChange={e => set("showAccentBar", e.target.checked)} className="rounded" />
                Показать
              </label>
              {showAccentBar && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">Цвет:</span>
                  <input type="color" value={accentBarColor} onChange={e => set("accentBarColor", e.target.value)} className="w-6 h-6 rounded border cursor-pointer p-0.5" />
                  <div className="w-0.5 h-6 rounded" style={{ background: accentBarColor }} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Нижняя панель</p>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                <input type="checkbox" checked={showBottomBar} onChange={e => set("showBottomBar", e.target.checked)} className="rounded" />
                Включить
              </label>
            </div>
            {showBottomBar && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Сайт</p>
                    <Input placeholder="samgrupp.ru" value={data.website || ""} onChange={e => set("website", e.target.value)} className="h-7 text-xs rounded-lg" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Телефон</p>
                    <Input placeholder="+7 495 191-17-39" value={data.phone || ""} onChange={e => set("phone", e.target.value)} className="h-7 text-xs rounded-lg" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Адрес</p>
                    <Input placeholder="Москва, ул. Примерная, 1" value={data.address || ""} onChange={e => set("address", e.target.value)} className="h-7 text-xs rounded-lg" />
                  </div>
                </div>
                <p className="text-[10px] font-medium text-gray-400 mt-2">Цвета бейджей:</p>
                <div className="space-y-1.5">
                  <ColorRow label="Сайт" bgKey="websiteBg" textKey="websiteTextColor" defaultBg="#ffffff" defaultText="#111827" />
                  <ColorRow label="Телефон" bgKey="phoneBg" textKey="phoneTextColor" defaultBg="#111827" defaultText="#ffffff" />
                  <ColorRow label="Адрес" bgKey="addressBg" textKey="addressTextColor" defaultBg="#1a202c" defaultText="#ffffff" />
                </div>
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Логотип</p>
            <label
              className="cursor-pointer block"
              onDrop={(e) => handleDrop(e, "logo_url", "logo")}
              onDragOver={(e) => { e.preventDefault(); setDragOver("logo"); }}
              onDragLeave={() => setDragOver(null)}
            >
              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, "logo_url")} />
              <div className={`border-2 border-dashed rounded-xl py-3 px-3 text-center transition-colors ${dragOver === "logo" ? "border-blue-400 bg-blue-50" : data.logo_url ? "border-gray-200" : "border-gray-200 hover:border-gray-400"}`}>
                {data.logo_url ? (
                  <div className="relative inline-block">
                    <img src={data.logo_url} className="object-contain" style={{ height: "40px" }} alt="Logo" />
                    <button className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow border hover:bg-red-50"
                      onClick={e => { e.preventDefault(); set("logo_url", ""); }}>
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">{uploading ? "Загрузка..." : "Загрузить логотип"}</div>
                )}
              </div>
            </label>
            {data.logo_url && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Размер:</span>
                  <input type="range" min="24" max="120" step="4" value={data.logoSize || 48}
                    onChange={e => set("logoSize", parseInt(e.target.value))} className="w-24 h-1 accent-gray-900" />
                  <span className="text-[10px] text-gray-500">{data.logoSize || 48}px</span>
                </div>
                <div className="flex gap-1">
                  {["left", "center", "right"].map(pos => (
                    <button key={pos} onClick={() => set("logoPosition", pos)}
                      className={`text-[10px] px-3 py-1 rounded-lg border transition-all ${(data.logoPosition || "left") === pos ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"}`}>
                      {pos === "left" ? "Слева" : pos === "center" ? "Центр" : "Справа"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
