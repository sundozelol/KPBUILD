import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Download, Eye, EyeOff, Files, Bookmark, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { createRoot } from "react-dom/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import BlockEditor from "../components/proposal/BlockEditor";
import AddBlockMenu from "../components/proposal/AddBlockMenu";
import ProposalPreview, { DEFAULT_THEME } from "../components/proposal/ProposalPreview";
import ThemePanel from "../components/proposal/ThemePanel";
import PdfExportModal from "../components/proposal/PdfExportModal";
import PdfSettingsModal from "../components/proposal/PdfSettingsModal";
import { exportProposalToWord } from "../components/proposal/exportToWord";
import HeaderBlock from "../components/proposal/blocks/HeaderBlock";
import TextBlock from "../components/proposal/blocks/TextBlock";
import ProductsTableBlock from "../components/proposal/blocks/ProductsTableBlock";
import TermsBlock from "../components/proposal/blocks/TermsBlock";
import FooterBlock from "../components/proposal/blocks/FooterBlock";
import BannerBlock from "../components/proposal/blocks/BannerBlock";
import SummaryBlock from "../components/proposal/blocks/SummaryBlock";
import DividerBlock from "../components/proposal/blocks/DividerBlock";
import CoverBlock from "../components/proposal/blocks/CoverBlock";
import ManagerBlock from "../components/proposal/blocks/ManagerBlock";
import AdvantagesBlock from "../components/proposal/blocks/AdvantagesBlock";
import PhotoGalleryBlock from "../components/proposal/blocks/PhotoGalleryBlock";
import PromoBlock from "../components/proposal/blocks/PromoBlock";
import LogoBlock from "../components/proposal/blocks/LogoBlock";

const BLOCK_COMPONENTS = {
  cover: CoverBlock,
  header: HeaderBlock,
  text: TextBlock,
  banner: BannerBlock,
  divider: DividerBlock,
  products_table: ProductsTableBlock,
  summary: SummaryBlock,
  terms: TermsBlock,
  manager: ManagerBlock,
  advantages: AdvantagesBlock,
  photo_gallery: PhotoGalleryBlock,
  promo: PromoBlock,
  logo: LogoBlock,
  footer: FooterBlock,
};

const DEFAULT_BLOCK_DATA = {
  cover: { image_url: "", title: "", subtitle: "", height: 480, overlay: true, overlayOpacity: 0.55, textColor: "#ffffff" },
  header: { title: "Коммерческое предложение", subtitle: "", layout: "left" },
  text: { heading: "", text: "", layout: "1col" },
  banner: { image_url: "", title: "", subtitle: "", height: 240, overlay: true, overlayOpacity: 0.4, textColor: "#ffffff" },
  products_table: { heading: "Состав предложения", items: [], showSku: true, showQty: true, showUnit: true, showTotal: true, priceType: 1, fontSize: 14 },
  divider: { style: "gradient", spacing: "normal", spacerTop: 20, spacerBottom: 20 },
  manager: { block_title: "Ваш Менеджер:", name: "", phone: "", email: "", telegram: "", whatsapp: "", photo_url: "" },
  summary: { heading: "Итоговая стоимость", discount: 0, note: "" },
  advantages: { heading: "Наши преимущества", items: [], columns: 3, iconSize: 40 },
  photo_gallery: { heading: "", images: [], layout: "grid", columns: 3, gap: 8 },
  promo: { heading: "", title: "", image_url: "", overlayColor: "#000000", overlayOpacity: 0.5, items: [], headingSize: 36, textSize: 16 },
  logo: { heading: "Наши бренды", items: [], fontSize: 13, descSize: 11 },
  terms: { heading: "Условия предложения", terms: [] },
  footer: { note: "" },
};

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

const MANAGER_EDITABLE = ["cover", "text", "products_table", "manager"];

