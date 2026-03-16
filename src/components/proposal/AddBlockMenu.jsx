import React from "react";
import { AlignLeft, Table2, List, CreditCard, LayoutTemplate, Image, BarChart3, Minus, BookOpen, UserCircle, Award, Images, Sparkles, Grid3x3 } from "lucide-react";

const BLOCK_TYPES = [
  { type: "cover", label: "Обложка", icon: BookOpen },
  { type: "header", label: "Шапка", icon: LayoutTemplate },
  { type: "text", label: "Текст", icon: AlignLeft },
  { type: "banner", label: "Баннер", icon: Image },
  { type: "promo", label: "Promo", icon: Sparkles },
  { type: "photo_gallery", label: "Фото", icon: Images },
  { type: "logo", label: "Бренды", icon: Grid3x3 },
  { type: "divider", label: "Разделитель", icon: Minus },
  { type: "products_table", label: "Товары", icon: Table2 },
  { type: "summary", label: "Итого", icon: BarChart3 },
  { type: "advantages", label: "Преимущества", icon: Award },
  { type: "terms", label: "Условия", icon: List },
  { type: "manager", label: "Менеджер", icon: UserCircle },
  { type: "footer", label: "Подвал", icon: CreditCard },
];

const MANAGER_ALLOWED = ["cover", "text", "products_table", "manager"];

export default function AddBlockMenu({ onAdd, role }) {
  const blocks = role === "manager"
    ? BLOCK_TYPES.filter(b => MANAGER_ALLOWED.includes(b.type))
    : BLOCK_TYPES;

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-center mb-3">Добавить блок</p>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {blocks.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
