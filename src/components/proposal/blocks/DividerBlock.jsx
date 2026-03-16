import React from "react";
import { getBlockPadding } from "../themeUtils";

const STYLES = [
  { value: "line", label: "Линия" },
  { value: "gradient", label: "Градиент" },
  { value: "dots", label: "Точки" },
  { value: "wave", label: "Волна" },
  { value: "thick", label: "Жирная" },
  { value: "spacer", label: "Пустое" },
];

export default function DividerBlock({ data, onChange, preview, theme = {} }) {
  const style = data.style || "gradient";
  const accentColor = theme.accentColor || "#2563eb";

  const renderDivider = () => {
    if (style === "line") {
      return <hr className="border-gray-200" />;
    }
    if (style === "thick") {
      return (
        <div className="h-1 rounded-full" style={{ backgroundColor: accentColor }} />
      );
    }
    if (style === "gradient") {
      return (
        <div
          className="h-px"
          style={{ background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` }}
        />
      );
    }
    if (style === "dots") {
      return (
        <div className="flex items-center justify-center gap-2">
          {[0,1,2,3,4].map(i => (
            <div
              key={i}
              className={`rounded-full transition-all ${i === 2 ? "w-3 h-3" : i === 1 || i === 3 ? "w-2 h-2 opacity-60" : "w-1.5 h-1.5 opacity-30"}`}
              style={{ backgroundColor: accentColor }}
            />
          ))}
        </div>
      );
    }
    if (style === "wave") {
      return (
        <svg viewBox="0 0 200 12" className="w-full" style={{ height: 12 }}>
          <path
            d="M0,6 C25,0 50,12 75,6 C100,0 125,12 150,6 C175,0 200,12 200,6"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
        </svg>
      );
    }
    return null;
  };

  if (preview) {
    if (style === "spacer") {
      const topPx = data.spacerTop ?? 20;
      const bottomPx = data.spacerBottom ?? 20;
      return <div style={{ paddingTop: topPx + "px", paddingBottom: bottomPx + "px" }} />;
    }
    const pad = getBlockPadding(theme);
    const spacing = data.spacing || "normal";
    const pyVal = spacing === "small" ? 8 : spacing === "large" ? 32 : 16;
    return (
      <div style={{ paddingLeft: pad.paddingLeft, paddingRight: pad.paddingRight, paddingTop: pyVal, paddingBottom: pyVal }}>
        {renderDivider()}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Разделитель</p>
      <div className="flex flex-wrap gap-1.5">
        {STYLES.map(s => (
          <button
            key={s.value}
            onClick={() => onChange({ ...data, style: s.value })}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              style === s.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {style === "spacer" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16">Сверху:</span>
            <input
              type="range" min="0" max="100" step="5"
              value={data.spacerTop ?? 20}
              onChange={e => onChange({ ...data, spacerTop: parseInt(e.target.value) })}
              className="flex-1 h-1.5 accent-gray-900"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{data.spacerTop ?? 20}px</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16">Снизу:</span>
            <input
              type="range" min="0" max="100" step="5"
              value={data.spacerBottom ?? 20}
              onChange={e => onChange({ ...data, spacerBottom: parseInt(e.target.value) })}
              className="flex-1 h-1.5 accent-gray-900"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{data.spacerBottom ?? 20}px</span>
          </div>
          <div className="py-2 px-2">
            <div className="border border-dashed border-gray-200 rounded" style={{ height: ((data.spacerTop ?? 20) + (data.spacerBottom ?? 20)) / 2 + "px" }} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Отступ:</span>
            {["small", "normal", "large"].map(s => (
              <button
                key={s}
                onClick={() => onChange({ ...data, spacing: s })}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  (data.spacing || "normal") === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                {s === "small" ? "Мало" : s === "normal" ? "Норм" : "Много"}
              </button>
            ))}
          </div>
          <div className="py-2 px-2">
            {renderDivider()}
          </div>
        </>
      )}
    </div>
  );
}