export default function ProposalEditor() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [blocks, setBlocks] = useState([]);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [exportingWord, setExportingWord] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const previewRef = useRef();

  const getProposalId = () => new URLSearchParams(window.location.search).get("id");
  const proposalId = getProposalId();

  useEffect(() => {
    if (proposalId) loadProposal();
    else { prefillFromProfile(); setLoaded(true); }
  }, [proposalId]);

  const prefillFromProfile = async () => {
    const profiles = await base44.entities.CompanyProfile.list();
    if (profiles.length > 0) {
      const profile = profiles[0];
      setTheme(prev => ({ ...prev, logo_url: prev.logo_url || profile.logo_url || "" }));
      setBlocks(prev => prev.map(b => {
        if (b.type === "header") return { ...b, data: { ...b.data, company_name: b.data.company_name || profile.company_name, phone: b.data.phone || profile.phone, email: b.data.email || profile.email, website: b.data.website || profile.website } };
        if (b.type === "footer") return { ...b, data: { ...b.data, company_name: b.data.company_name || profile.company_name, phone: b.data.phone || profile.phone, email: b.data.email || profile.email, website: b.data.website || profile.website, bank_details: b.data.bank_details || profile.bank_details } };
        return b;
      }));
    }
  };

  const loadProposal = async () => {
    const p = await base44.entities.Proposal.get(proposalId);
    if (p) {
      setTitle(p.title || "");
      setClientName(p.client_name || "");
      setClientCompany(p.client_company || "");
      setBlocks(p.blocks || []);
      const savedTheme = p.theme || {};
      const mergedTheme = { ...DEFAULT_THEME, ...savedTheme };
      if (savedTheme.margins) {
        mergedTheme.margins = { ...DEFAULT_THEME.margins, ...savedTheme.margins };
      }
      setTheme(mergedTheme);
    }
    setLoaded(true);
  };


  const handleSave = async () => {
     setSaving(true);

     // Validate and normalize all blocks to ensure data persistence
     const normalizedBlocks = blocks.map(b => ({
       ...b,
       data: {
         ...b.data,
         ...(b.type === "products_table" ? {
           heading: b.data.heading || "Состав предложения",
           showSku: b.data.showSku !== undefined ? b.data.showSku : true,
           showQty: b.data.showQty !== undefined ? b.data.showQty : true,
           showUnit: b.data.showUnit !== undefined ? b.data.showUnit : true,
           showTotal: b.data.showTotal !== undefined ? b.data.showTotal : true,
           fontSize: b.data.fontSize || 14,
           priceType: b.data.priceType || 1,
           items: b.data.items || [],
         } : {}),
         ...(b.type === "advantages" ? {
           heading: b.data.heading || "Наши преимущества",
           columns: b.data.columns || 3,
           iconSize: b.data.iconSize || 40,
           items: b.data.items || [],
         } : {}),
       }
     }));

     const total = normalizedBlocks
       .filter(b => b.type === "products_table")
       .reduce((sum, b) => sum + (b.data.items || []).reduce((s, i) => s + i.price * i.qty, 0), 0);

     // Merge with defaults to ensure all keys are always persisted
     const fullTheme = {
       ...DEFAULT_THEME,
       ...theme,
       margins: { ...DEFAULT_THEME.margins, ...(theme.margins || {}) },
     };

    const payload = {
      title,
      client_name: clientName,
      client_company: clientCompany,
      blocks: normalizedBlocks,
      theme: fullTheme,
      total_amount: total,
    };

    const currentId = getProposalId();
    if (currentId) {
      await base44.entities.Proposal.update(currentId, payload);
    } else {
      const created = await base44.entities.Proposal.create(payload);
      // Update URL to reflect new ID so future saves update the same record
      window.history.replaceState(null, "", `?id=${created.id}`);
    }
    setSaving(false);
  };

  const handleAddBlock = async (type) => {
    const profiles = await base44.entities.CompanyProfile.list();
    const profile = profiles[0] || {};
    let defaultData = { ...DEFAULT_BLOCK_DATA[type] };

    if (type === "header") {
      defaultData = { ...defaultData, company_name: profile.company_name || "", logo_url: profile.logo_url || "", phone: profile.phone || "", email: profile.email || "", website: profile.website || "", client_company: clientCompany, client_name: clientName };
    }
    if (type === "footer") {
      defaultData = { ...defaultData, company_name: profile.company_name || "", phone: profile.phone || "", email: profile.email || "", website: profile.website || "", bank_details: profile.bank_details || "" };
    }

    setBlocks(prev => [...prev, { id: generateId(), type, data: defaultData }]);
  };

  const handleUpdateBlock = (id, newData) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: newData } : b));
  };

  const handleDeleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleMove = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (dir === "up" && idx === 0) return;
    if (dir === "down" && idx === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    setBlocks(newBlocks);
  };

  const handleDuplicate = (id) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const original = blocks[idx];
    const clone = {
      ...original,
      id: generateId(),
      data: JSON.parse(JSON.stringify(original.data)),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, clone);
    setBlocks(newBlocks);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(from, 1);
    newBlocks.splice(to, 0, moved);
    setBlocks(newBlocks);
  };

  const handleExportPDF = async (settings = {}) => {
    setExporting(true);

    try {
      // Render ProposalPreview in a hidden off-screen container
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-99999px;top:0;width:794px;background:#fff;";
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(<ProposalPreview blocks={blocks} theme={theme} />);

      // Wait for render + images to load
      await new Promise(r => setTimeout(r, 1500));

      const html = container.innerHTML;
      const styles = Array.from(document.styleSheets)
        .map(sheet => { try { return Array.from(sheet.cssRules).map(r => r.cssText).join("\n"); } catch { return ""; } })
        .join("\n");

      root.unmount();
      document.body.removeChild(container);

      const blob = await base44.exportToPdf(html, styles, title || "КП", settings.pageSize || "A4");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "КП"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Ошибка генерации PDF: " + err.message);
    } finally {
      setExporting(false);
      setShowPdfSettings(false);
    }
  };

  const handleExportWord = async () => {
    setExportingWord(true);
    await exportProposalToWord({ blocks, theme, title, clientName, clientCompany });
    setExportingWord(false);
  };

  const handleSaveAsTemplate = () => {
    setTemplateName(title || "");
    setTemplateDesc("");
    setShowSaveTemplateDialog(true);
  };

  const doSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      await base44.entities.ProposalTemplate.create({
        name: templateName.trim(),
        description: templateDesc.trim(),
        category: "custom",
        blocks: blocks.map(({ id, type, data }) => ({ id, type, data })),
        theme,
      });
      setShowSaveTemplateDialog(false);
    } catch (e) {
      alert("Ошибка сохранения: " + e.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const totalAmount = blocks
    .filter(b => b.type === "products_table")
    .reduce((sum, b) => sum + (b.data.items || []).reduce((s, i) => s + i.price * i.qty, 0), 0);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 flex items-center justify-between sticky top-0 z-10 h-12">
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("Proposals")}>
            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          {isManager ? (
            <span className="font-medium text-sm text-gray-900 px-1 truncate max-w-[224px]">{title || "КП"}</span>
          ) : (
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="font-medium text-sm border-none shadow-none focus-visible:ring-0 w-56 bg-transparent text-gray-900 placeholder:text-gray-300"
              placeholder="Название КП"
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          {totalAmount > 0 && (
            <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg mr-1">
              {totalAmount.toLocaleString("ru-RU")} ₽
            </div>
          )}
          {!isManager && (
            <>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100" onClick={handleSaveAsTemplate} disabled={savingTemplate}>
                <Bookmark className="w-3.5 h-3.5 mr-1" /> Шаблон
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100" onClick={() => setShowBatchModal(true)}>
                <Files className="w-3.5 h-3.5 mr-1" /> Пакет
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
            {showPreview ? "Редактор" : "Превью"}
          </Button>
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <Button variant="ghost" size="sm" className="rounded-xl text-xs h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 border border-gray-200" onClick={handleSave} disabled={saving}>
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? "..." : "Сохранить"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportWord} disabled={exportingWord} className="rounded-xl text-xs h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200">
            <FileText className="w-3.5 h-3.5 mr-1" />
            {exportingWord ? "..." : "Word"}
          </Button>
          <Button size="sm" onClick={() => setShowPdfSettings(true)} disabled={exporting} className="rounded-xl text-xs h-8 bg-gray-900 hover:bg-black text-white">
            <Download className="w-3.5 h-3.5 mr-1" />
            {exporting ? "..." : "PDF"}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-48px)]">
        {/* Left: Editor */}
        {!showPreview && (
          <div className="w-full md:w-1/2 overflow-y-auto px-[5px] py-4 border-r border-gray-200/60 bg-[#f5f5f7]">
            <div className="space-y-3">
              {/* Client info — admin only */}
              {!isManager && (
                <div className="bg-white rounded-2xl border border-gray-200/60 p-4 space-y-3 shadow-sm">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Клиент</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Компания клиента" value={clientCompany} onChange={e => setClientCompany(e.target.value)} className="h-8 text-sm rounded-xl border-gray-200" />
                    <Input placeholder="Имя контакта" value={clientName} onChange={e => setClientName(e.target.value)} className="h-8 text-sm rounded-xl border-gray-200" />
                  </div>
                </div>
              )}

              {/* Theme panel — admin only */}
              {!isManager && <ThemePanel theme={theme} onChange={setTheme} onSave={handleSave} saving={saving} />}

              {/* Blocks */}
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="blocks">
                  {(provided) => (
                    <div
                      className="space-y-3 pl-9"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {blocks.map((block, index) => {
                        const Component = BLOCK_COMPONENTS[block.type];
                        if (!Component) return null;
                        if (isManager && !MANAGER_EDITABLE.includes(block.type)) return null;
                        return (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(dragProvided, snapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={snapshot.isDragging ? "opacity-90 scale-[1.01] shadow-xl rounded-2xl" : ""}
                              >
                                <BlockEditor
                                  block={block}
                                  onDelete={() => handleDeleteBlock(block.id)}
                                  onMoveUp={() => handleMove(block.id, "up")}
                                  onMoveDown={() => handleMove(block.id, "down")}
                                  onDuplicate={() => handleDuplicate(block.id)}
                                  dragHandleProps={dragProvided.dragHandleProps}
                                  isManager={isManager}
                                >
                                  <Component
                                    data={block.data}
                                    onChange={(newData) => handleUpdateBlock(block.id, newData)}
                                    preview={false}
                                    theme={theme}
                                    allBlocks={blocks}
                                  />
                                </BlockEditor>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {!isManager && <AddBlockMenu onAdd={handleAddBlock} role={user?.role} />}
            </div>
          </div>
        )}

        {/* Right: Preview */}
        <div className={`${showPreview ? "w-full" : "w-1/2 hidden md:block"} overflow-y-auto bg-[#e8e8ed] p-8`}>
          <div className="flex flex-col items-center" ref={previewRef}>
            <ProposalPreview blocks={blocks} theme={theme} />
          </div>
        </div>
      </div>

      {showBatchModal && <PdfExportModal onClose={() => setShowBatchModal(false)} />}
      {showPdfSettings && (
        <PdfSettingsModal
          onClose={() => setShowPdfSettings(false)}
          onExport={handleExportPDF}
          exporting={exporting}
        />
      )}

      {/* Save as template dialog */}
      {showSaveTemplateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Сохранить как шаблон</h2>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Название шаблона</label>
              <Input
                placeholder="Например: Шаблон для оборудования"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="h-9"
                autoFocus
                onKeyDown={e => e.key === "Enter" && doSaveTemplate()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Описание (необязательно)</label>
              <Input
                placeholder="Краткое описание шаблона"
                value={templateDesc}
                onChange={e => setTemplateDesc(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowSaveTemplateDialog(false)}>Отмена</Button>
              <Button size="sm" className="bg-gray-900 hover:bg-black text-white" onClick={doSaveTemplate} disabled={savingTemplate || !templateName.trim()}>
                {savingTemplate ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}