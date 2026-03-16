import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Image } from "lucide-react";
import { base44 } from "@/api/apiClient";

export default function HeaderBlock({ data, onChange, preview, theme = {} }) {
   const headerColor = theme.headerColor || "#2563eb";
   const textColor = theme.headerTextColor || "#ffffff";
   const logo = theme.logo_url || data.logo_url;
   const bgImage = data.bg_image_url || "";
   const logoHeight = theme.logoHeight || 80;
   const fontSize = data.fontSize || 14;
   const titleSize = data.titleSize || 24;
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...data, logo_url: file_url });
    setUploading(false);
    e.target.value = "";
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBg(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ ...data, bg_image_url: file_url });
    setUploadingBg(false);
    e.target.value = "";
  };

  // Shared padding matching page margins
  const margins = theme.margins || { top: 10, right: 10, bottom: 10, left: 10 };
  const pxVal = (margins.left || 10) * 3.78;
  const prVal = (margins.right || 10) * 3.78;
  const px = pxVal + "px";
  const pr = prVal + "px";

  if (preview) {
    const bgImageStyle = bgImage ? {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } : {};

    const baseStyle = { fontFamily: theme.fontFamily, paddingLeft: px, paddingRight: pr };

    return (
      <div style={{ ...baseStyle, background: headerColor, ...bgImageStyle, paddingTop: 20, paddingBottom: 20 }}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {logo && <img src={logo} alt="" className="object-contain flex-shrink-0" style={{ maxHeight: logoHeight }} />}
            <div>
              {data.company_name && <div className="font-bold leading-tight" style={{ color: textColor, fontSize: fontSize + "px" }}>{data.company_name}</div>}
                {data.slogan && <div className="text-xs mt-0.5 opacity-75" style={{ color: textColor, fontSize: (fontSize - 2) + "px" }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            {data.phone && (
              <div style={{ color: textColor, fontSize: 13, lineHeight: "2", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: textColor, opacity: 0.7, flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {data.phone}
              </div>
            )}
            {data.email && (
              <div style={{ color: textColor, fontSize: 13, lineHeight: "2", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: textColor, opacity: 0.7, flexShrink: 0 }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {data.email}
              </div>
            )}
            {data.website && (
              <div style={{ color: textColor, fontSize: 13, lineHeight: "2", whiteSpace: "nowrap", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: textColor, opacity: 0.7, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                {data.website}
              </div>
            )}
          </div>
        </div>
        {(data.title || data.subtitle) && (
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            {data.title && <h1 className="font-bold" style={{ color: textColor, fontSize: titleSize + "px" }}>{data.title}</h1>}
            {data.subtitle && <p className="opacity-80 mt-1" style={{ color: textColor, fontSize: (titleSize - 6) + "px" }}>{data.subtitle}</p>}
          </div>
        )}
      </div>
    );
  }

  // Editor mode
  return (
    <div className="p-4 bg-white rounded-xl border space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Шапка КП</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">КОМПАНИЯ</p>
          <Input placeholder="ТехноПром" value={data.company_name || ""} onChange={e => onChange({ ...data, company_name: e.target.value })} className="h-8" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">СЛОГАН</p>
          <Input placeholder="Промышленное оборудование" value={data.slogan || ""} onChange={e => onChange({ ...data, slogan: e.target.value })} className="h-8" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">ТЕЛЕФОН</p>
          <Input placeholder="+7 (495) 123-45-67" value={data.phone || ""} onChange={e => onChange({ ...data, phone: e.target.value })} className="h-8" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">EMAIL</p>
          <Input placeholder="info@company.ru" value={data.email || ""} onChange={e => onChange({ ...data, email: e.target.value })} className="h-8" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">САЙТ</p>
          <Input placeholder="company.ru" value={data.website || ""} onChange={e => onChange({ ...data, website: e.target.value })} className="h-8" />
        </div>
      </div>
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs text-gray-400">НАЗВАНИЕ КП</p>
        <Input placeholder="Коммерческое предложение" value={data.title || ""} onChange={e => onChange({ ...data, title: e.target.value })} className="h-8" />
        <Input placeholder="Подзаголовок" value={data.subtitle || ""} onChange={e => onChange({ ...data, subtitle: e.target.value })} className="h-8" />
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер названия:</label>
          <input type="number" min="14" max="48" value={titleSize} onChange={e => onChange({ ...data, titleSize: parseInt(e.target.value) })} className="h-7 w-16 border rounded px-2 text-xs" />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500 flex-1">Размер текста:</label>
          <input type="number" min="10" max="24" value={fontSize} onChange={e => onChange({ ...data, fontSize: parseInt(e.target.value) })} className="h-7 w-16 border rounded px-2 text-xs" />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-gray-400">ЛОГОТИП</p>
        {logo && <img src={logo} className="h-12 object-contain rounded" alt="" />}
        <div className="flex gap-2">
          <Input placeholder="URL логотипа" value={data.logo_url || ""} onChange={e => onChange({ ...data, logo_url: e.target.value })} className="h-8 text-xs" />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-3 h-3 mr-1" />{uploading ? "..." : "Загрузить"}</span>
            </Button>
          </label>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-gray-400">ФОНОВОЕ ИЗОБРАЖЕНИЕ</p>
        {data.bg_image_url && <img src={data.bg_image_url} className="h-10 w-full object-cover rounded" alt="" />}
        <div className="flex gap-2">
          <Input placeholder="URL фона" value={data.bg_image_url || ""} onChange={e => onChange({ ...data, bg_image_url: e.target.value })} className="h-8 text-xs" />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
            <Button variant="outline" size="sm" asChild>
              <span><Image className="w-3 h-3 mr-1" />{uploadingBg ? "..." : "Фон"}</span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}