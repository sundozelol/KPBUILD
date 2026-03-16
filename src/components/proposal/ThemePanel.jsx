import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, ChevronDown, ChevronUp, Upload, Layers, Type, Square, MousePointer2, Sparkles, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CYRILLIC_FONTS, BUTTON_STYLES, TABLE_STYLES } from "./themeUtils";

function Section({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {title}
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">{label}</Label>
      <div className="flex gap-1.5 items-center">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 p-0.5"
        />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-7 text-[10px] font-mono flex-1"
        />
      </div>
    </div>
  );
}

export default function ThemePanel({ theme, onChange, onSave, saving }) {
  const [open, setOpen] = useState(true);
  const [uploading, setUploading] = useState(false);

  const update = (key, val) => onChange({ ...theme, [key]: val });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("logo_url", file_url);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
      <div className="flex items-center px-5 py-3.5">
        <button
          className="flex-1 flex items-center gap-2.5 text-sm font-semibold text-gray-800 text-left"
          onClick={() => setOpen(o => !o)}
        >
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <Palette className="w-3.5 h-3.5 text-white" />
          </div>
          Оформление
          <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ml-auto ${open ? "rotate-180" : ""}`} />
        </button>
        {onSave && (
          <Button size="sm" variant="outline" className="ml-3 h-7 text-xs rounded-xl flex-shrink-0 border-gray-200" onClick={onSave} disabled={saving}>
            <Save className="w-3 h-3 mr-1" />{saving ? "..." : "Сохранить"}
          </Button>
        )}
      </div>

      {open && (
        <div>
          {/* Logo */}
          <Section title="Логотип" icon={Sparkles} defaultOpen={true}>
            {theme.logo_url && (
              <div className="mb-2 p-2 bg-gray-50 rounded-lg inline-block">
                <img src={theme.logo_url} className="h-8 object-contain" alt="logo" />
              </div>
            )}
            <div className="flex gap-2 items-center">
              <Input
                placeholder="URL логотипа"
                value={theme.logo_url || ""}
                onChange={e => update("logo_url", e.target.value)}
                className="h-7 text-xs"
              />
              <label className="cursor-pointer flex-shrink-0">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" className="h-7 text-[11px]" asChild>
                  <span><Upload className="w-3 h-3 mr-1" />{uploading ? "..." : "Файл"}</span>
                </Button>
              </label>
            </div>
          </Section>

          {/* Colors */}
          <Section title="Цвета" icon={Palette} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-3">
              <ColorPicker label="Шапка (фон)" value={theme.headerColor || "#2563eb"} onChange={v => update("headerColor", v)} />
              <ColorPicker label="Шапка (текст)" value={theme.headerTextColor || "#ffffff"} onChange={v => update("headerTextColor", v)} />
              <ColorPicker label="Акцент" value={theme.accentColor || "#1d4ed8"} onChange={v => update("accentColor", v)} />
              <ColorPicker label="Таблица (шапка)" value={theme.tableHeaderColor || "#2563eb"} onChange={v => update("tableHeaderColor", v)} />
              <ColorPicker label="Итого (текст)" value={theme.totalColor || "#1d4ed8"} onChange={v => update("totalColor", v)} />
            </div>
          </Section>

          {/* Font */}
          <Section title="Шрифт" icon={Type}>
            <div className="grid grid-cols-3 gap-1.5">
              {CYRILLIC_FONTS.map(f => (
                <button
                  key={f.value}
                  onClick={() => update("fontFamily", f.value)}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] transition-all ${
                    theme.fontFamily === f.value
                      ? "border-gray-900 bg-gray-900 text-white font-medium shadow-sm"
                      : "border-gray-100 hover:border-gray-200 text-gray-600"
                  }`}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Block Style */}
          <Section title="Стиль блоков" icon={Layers}>
            {/* Flat vs Glass */}
            <div>
              <Label className="text-[10px] text-gray-400 mb-1.5 block uppercase tracking-wider">Режим</Label>
              <div className="flex gap-2">
                {[
                  { value: "flat", label: "Flat", desc: "Чистый" },
                  { value: "glass", label: "Glass", desc: "Стекло" },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => update("blockMode", m.value)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-center transition-all ${
                      (theme.blockMode || "flat") === m.value
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className={`text-xs font-semibold ${(theme.blockMode || "flat") === m.value ? "text-gray-900" : "text-gray-700"}`}>{m.label}</div>
                    <div className="text-[10px] text-gray-400">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Glass custom bg */}
            {(theme.blockMode === "glass") && (
              <div className="space-y-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <ColorPicker label="Фон Glass" value={theme.glassColor || "#ffffff"} onChange={v => update("glassColor", v)} />
                <div>
                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Прозрачность: {Math.round((theme.glassOpacity ?? 0.6) * 100)}%</Label>
                  <input
                    type="range" min="0.1" max="1" step="0.05"
                    value={theme.glassOpacity ?? 0.6}
                    onChange={e => update("glassOpacity", parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-gray-900"
                  />
                </div>
              </div>
            )}

            {/* Border radius */}
            <div>
              <Label className="text-[10px] text-gray-400 mb-1.5 block uppercase tracking-wider">
                Скругление: {theme.blockRadius || 0}px
              </Label>
              <input
                type="range" min="0" max="24" step="2"
                value={theme.blockRadius || 0}
                onChange={e => update("blockRadius", parseInt(e.target.value))}
                className="w-full h-1.5 accent-gray-900"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                <span>0</span>
                <span>Bento</span>
                <span>24</span>
              </div>
            </div>

            {/* Shadow */}
            <div>
              <Label className="text-[10px] text-gray-400 mb-1.5 block uppercase tracking-wider">Тень</Label>
              <div className="flex gap-1.5">
                {[
                  { value: "none", label: "Нет" },
                  { value: "sm", label: "Лёгкая" },
                  { value: "md", label: "Средняя" },
                  { value: "lg", label: "Большая" },
                ].map(s => (
                  <button
                    key={s.value}
                    onClick={() => update("blockShadow", s.value)}
                    className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] transition-all ${
                      (theme.blockShadow || "none") === s.value
                        ? "border-gray-900 bg-gray-900 text-white font-medium"
                        : "border-gray-100 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border */}
            <div>
              <Label className="text-[10px] text-gray-400 mb-1.5 block uppercase tracking-wider">Контур блоков</Label>
              <div className="flex gap-1.5">
                {[
                  { value: "none", label: "Нет" },
                  { value: "thin", label: "Тонкий" },
                  { value: "medium", label: "Средний" },
                  { value: "accent", label: "Акцент" },
                ].map(b => (
                  <button
                    key={b.value}
                    onClick={() => update("blockBorder", b.value)}
                    className={`flex-1 px-2 py-1.5 rounded-lg border text-[11px] transition-all ${
                      (theme.blockBorder || "none") === b.value
                        ? "border-gray-900 bg-gray-900 text-white font-medium"
                        : "border-gray-100 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Logo size */}
          <Section title="Размер логотипа" icon={Square}>
            <div>
              <Label className="text-[10px] text-gray-400 mb-1.5 block uppercase tracking-wider">
                Высота: {theme.logoHeight || 80}px
              </Label>
              <input
                type="range" min="30" max="200" step="5"
                value={theme.logoHeight || 80}
                onChange={e => update("logoHeight", parseInt(e.target.value))}
                className="w-full h-1.5 accent-gray-900"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                <span>30</span>
                <span>200</span>
              </div>
            </div>
          </Section>

          {/* Table style */}
          <Section title="Стиль таблицы">
            <div className="grid grid-cols-5 gap-1.5">
              {TABLE_STYLES.map(ts => (
                <button
                  key={ts.value}
                  onClick={() => update("tableStyle", ts.value)}
                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                    (theme.tableStyle || "classic") === ts.value
                      ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  {ts.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Button style */}
          <Section title="Стиль кнопок" icon={MousePointer2}>
            <div className="grid grid-cols-2 gap-2">
              {BUTTON_STYLES.map(bs => (
                <button
                  key={bs.value}
                  onClick={() => update("buttonStyle", bs.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    (theme.buttonStyle || "rounded") === bs.value
                      ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                      : "border-gray-100 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  {bs.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Watermark */}
          <Section title="Водяной знак">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="КОНФИДЕНЦИАЛЬНО"
                value={theme.watermark || ""}
                onChange={e => update("watermark", e.target.value)}
                className="h-7 text-xs"
              />
              <div className="flex gap-2 items-center">
                <Label className="text-[10px] text-gray-400 whitespace-nowrap">Прозр.</Label>
                <input
                  type="range" min="0.03" max="0.3" step="0.01"
                  value={theme.watermarkOpacity || 0.08}
                  onChange={e => update("watermarkOpacity", parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-gray-900"
                />
              </div>
            </div>
          </Section>

          {/* Margins */}
          <Section title="Поля страницы (мм)">
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "top", label: "Верх" },
                { key: "right", label: "Право" },
                { key: "bottom", label: "Низ" },
                { key: "left", label: "Лево" },
              ].map(side => (
                <div key={side.key}>
                  <Label className="text-[10px] text-gray-400 block text-center mb-0.5">{side.label}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={theme.margins?.[side.key] ?? 10}
                    onChange={e => update("margins", { ...(theme.margins || {}), [side.key]: parseInt(e.target.value) || 0 })}
                    className="h-7 text-xs text-center"
                  />
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}