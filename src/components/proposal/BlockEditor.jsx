import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, ChevronUp, ChevronDown, Copy, ChevronRight } from "lucide-react";

const BLOCK_LABELS = {
  cover: "Обложка", header: "Шапка", text: "Текст", banner: "Баннер",
  products_table: "Товары", summary: "Итого", terms: "Условия",
  manager: "Менеджер", advantages: "Преимущества", photo_gallery: "Галерея",
  promo: "Promo", logo: "Бренды", divider: "Разделитель", footer: "Подвал",
};

export default function BlockEditor({ block, onDelete, onMoveUp, onMoveDown, onDuplicate, dragHandleProps, isManager, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="group relative bg-white border border-gray-200/80 rounded-2xl transition-all overflow-visible shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-300 hover:text-gray-600 transition-colors"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${collapsed ? "" : "rotate-90"}`} />
          </button>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            {BLOCK_LABELS[block.type] || block.type}
          </span>
        </div>
        {!isManager && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100"
              onClick={onDuplicate}
              title="Дублировать"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Left controls: drag + move — admin only */}
      {!isManager && (
        <div className="absolute -left-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex flex-col items-center gap-0.5 transition-opacity">
          <div
            {...(dragHandleProps || {})}
            className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100" onClick={onMoveUp}>
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100" onClick={onMoveDown}>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Content */}
      {!collapsed && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}
