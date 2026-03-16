import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Tag, RefreshCcw, Trash2 } from "lucide-react";

export default function BulkActionsBar({ selectedCount, onClear, onSetCategory, onSetSync, onDelete }) {
  const [category, setCategory] = useState("");
  const [showCatInput, setShowCatInput] = useState(false);

  const applyCategory = () => {
    if (!category.trim()) return;
    onSetCategory(category.trim());
    setCategory("");
    setShowCatInput(false);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-700">{selectedCount} товаров выбрано</span>

      <div className="flex items-center gap-2">
        {showCatInput ? (
          <>
            <Input
              placeholder="Введите категорию"
              value={category}
              onChange={e => setCategory(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyCategory()}
              className="h-7 text-xs w-40"
              autoFocus
            />
            <Button size="sm" onClick={applyCategory} className="h-7 text-xs bg-gray-900 hover:bg-gray-700">Применить</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCatInput(false)} className="h-7 text-xs">Отмена</Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowCatInput(true)} className="h-7 text-xs">
            <Tag className="w-3 h-3 mr-1" /> Задать категорию
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Авто-цена:</span>
        <Button size="sm" variant="outline" onClick={() => onSetSync(true)} className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50">
          <RefreshCcw className="w-3 h-3 mr-1" /> Вкл
        </Button>
        <Button size="sm" variant="outline" onClick={() => onSetSync(false)} className="h-7 text-xs text-gray-500 border-gray-300">
          Выкл
        </Button>
      </div>

      {onDelete && (
        <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-3 h-3 mr-1" /> Удалить все
        </Button>
      )}

      <Button size="sm" variant="ghost" onClick={onClear} className="h-7 text-xs ml-auto text-gray-500">
        <X className="w-3 h-3 mr-1" /> Снять выделение
      </Button>
    </div>
  );
}