import React, { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Package, Upload, Download, Trash, Check, X } from "lucide-react";
import ProductModal from "../components/products/ProductModal";
import XmlFeedsModal from "../components/products/XmlFeedsModal";
import BulkActionsBar from "../components/products/BulkActionsBar";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await base44.entities.Product.list("name", 99999);
    setProducts(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить товар?")) return;
    await base44.entities.Product.delete(id);
    loadProducts();
  };

  const handleSave = async (productData) => {
    // Перезалить внешнее фото через base44
    if (productData.image_url && 
        !productData.image_url.startsWith("data:") && 
        !productData.image_url.includes("base44") &&
        !productData.image_url.includes("blob:")) {
      try {
        const response = await fetch(productData.image_url);
        const blob = await response.blob();
        const file = new File([blob], "product-image.jpg", { type: blob.type });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        productData = { ...productData, image_url: file_url };
      } catch (e) {
        console.warn("Failed to re-upload image:", e);
        // Оставляем оригинальный URL
      }
    }

    if (editingProduct) {
      await base44.entities.Product.update(editingProduct.id, productData);
    } else {
      await base44.entities.Product.create(productData);
    }
    setShowModal(false);
    setEditingProduct(null);
    loadProducts();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleToggleSelect = (id) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === filteredProducts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSetCategory = async (category) => {
    const updates = Array.from(selected).map(id => 
      base44.entities.Product.update(id, { category })
    );
    await Promise.all(updates);
    setSelected(new Set());
    loadProducts();
  };

  const handleSetSync = async (enabled) => {
    const updates = Array.from(selected).map(id =>
      base44.entities.Product.update(id, { sync_price_from_feed: enabled })
    );
    await Promise.all(updates);
    setSelected(new Set());
    loadProducts();
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Удалить ${selected.size} товаров?`)) return;
    const deletes = Array.from(selected).map(id => base44.entities.Product.delete(id));
    await Promise.all(deletes);
    setSelected(new Set());
    loadProducts();
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const { output } = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: (await base44.integrations.Core.UploadFile({ file })).file_url,
        json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            sku: { type: "string" },
            price: { type: "number" },
            price2: { type: "number" },
            price2_label: { type: "string" },
            price3: { type: "number" },
            price3_label: { type: "string" },
            unit: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
          }
        }
      });
      
      if (Array.isArray(output)) {
        await base44.entities.Product.bulkCreate(
          output.filter(row => row.name).map(row => ({
            name: row.name,
            sku: row.sku || "",
            price: Number(row.price) || 0,
            price2: row.price2 ? Number(row.price2) : null,
            price2_label: row.price2_label || "Опт",
            price3: row.price3 ? Number(row.price3) : null,
            price3_label: row.price3_label || "Дилер",
            unit: row.unit || "шт.",
            category: row.category || "",
            description: row.description || "",
          }))
        );
        loadProducts();
      }
    } catch (err) {
      alert("Ошибка импорта: " + err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleExportExcel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      filteredProducts.map(p => ({
        "Название": p.name,
        "Артикул": p.sku || "",
        "Цена": p.price || 0,
        "Опт": p.price2 || "",
        "Дилер": p.price3 || "",
        "Ед.изм": p.unit || "шт.",
        "Категория": p.category || "",
        "Описание": p.description || "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Товары");
    XLSX.writeFile(wb, "товары.xlsx");
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Товары</h1>
            <p className="text-gray-400 mt-0.5 text-sm">Управляйте каталогом товаров</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} className="rounded-xl border-gray-200 text-sm h-9">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Экспорт
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} disabled={importing} />
              <Button variant="outline" asChild disabled={importing} className="rounded-xl border-gray-200 text-sm h-9">
                <span><Upload className="w-3.5 h-3.5 mr-1.5" /> {importing ? "..." : "Импорт"}</span>
              </Button>
            </label>
            <Button variant="outline" onClick={() => setShowXmlModal(true)} className="rounded-xl border-gray-200 text-sm h-9">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> XML фиды
            </Button>
            <Button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="rounded-xl bg-gray-900 hover:bg-black text-sm h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Добавить товар
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Поиск по названию или артикулу..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {selected.size > 0 && (
          <BulkActionsBar
            selectedCount={selected.size}
            onClear={() => setSelected(new Set())}
            onSetCategory={handleSetCategory}
            onSetSync={handleSetSync}
            onDelete={handleDeleteSelected}
          />
        )}

        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
           <div className="text-center py-24">
             <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Package className="w-7 h-7 text-gray-400" />
             </div>
             <h3 className="text-base font-medium text-gray-700">Нет товаров</h3>
             <p className="text-gray-400 text-sm mb-6 mt-1">Добавьте первый товар в каталог</p>
             <Button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="rounded-xl bg-gray-900 hover:bg-black text-sm h-9">
               <Plus className="w-3.5 h-3.5 mr-1.5" /> Добавить товар
             </Button>
           </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-3 py-2.5 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selected.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        className="w-3 h-3 rounded"
                      />
                    </th>
                    <th className="px-2 py-2.5 text-left w-12">Фото</th>
                    <th className="px-2 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Название</th>
                    <th className="px-2 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide w-28">Артикул</th>
                    <th className="px-2 py-2.5 text-right text-[10px] font-medium text-gray-400 uppercase tracking-wide w-24">Цена</th>
                    <th className="px-2 py-2.5 text-right text-[10px] font-medium text-gray-400 uppercase tracking-wide w-24">Опт</th>
                    <th className="px-2 py-2.5 text-right text-[10px] font-medium text-gray-400 uppercase tracking-wide w-24">Дилер</th>
                    <th className="px-2 py-2.5 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide">Категория</th>
                    <th className="px-2 py-2.5 text-center text-[10px] font-medium text-gray-400 uppercase tracking-wide w-16">Синк</th>
                    <th className="px-2 py-2.5 text-right text-[10px] font-medium text-gray-400 uppercase tracking-wide w-16">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${selected.has(p.id) ? "bg-gray-50" : ""}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => handleToggleSelect(p.id)}
                          className="w-3 h-3 rounded"
                        />
                      </td>
                      <td className="px-2 py-2">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-md object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs font-medium text-gray-900 max-w-xs">
                        <div className="line-clamp-2 leading-tight">{p.name}</div>
                      </td>
                      <td className="px-2 py-2 text-[11px] text-gray-400 font-mono whitespace-nowrap">{p.sku || "—"}</td>
                      <td className="px-2 py-2 text-xs font-semibold text-gray-900 text-right whitespace-nowrap">{p.price ? p.price.toLocaleString("ru-RU") + " ₽" : "—"}</td>
                      <td className="px-2 py-2 text-xs text-gray-500 text-right whitespace-nowrap">{p.price2 ? p.price2.toLocaleString("ru-RU") + " ₽" : "—"}</td>
                      <td className="px-2 py-2 text-xs text-gray-500 text-right whitespace-nowrap">{p.price3 ? p.price3.toLocaleString("ru-RU") + " ₽" : "—"}</td>
                      <td className="px-2 py-2 text-[11px] text-gray-400 max-w-[120px]">
                        <div className="truncate">{p.category || "—"}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {p.sync_price_from_feed ? (
                          <Check className="w-3 h-3 text-gray-700 mx-auto" title="Автоцена включена" />
                        ) : (
                          <X className="w-3 h-3 text-gray-200 mx-auto" title="Автоцена отключена" />
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-6 w-6 p-0 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="h-6 w-6 p-0 rounded text-gray-300 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <span className="text-sm text-gray-500">
                  {filteredProducts.length} товаров, страница {currentPage} из {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(pg => Math.max(1, pg - 1))} disabled={currentPage === 1}>←</Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pg => pg === 1 || pg === totalPages || Math.abs(pg - currentPage) <= 2)
                    .reduce((acc, pg, idx, arr) => {
                      if (idx > 0 && pg - arr[idx - 1] > 1) acc.push("...");
                      acc.push(pg);
                      return acc;
                    }, [])
                    .map((pg, i) => pg === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-gray-400">…</span>
                    ) : (
                      <Button key={pg} variant={pg === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pg)} className="w-8 h-8 p-0 text-xs">{pg}</Button>
                    ))
                  }
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(pg => Math.min(totalPages, pg + 1))} disabled={currentPage === totalPages}>→</Button>
                </div>
              </div>
            )}
          </>
        )}

      {showModal && (
        <ProductModal
          product={editingProduct}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
        />
      )}

      {showXmlModal && (
        <XmlFeedsModal
          onClose={() => setShowXmlModal(false)}
          onImportComplete={loadProducts}
          onSyncDone={loadProducts}
        />
      )}
    </div>
  );
}