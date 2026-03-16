import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBlockPadding } from "../themeUtils";

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded cursor-pointer border border-gray-200 shrink-0"
      />
      <span className="text-xs text-gray-400 font-mono">{value}</span>
    </div>
  );
}

export default function FooterBlock({ data, onChange, preview, theme = {} }) {
  const bgColor = data.bgColor || theme.headerColor || "#2563eb";
  const textColor = data.textColor || theme.headerTextColor || "#ffffff";
  const fontSize = data.fontSize || 14;

  if (preview) {
    const pad = getBlockPadding(theme);
    const radius = theme.blockRadius || 0;
    const pt = data.paddingV ?? 32;
    return (
      <div
        style={{
          backgroundColor: bgColor,
          color: textColor,
          paddingLeft: pad.paddingLeft,
          paddingRight: pad.paddingRight,
          paddingTop: pt,
          paddingBottom: pt,
          fontFamily: theme.fontFamily,
          fontSize: fontSize + "px",
          borderRadius: radius > 0 ? `0 0 ${radius}px ${radius}px` : "0",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div className="flex justify-between items-start gap-4">
          <div style={{ flex: 1 }}>
            {data.company_name && <div style={{ fontWeight: 700, fontSize: (fontSize + 2) + "px" }}>{data.company_name}</div>}
            {data.contact_person && <div style={{ opacity: 0.7, marginTop: 4 }}>{data.contact_person}</div>}
            {data.note && <div style={{ opacity: 0.8, fontSize: (fontSize - 1) + "px", marginTop: 8 }}>{data.note}</div>}
          </div>
          <div style={{ flex: 0, whiteSpace: "nowrap", textAlign: "right" }}>
            {data.phone && (
              <div style={{ color: textColor, fontSize: fontSize + "px", fontWeight: 600, lineHeight: 1.9 }}>{data.phone}</div>
            )}
            {data.email && (
              <div style={{ color: textColor, fontSize: (fontSize - 1) + "px", lineHeight: 1.9 }}>{data.email}</div>
            )}
            {data.website && (
              <div style={{ color: textColor, fontSize: (fontSize - 1) + "px", lineHeight: 1.9 }}>{data.website}</div>
            )}
          </div>
        </div>
        {data.bank_details && (
          <div style={{ marginTop: 20, paddingTop: 14, fontSize: (fontSize - 2) + "px", opacity: 0.65, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontWeight: 600, opacity: 0.9 }}>Реквизиты: </span>{data.bank_details}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Подвал КП</p>

      {/* Design */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase">Оформление</p>
        <ColorRow label="Фон" value={bgColor} onChange={v => onChange({ ...data, bgColor: v })} />
        <ColorRow label="Цвет текста" value={textColor} onChange={v => onChange({ ...data, textColor: v })} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24 shrink-0">Размер шрифта</span>
          <input type="range" min="10" max="22" step="1" value={fontSize}
            onChange={e => onChange({ ...data, fontSize: parseInt(e.target.value) })}
            className="flex-1" />
          <span className="text-xs text-gray-400 w-10 text-right">{fontSize}px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-24 shrink-0">Отступ верт.</span>
          <input type="range" min="12" max="64" step="4" value={data.paddingV ?? 32}
            onChange={e => onChange({ ...data, paddingV: parseInt(e.target.value) })}
            className="flex-1" />
          <span className="text-xs text-gray-400 w-10 text-right">{data.paddingV ?? 32}px</span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-gray-400 mb-1">КОНТАКТНОЕ ЛИЦО</p>
          <Input placeholder="Имя менеджера" value={data.contact_person || ""} onChange={e => onChange({ ...data, contact_person: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1">ТЕЛЕФОН</p>
          <Input placeholder="+7 (495) 000-00-00" value={data.phone || ""} onChange={e => onChange({ ...data, phone: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1">EMAIL</p>
          <Input placeholder="info@company.ru" value={data.email || ""} onChange={e => onChange({ ...data, email: e.target.value })} className="h-8 text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-1">САЙТ</p>
          <Input placeholder="company.ru" value={data.website || ""} onChange={e => onChange({ ...data, website: e.target.value })} className="h-8 text-sm" />
        </div>
      </div>
      <div>
        <p className="text-[10px] text-gray-400 mb-1">ПРИМЕЧАНИЕ</p>
        <Input placeholder="Срок действия КП и т.д." value={data.note || ""} onChange={e => onChange({ ...data, note: e.target.value })} className="h-8 text-sm" />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 mb-1">БАНКОВСКИЕ РЕКВИЗИТЫ</p>
        <Textarea placeholder="ИНН, КПП, р/с, банк..." value={data.bank_details || ""} onChange={e => onChange({ ...data, bank_details: e.target.value })} rows={2} className="text-sm" />
      </div>
    </div>
  );
}