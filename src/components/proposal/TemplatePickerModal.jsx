import React, { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, FileText, Briefcase, Building2, Megaphone, GraduationCap, Heart, Truck, Home, Wrench, ShoppingBag, Monitor } from "lucide-react";

const CATEGORY_META = {
  custom: { label: "Мои шаблоны", icon: FileText, color: "bg-gray-100 text-gray-700" },
  it: { label: "IT-услуги", icon: Monitor, color: "bg-gray-100 text-gray-700" },
  construction: { label: "Строительство", icon: Building2, color: "bg-orange-100 text-orange-700" },
  marketing: { label: "Маркетинг", icon: Megaphone, color: "bg-pink-100 text-pink-700" },
  consulting: { label: "Консалтинг", icon: Briefcase, color: "bg-purple-100 text-purple-700" },
  manufacturing: { label: "Производство", icon: Wrench, color: "bg-amber-100 text-amber-700" },
  retail: { label: "Ритейл", icon: ShoppingBag, color: "bg-green-100 text-green-700" },
  education: { label: "Образование", icon: GraduationCap, color: "bg-indigo-100 text-indigo-700" },
  medical: { label: "Медицина", icon: Heart, color: "bg-red-100 text-red-700" },
  logistics: { label: "Логистика", icon: Truck, color: "bg-cyan-100 text-cyan-700" },
  realestate: { label: "Недвижимость", icon: Home, color: "bg-emerald-100 text-emerald-700" },
};

const BUILTIN_TEMPLATES = [
  {
    name: "IT-услуги", category: "it", description: "Разработка, поддержка, SaaS-решения",
    blocks: [
      { id: "h1", type: "header", data: { title: "Коммерческое предложение", subtitle: "IT-решения для вашего бизнеса", layout: "left" } },
      { id: "t1", type: "text", data: { heading: "О компании", text: "Мы — команда профессионалов в сфере IT.", layout: "1col" } },
      { id: "p1", type: "products_table", data: { heading: "Услуги и решения", items: [], showSku: false, showUnit: true, showTotal: true, priceType: 1 } },
      { id: "s1", type: "summary", data: { heading: "Стоимость проекта", discount: 0, note: "Цены указаны без НДС" } },
      { id: "tr1", type: "terms", data: { heading: "Условия сотрудничества", terms: [{ icon: "⏱", label: "Сроки", value: "от 2 недель" }, { icon: "💳", label: "Оплата", value: "50% предоплата" }, { icon: "🛡", label: "Гарантия", value: "12 месяцев" }] } },
      { id: "m1", type: "manager", data: { block_title: "Ваш менеджер:", name: "", phone: "", email: "" } },
      { id: "f1", type: "footer", data: { note: "" } },
    ],
    theme: { headerStyle: "gradient", blockMode: "flat", blockRadius: 12, blockShadow: "sm", accentColor: "#2563eb", headerColor: "#1e3a5f" },
  },
  {
    name: "Строительная компания", category: "construction", description: "Строительство, ремонт, материалы",
    blocks: [
      { id: "h1", type: "header", data: { title: "Коммерческое предложение", subtitle: "Строительные работы и материалы", layout: "left" } },
      { id: "t1", type: "text", data: { heading: "О нашей компании", text: "Опыт в строительстве более 15 лет.", layout: "1col" } },
      { id: "p1", type: "products_table", data: { heading: "Смета работ", items: [], showSku: true, showUnit: true, showTotal: true, priceType: 1, tableStyle: "bordered" } },
      { id: "s1", type: "summary", data: { heading: "Итого по смете", discount: 0, note: "" } },
      { id: "tr1", type: "terms", data: { heading: "Условия", terms: [{ icon: "📋", label: "Договор", value: "Официальный" }, { icon: "⏱", label: "Сроки", value: "По графику" }, { icon: "🔧", label: "Гарантия", value: "5 лет" }] } },
      { id: "f1", type: "footer", data: { note: "" } },
    ],
    theme: { headerStyle: "bold", blockMode: "flat", blockRadius: 8, blockBorder: "thin", headerColor: "#d97706", accentColor: "#b45309" },
  },
  {
    name: "Маркетинговое агентство", category: "marketing", description: "Реклама, SMM, брендинг",
    blocks: [
      { id: "h1", type: "header", data: { title: "Коммерческое предложение", subtitle: "Маркетинговые решения", layout: "left" } },
      { id: "b1", type: "banner", data: { image_url: "", title: "Рост вашего бизнеса", subtitle: "Комплексный маркетинг", height: 200, overlay: true, overlayOpacity: 0.5, textColor: "#ffffff" } },
      { id: "p1", type: "products_table", data: { heading: "Пакеты услуг", items: [], showSku: false, showUnit: false, showTotal: true, priceType: 1, tableStyle: "modern" } },
      { id: "s1", type: "summary", data: { heading: "Бюджет", discount: 0, note: "" } },
      { id: "m1", type: "manager", data: { block_title: "Ваш аккаунт-менеджер:", name: "", phone: "", email: "" } },
      { id: "f1", type: "footer", data: { note: "" } },
    ],
    theme: { headerStyle: "centered", blockMode: "glass", blockRadius: 16, headerColor: "#db2777", accentColor: "#ec4899", glassColor: "#fdf2f8", glassOpacity: 0.5 },
  },
  {
    name: "Консалтинг", category: "consulting", description: "Бизнес-консультации, аудит",
    blocks: [
      { id: "h1", type: "header", data: { title: "Коммерческое предложение", subtitle: "Стратегический консалтинг", layout: "left" } },
      { id: "t1", type: "text", data: { heading: "Наш подход", text: "Индивидуальные решения для каждого клиента.", layout: "1col" } },
      { id: "p1", type: "products_table", data: { heading: "Состав услуг", items: [], showSku: false, showUnit: true, showTotal: true, priceType: 1, tableStyle: "minimal" } },
      { id: "s1", type: "summary", data: { heading: "Стоимость", discount: 0, note: "" } },
      { id: "f1", type: "footer", data: { note: "" } },
    ],
    theme: { headerStyle: "minimal", blockMode: "flat", blockRadius: 0, headerColor: "#7c3aed", accentColor: "#6d28d9" },
  },
  {
    name: "Производство", category: "manufacturing", description: "Оборудование, комплектующие",
    blocks: [
      { id: "h1", type: "header", data: { title: "Коммерческое предложение", layout: "left" } },
      { id: "p1", type: "products_table", data: { heading: "Спецификация", items: [], showSku: true, showUnit: true, showTotal: true, priceType: 1, tableStyle: "striped" } },
      { id: "s1", type: "summary", data: { heading: "Итого", discount: 0, note: "" } },
      { id: "tr1", type: "terms", data: { heading: "Условия поставки", terms: [{ icon: "🚛", label: "Доставка", value: "Включена" }, { icon: "⏱", label: "Срок", value: "14 дней" }] } },
      { id: "f1", type: "footer", data: { note: "" } },
    ],
    theme: { headerStyle: "compact", blockMode: "flat", blockRadius: 4, blockBorder: "medium", headerColor: "#0f766e", accentColor: "#0d9488" },
  },
];

