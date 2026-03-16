import React, { useState } from "react";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check, Upload, Package } from "lucide-react";

const EMPTY = { name: "", sku: "", price: "", price_label: "Цена", price2: "", price2_label: "Опт", price3: "", price3_label: "Дилер", unit: "шт.", category: "", description: "", image_url: "" };

export default function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(product || EMPTY);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{product?.id ? "Редактировать товар" : "Новый товар"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Фото</label>
            <div className="flex gap-3 items-center">
              {form.image_url
                ? <img src={form.image_url} className="w-20 h-20 rounded-xl object-cover border" alt="" />
                : <div className="w-20 h-20 rounded-xl border bg-gray-50 flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
              }
              <div className="space-y-2 flex-1">
                <Input placeholder="URL изображения" value={form.image_url || ""} onChange={e => set("image_url", e.target.value)} className="h-8 text-xs" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" asChild>
                    <span><Upload className="w-3 h-3 mr-1" />{uploading ? "Загрузка..." : "Загрузить фото"}</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-medium block mb-1">Название*</label>
              <Input placeholder="Название товара" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Артикул</label>
              <Input placeholder="SKU-001" value={form.sku || ""} onChange={e => set("sku", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Ед. измерения</label>
              <Input placeholder="шт." value={form.unit || ""} onChange={e => set("unit", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Категория</label>
              <Input placeholder="Категория" value={form.category || ""} onChange={e => set("category", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-2">Цены</label>
            <div className="space-y-2">
              {[["price_label","price","Цена","Цена 1"],["price2_label","price2","Опт","Цена 2"],["price3_label","price3","Дилер","Цена 3"]].map(([lk, pk, lph, pph]) => (
                <div key={pk} className="flex gap-2 items-center">
                  <Input placeholder={lph} value={form[lk] || ""} onChange={e => set(lk, e.target.value)} className="h-8 text-xs w-28" />
                  <Input type="number" placeholder={pph} value={form[pk] || ""} onChange={e => set(pk, e.target.value)} className="h-8 flex-1" />
                  <span className="text-xs text-gray-400">₽</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Описание</label>
            <Input placeholder="Описание товара" value={form.description || ""} onChange={e => set("description", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">Отмена</Button>
          <Button onClick={() => onSave(form)} disabled={!form.name} className="flex-1 bg-gray-900 hover:bg-gray-700">
            <Check className="w-4 h-4 mr-2" /> Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}