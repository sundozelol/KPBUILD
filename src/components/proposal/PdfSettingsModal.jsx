import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, X, Loader2, FileText } from "lucide-react";

const PAGE_SIZES = [
  { value: "a4", label: "A4 (210×297 мм)" },
  { value: "letter", label: "Letter (216×279 мм)" },
];

const ORIENTATIONS = [
  { value: "portrait", label: "Книжная" },
  { value: "landscape", label: "Альбомная" },
];

const QUALITY_OPTIONS = [
  { value: 1.5, label: "Быстрая", desc: "Меньший размер файла" },
  { value: 2, label: "Стандарт", desc: "Оптимальное качество" },
  { value: 3, label: "Высокая", desc: "Максимальное качество" },
];

const ACTIVE = "border-gray-900 bg-gray-900 text-white";
const INACTIVE = "border-gray-200 text-gray-500 hover:border-gray-400";

export default function PdfSettingsModal({ onClose, onExport, exporting }) {
  const [settings, setSettings] = useState({
    pageSize: "a4",
    orientation: "portrait",
    quality: 2,
    jpegQuality: 0.92,
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-gray-900">Настройки PDF</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Page size */}
          <div>
            <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block">Размер страницы</Label>
            <div className="flex gap-2">
              {PAGE_SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSettings(p => ({ ...p, pageSize: s.value }))}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${settings.pageSize === s.value ? ACTIVE : INACTIVE}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block">Ориентация</Label>
            <div className="flex gap-2">
              {ORIENTATIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSettings(p => ({ ...p, orientation: o.value }))}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${settings.orientation === o.value ? ACTIVE : INACTIVE}`}
                >
                  <div
                    className={`border-2 rounded-sm ${settings.orientation === o.value ? "border-white" : "border-gray-300"}`}
                    style={{ width: o.value === "portrait" ? 12 : 18, height: o.value === "portrait" ? 18 : 12 }}
                  />
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <Label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 block">Качество</Label>
            <div className="flex gap-2">
              {QUALITY_OPTIONS.map(q => (
                <button
                  key={q.value}
                  onClick={() => setSettings(p => ({ ...p, quality: q.value }))}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-center transition-all ${settings.quality === q.value ? ACTIVE : INACTIVE}`}
                >
                  <div className="text-sm font-medium">{q.label}</div>
                  <div className={`text-xs mt-0.5 ${settings.quality === q.value ? "text-gray-300" : "text-gray-400"}`}>{q.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
          <Button
            onClick={() => onExport(settings)}
            disabled={exporting}
            className="flex-1 bg-gray-900 hover:bg-gray-700 text-white"
          >
            {exporting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Генерация...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Скачать PDF</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
