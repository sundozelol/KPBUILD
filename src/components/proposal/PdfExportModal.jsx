import React, { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Download, X, CheckSquare, Square, Loader2, CheckCircle2 } from "lucide-react";
import { createRoot } from "react-dom/client";
import ProposalPreview from "./ProposalPreview";

/**
 * Captures the rendered HTML + all page CSS from the DOM.
 * Sends to backend Puppeteer service for pixel-perfect PDF generation.
 */
async function renderProposalToHtml(proposal) {
  const theme = proposal.theme || {};

  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-99999px";
    container.style.top = "0";
    container.style.width = "794px";
    container.style.background = "#fff";
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(<ProposalPreview blocks={proposal.blocks || []} theme={theme} />);

    setTimeout(() => {
      const html = container.innerHTML;
      const styles = Array.from(document.styleSheets)
        .map(sheet => {
          try { return Array.from(sheet.cssRules).map(r => r.cssText).join("\n"); }
          catch { return ""; }
        })
        .join("\n");

      root.unmount();
      document.body.removeChild(container);
      resolve({ html, styles });
    }, 1200);
  });
}

async function downloadPdfForProposal(proposal) {
  const { html, styles } = await renderProposalToHtml(proposal);
  const blob = await base44.exportToPdf(html, styles, proposal.title || "КП");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proposal.title || "КП"}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function PdfExportModal({ onClose }) {
  const [proposals, setProposals] = useState([]);
  const [selected, setSelected] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    base44.entities.Proposal.list("-created_date", 100).then(setProposals);
  }, []);

  const toggle = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toggleAll = () =>
    setSelected(s => s.length === proposals.length ? [] : proposals.map(p => p.id));

  const handleBatchExport = async () => {
    if (!selected.length) return;
    setGenerating(true);
    setDone(false);
    const toExport = proposals.filter(p => selected.includes(p.id));

    for (let i = 0; i < toExport.length; i++) {
      const p = toExport[i];
      setProgress({ text: `Генерация ${i + 1} / ${toExport.length}: ${p.title || "КП"}`, percent: Math.round((i / toExport.length) * 100) });
      try {
        await downloadPdfForProposal(p);
      } catch (err) {
        console.error("PDF error for", p.title, err);
      }
      await new Promise(r => setTimeout(r, 300));
    }

    setProgress({ text: "Готово!", percent: 100 });
    setDone(true);
    setGenerating(false);
    setTimeout(onClose, 1500);
  };

  const STATUS_LABELS = {
    draft: { label: "Черновик", color: "bg-gray-100 text-gray-600" },
    sent: { label: "Отправлен", color: "bg-gray-900 text-white" },
    accepted: { label: "Принят", color: "bg-green-100 text-green-700" },
    rejected: { label: "Отклонён", color: "bg-red-100 text-red-600" },
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-lg">Пакетный экспорт PDF</h2>
            <p className="text-xs text-gray-400 mt-0.5">Рендеринг через Puppeteer — точное воспроизведение</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Выберите КП для экспорта</span>
            <button onClick={toggleAll} className="text-xs text-gray-500 hover:text-gray-900 hover:underline">
              {selected.length === proposals.length ? "Снять все" : "Выбрать все"}
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {proposals.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Нет КП для экспорта</div>
            )}
            {proposals.map(p => {
              const st = STATUS_LABELS[p.status] || STATUS_LABELS.draft;
              return (
                <div
                  key={p.id}
                  onClick={() => !generating && toggle(p.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selected.includes(p.id) ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
                  } ${generating ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {selected.includes(p.id)
                    ? <CheckSquare className="w-5 h-5 text-gray-900 flex-shrink-0" />
                    : <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.title || "Без названия"}</div>
                    {p.client_company && <div className="text-xs text-gray-400 truncate">{p.client_company}</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {progress && (
          <div className="px-5 pb-3">
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <Loader2 className="w-4 h-4 animate-spin" />
                  }
                  <span>{progress.text}</span>
                </div>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-gray-900 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress.percent}%` }} />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={generating}>Отмена</Button>
          <Button
            onClick={handleBatchExport}
            disabled={!selected.length || generating}
            className="flex-1 bg-gray-900 hover:bg-gray-700 text-white"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {generating ? "Генерация..." : `Скачать${selected.length ? ` (${selected.length})` : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