export default function TemplatePickerModal({ onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [tab, setTab] = useState("builtin");

  useEffect(() => {
    base44.entities.ProposalTemplate.list("-created_date").then(setTemplates);
  }, []);

  const userTemplates = templates.filter(t => !t.is_builtin);

  const handleSelect = (tpl) => {
    onSelect({
      blocks: tpl.blocks?.map(b => ({ ...b, id: Math.random().toString(36).substr(2, 9) })) || [],
      theme: tpl.theme || {},
    });
    onClose();
  };

  const handleDelete = async (id) => {
    await base44.entities.ProposalTemplate.delete(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Создать из шаблона</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="flex gap-2 px-6 pt-4">
          <button onClick={() => setTab("builtin")} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${tab === "builtin" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>Готовые шаблоны</button>
          <button onClick={() => setTab("custom")} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${tab === "custom" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>Мои шаблоны ({userTemplates.length})</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {tab === "builtin" && (
            <div className="grid grid-cols-2 gap-3">
              {BUILTIN_TEMPLATES.map((tpl, i) => {
                const meta = CATEGORY_META[tpl.category] || CATEGORY_META.custom;
                const IconComp = meta.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(tpl)}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${meta.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="font-semibold text-sm text-gray-900 group-hover:text-gray-900">{tpl.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{tpl.description}</div>
                    <div className="text-[10px] text-gray-300 mt-1">{tpl.blocks.length} блоков</div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === "custom" && (
            userTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Нет сохранённых шаблонов</p>
                <p className="text-xs mt-1">Сохраните любое КП как шаблон из редактора</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userTemplates.map(tpl => (
                  <div key={tpl.id} className="p-4 rounded-xl border border-gray-200 hover:border-gray-400 transition-all group relative">
                    <button onClick={() => handleSelect(tpl)} className="text-left w-full">
                      <div className="font-semibold text-sm text-gray-900 group-hover:text-gray-900">{tpl.name}</div>
                      {tpl.description && <div className="text-xs text-gray-400 mt-0.5">{tpl.description}</div>}
                      <div className="text-[10px] text-gray-300 mt-1">{(tpl.blocks || []).length} блоков</div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}