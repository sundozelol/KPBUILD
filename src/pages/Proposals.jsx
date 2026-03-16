import React, { useState, useEffect, useRef } from "react";
import { base44, apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Edit, Trash2, LayoutTemplate, Check, X, LayoutGrid, List, Share2, Eye, Copy, EyeOff, Smartphone, Monitor, Tablet } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import TemplatePickerModal from "../components/proposal/TemplatePickerModal";
import ProposalsKanban from "../components/proposal/ProposalsKanban";
import { useAuth } from "@/lib/AuthContext";

const statusLabels = {
  draft:    { label: "Черновик",  color: "bg-gray-100 text-gray-600 border border-gray-200" },
  sent:     { label: "Отправлено", color: "bg-gray-900 text-white border border-gray-900" },
  accepted: { label: "Принято",   color: "bg-gray-100 text-gray-800 border border-gray-300" },
  rejected: { label: "Отклонено", color: "bg-gray-100 text-gray-500 border border-gray-200 line-through" },
};

export default function Proposals() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [sharePanel, setSharePanel] = useState(null);
  const [shareData, setShareData] = useState({});
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState(null);
  const sharePanelRef = useRef(null);

  useEffect(() => { loadProposals(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (sharePanelRef.current && !sharePanelRef.current.contains(e.target)) {
        setSharePanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getPublicUrl = (token) => `${window.location.origin}/p/${token}`;

  const handleShareOpen = async (p) => {
    if (sharePanel === p.id) { setSharePanel(null); return; }
    setSharePanel(p.id);
    const current = shareData[p.id] || { public_token: p.public_token, public_enabled: Boolean(p.public_enabled) };
    setShareData(d => ({ ...d, [p.id]: { ...current, viewsLoading: true } }));
    try {
      const views = await apiClient.share.getViews(p.id);
      setShareData(d => ({ ...d, [p.id]: { ...d[p.id], ...views, viewsLoading: false } }));
    } catch {
      setShareData(d => ({ ...d, [p.id]: { ...d[p.id], viewsLoading: false } }));
    }
  };

  const handleShareEnable = async (id) => {
    setShareLoading(true);
    setShareError(null);
    try {
      const result = await apiClient.share.enable(id);
      const views = await apiClient.share.getViews(id);
      setShareData(d => ({ ...d, [id]: { public_token: result.public_token, public_enabled: true, ...views } }));
      setProposals(ps => ps.map(p => p.id === id ? { ...p, public_token: result.public_token, public_enabled: true } : p));
    } catch (e) {
      setShareError(e.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareDisable = async (id) => {
    setShareLoading(true);
    try {
      await apiClient.share.disable(id);
      setShareData(d => ({ ...d, [id]: { ...d[id], public_enabled: false } }));
      setProposals(ps => ps.map(p => p.id === id ? { ...p, public_enabled: false } : p));
    } catch (e) {
      setShareError(e.message);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopy = (token) => {
    navigator.clipboard.writeText(getPublicUrl(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadProposals = async () => {
    setLoading(true);
    const data = await base44.entities.Proposal.list("-created_date");
    setProposals(data);
    setLoading(false);
  };

  const handleRenameStart = (p) => { setEditingId(p.id); setEditingTitle(p.title); };

  const handleRenameSave = async (id, title) => {
    const newTitle = title || editingTitle.trim();
    if (!newTitle) return;
    await base44.entities.Proposal.update(id, { title: newTitle });
    setProposals(proposals.map(p => p.id === id ? { ...p, title: newTitle } : p));
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить это КП?")) return;
    await base44.entities.Proposal.delete(id);
    loadProposals();
  };

  const handleCreate = async () => {
    const p = await base44.entities.Proposal.create({
      title: "Новое коммерческое предложение",
      status: "draft",
      blocks: [],
      total_amount: 0,
    });
    window.location.href = createPageUrl(`ProposalEditor?id=${p.id}`);
  };

  const handleCreateFromTemplate = async ({ blocks, theme }) => {
    const p = await base44.entities.Proposal.create({
      title: "Новое КП из шаблона",
      status: "draft",
      blocks,
      theme,
      total_amount: 0,
    });
    window.location.href = createPageUrl(`ProposalEditor?id=${p.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {isManager ? "Принятые предложения" : "Коммерческие предложения"}
          </h1>
          <p className="text-gray-400 mt-0.5 text-sm">
            {isManager ? "КП, принятые к исполнению" : "Управляйте своими КП"}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* Kanban toggle — admin only */}
          {!isManager && (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "kanban" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-700"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Create buttons — admin only */}
          {!isManager && (
            <>
              <Button variant="outline" onClick={() => setShowTemplates(true)} className="rounded-xl border-gray-200 text-sm h-9">
                <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" /> Из шаблона
              </Button>
              <Button onClick={handleCreate} className="rounded-xl bg-gray-900 hover:bg-black text-sm h-9">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Создать КП
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-700">
            {isManager ? "Нет принятых КП" : "Нет КП"}
          </h3>
          <p className="text-gray-400 text-sm mb-6 mt-1">
            {isManager
              ? "Администратор ещё не принял ни одного предложения"
              : "Создайте первое коммерческое предложение"}
          </p>
          {!isManager && (
            <Button onClick={handleCreate} className="rounded-xl bg-gray-900 hover:bg-black text-sm h-9">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Создать КП
            </Button>
          )}
        </div>
      ) : viewMode === "kanban" && !isManager && !sharePanel ? (
        <ProposalsKanban
          proposals={proposals}
          onDelete={handleDelete}
          onRename={handleRenameSave}
          onProposalsChange={setProposals}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {proposals.map((p, idx) => {
            const status = statusLabels[p.status] || statusLabels.draft;
            const sd = shareData[p.id] || { public_token: p.public_token, public_enabled: Boolean(p.public_enabled) };
            const isShareOpen = sharePanel === p.id;
            return (
              <div key={p.id} className={idx !== proposals.length - 1 ? "border-b border-gray-100" : ""}>
                <div className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      {!isManager && editingId === p.id ? (
                        <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleRenameSave(p.id); if (e.key === "Escape") setEditingId(null); }}
                            className="text-sm font-medium border border-gray-300 rounded-lg px-2 py-0.5 outline-none w-64 focus:border-gray-500"
                          />
                          <button onClick={() => handleRenameSave(p.id)} className="text-gray-600 hover:text-gray-900 ml-1"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-300 hover:text-gray-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <h3
                          className={`font-medium text-gray-900 text-sm flex items-center gap-1 group truncate ${!isManager ? "cursor-pointer" : ""}`}
                          onClick={!isManager ? () => handleRenameStart(p) : undefined}
                        >
                          {p.title}
                          {!isManager && <Edit className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity shrink-0" />}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        {p.client_company && <span>{p.client_company}</span>}
                        {p.client_name && <span>· {p.client_name}</span>}
                        <span>{format(new Date(p.created_date), "d MMM yyyy", { locale: ru })}</span>
                        {p.total_amount > 0 && (
                          <span className="font-medium text-gray-600">· {p.total_amount.toLocaleString("ru-RU")} ₽</span>
                        )}
                        {p.view_count > 0 && (
                          <span className="flex items-center gap-0.5 text-gray-400">
                            · <Eye className="w-3 h-3 inline" /> {p.view_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge className={`text-xs px-2 py-0.5 rounded-full font-normal ${status.color}`}>{status.label}</Badge>
                    {!isManager && (
                      <Button
                        variant="ghost" size="icon"
                        className={`h-7 w-7 rounded-lg hover:bg-gray-100 ${isShareOpen || sd.public_enabled ? "text-gray-700" : "text-gray-300 hover:text-gray-600"}`}
                        onClick={() => handleShareOpen(p)}
                        title="Публичная ссылка"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Link to={createPageUrl(`ProposalEditor?id=${p.id}`)}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    {!isManager && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Share panel */}
                {isShareOpen && (
                  <div ref={sharePanelRef} className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                    {sd.public_enabled && sd.public_token ? (
                      <>
                        {/* Link row */}
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={getPublicUrl(sd.public_token)}
                            className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none select-all"
                            onClick={e => e.target.select()}
                          />
                          <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg shrink-0" onClick={() => handleCopy(sd.public_token)}>
                            <Copy className="w-3 h-3 mr-1" />
                            {copied ? "Скопировано!" : "Копировать"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg text-gray-400 hover:text-red-500 shrink-0" onClick={() => handleShareDisable(p.id)} disabled={shareLoading}>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Отключить
                          </Button>
                        </div>

                        {/* Analytics */}
                        <div className="border-t border-gray-200 pt-3 space-y-3">
                          {sd.viewsLoading ? (
                            <p className="text-xs text-gray-400">Загрузка аналитики...</p>
                          ) : sd.total > 0 ? (
                            <>
                              {/* Stat cards */}
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                                  <p className="text-lg font-semibold text-gray-900">{sd.total}</p>
                                  <p className="text-[10px] text-gray-400">просмотров</p>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                                  <p className="text-lg font-semibold text-gray-900">
                                    {sd.avg_duration > 0 ? (sd.avg_duration < 60 ? `${sd.avg_duration}с` : `${Math.floor(sd.avg_duration/60)}м ${sd.avg_duration%60}с`) : '—'}
                                  </p>
                                  <p className="text-[10px] text-gray-400">среднее время</p>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                                  <p className="text-lg font-semibold text-gray-900">{sd.download_count || 0}</p>
                                  <p className="text-[10px] text-gray-400">скачиваний</p>
                                </div>
                              </div>

                              {/* Page engagement */}
                              {sd.page_stats_agg && Object.keys(sd.page_stats_agg).length > 0 && (() => {
                                const entries = Object.entries(sd.page_stats_agg).sort((a, b) => {
                                  const order = k => k === 'cover' ? -1 : parseInt(k.replace('page-','')) || 0;
                                  return order(a[0]) - order(b[0]);
                                });
                                const maxVal = Math.max(...entries.map(e => e[1]), 1);
                                return (
                                  <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Вовлечённость по страницам</p>
                                    <div className="space-y-1.5">
                                      {entries.map(([key, secs]) => {
                                        const label = key === 'cover' ? 'Обложка' : `Стр. ${parseInt(key.replace('page-','')) + 1}`;
                                        const pct = Math.round((secs / maxVal) * 100);
                                        const time = secs < 60 ? `${Math.round(secs)}с` : `${Math.floor(secs/60)}м ${Math.round(secs%60)}с`;
                                        return (
                                          <div key={key} className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 w-16 shrink-0">{label}</span>
                                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                              <div className="h-full bg-gray-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[10px] text-gray-500 w-10 text-right shrink-0">{time}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Recent views list */}
                              <div className="space-y-1 max-h-36 overflow-y-auto">
                                {(sd.views || []).map(v => {
                                  const ua = v.user_agent || '';
                                  const isMobile = /mobile|android|iphone/i.test(ua);
                                  const isTablet = /ipad|tablet/i.test(ua);
                                  const DeviceIcon = isMobile ? Smartphone : isTablet ? Tablet : Monitor;
                                  const dur = v.duration_seconds;
                                  const durStr = dur > 0 ? (dur < 60 ? `${dur}с` : `${Math.floor(dur/60)}м ${dur%60}с`) : null;
                                  return (
                                    <div key={v.id} className="flex items-center gap-2 text-xs text-gray-500">
                                      <DeviceIcon className="w-3 h-3 shrink-0 text-gray-400" />
                                      <span>{format(new Date(v.viewed_at), "d MMM, HH:mm", { locale: ru })}</span>
                                      {durStr && <span className="text-gray-400">· {durStr}</span>}
                                      {v.ip && <span className="text-gray-300 ml-auto">{v.ip}</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400">Ещё никто не открывал — отправьте ссылку клиенту</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs text-gray-500">Создайте публичную ссылку — клиент откроет КП в браузере без скачивания</p>
                          <Button size="sm" className="h-7 text-xs rounded-lg bg-gray-900 hover:bg-black shrink-0" onClick={() => handleShareEnable(p.id)} disabled={shareLoading}>
                            <Share2 className="w-3 h-3 mr-1" />
                            {shareLoading ? "..." : "Создать ссылку"}
                          </Button>
                        </div>
                        {shareError && <p className="text-xs text-red-500 mt-1">{shareError}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showTemplates && (
        <TemplatePickerModal
          onSelect={handleCreateFromTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
