import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { apiClient } from "@/api/apiClient";
import ProposalPreview from "@/components/proposal/ProposalPreview";
import { FileText, Download, Loader2 } from "lucide-react";

const A4_W = 794;

// ── Scaled preview with responsive fit ───────────────────────────────────────

function ScaledProposalPreview({ blocks, theme, previewRef }) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      setScale(Math.min(1, containerRef.current.clientWidth / A4_W));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(entries => setInnerHeight(entries[0]?.contentRect.height || 0));
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, []);

  // Expose inner div to parent for page tracking
  useEffect(() => {
    if (previewRef) previewRef.current = innerRef.current;
  }, [previewRef]);

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <div style={{ height: innerHeight * scale, overflow: "hidden" }}>
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: A4_W }}>
          <ProposalPreview blocks={blocks} theme={theme} />
        </div>
      </div>
    </div>
  );
}

// ── Analytics tracking hook ───────────────────────────────────────────────────

function useProposalTracking(token, previewRef) {
  const viewIdRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const pageStatsRef = useRef({}); // { "page-0": seconds, "cover": seconds, ... }
  const pageTimersRef = useRef({}); // { pageKey: entryTimestamp }

  // Log initial view
  useEffect(() => {
    if (!token) return;
    apiClient.publicApi.logView(token).then(data => {
      if (data?.view_id) viewIdRef.current = data.view_id;
    });
  }, [token]);

  // Track per-page engagement via IntersectionObserver
  useEffect(() => {
    if (!previewRef) return;

    const observe = () => {
      const container = previewRef.current;
      if (!container) return;
      const pages = container.querySelectorAll('[data-pdf-page]');
      if (!pages.length) return;

      const observer = new IntersectionObserver(entries => {
        const now = Date.now();
        entries.forEach(entry => {
          const key = entry.target.dataset.pdfPage;
          if (entry.isIntersecting) {
            pageTimersRef.current[key] = now;
          } else if (pageTimersRef.current[key]) {
            const elapsed = (now - pageTimersRef.current[key]) / 1000;
            pageStatsRef.current[key] = (pageStatsRef.current[key] || 0) + elapsed;
            delete pageTimersRef.current[key];
          }
        });
      }, { threshold: 0.3 });

      pages.forEach(p => observer.observe(p));
      return () => observer.disconnect();
    };

    // Wait for ProposalPreview to render its pages
    const timer = setTimeout(() => {
      const cleanup = observe();
      return cleanup;
    }, 2000);

    return () => clearTimeout(timer);
  }, [previewRef]);

  // Flush on visibility change or unload
  const flush = () => {
    if (!viewIdRef.current) return;

    // Finalize any still-visible pages
    const now = Date.now();
    for (const [key, entryTime] of Object.entries(pageTimersRef.current)) {
      const elapsed = (now - entryTime) / 1000;
      pageStatsRef.current[key] = (pageStatsRef.current[key] || 0) + elapsed;
    }

    const duration = (now - startTimeRef.current) / 1000;
    apiClient.publicApi.logViewEnd(token, viewIdRef.current, duration, pageStatsRef.current);
  };

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    const onUnload = () => flush();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [token]);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PublicProposal() {
  const { token } = useParams();
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    apiClient.publicApi.getProposal(token)
      .then(setProposal)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useProposalTracking(token, previewRef);

  const handleDownloadPdf = async () => {
    if (!proposal) return;
    setDownloading(true);
    try {
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-99999px;top:0;width:794px;background:#fff;";
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(<ProposalPreview blocks={proposal.blocks} theme={proposal.theme} />);
      await new Promise(r => setTimeout(r, 1800));

      const html = container.innerHTML;
      const styles = Array.from(document.styleSheets)
        .map(sheet => { try { return Array.from(sheet.cssRules).map(r => r.cssText).join("\n"); } catch { return ""; } })
        .join("\n");

      root.unmount();
      document.body.removeChild(container);

      const blob = await apiClient.publicApi.downloadPdf(token, html, styles, proposal.title);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${proposal.title || "КП"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      alert("Ошибка загрузки PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
          <FileText className="w-7 h-7 text-gray-400" />
        </div>
        <h1 className="text-lg font-semibold text-gray-700">КП не найдено</h1>
        <p className="text-sm text-gray-400 text-center">Ссылка недействительна или была отключена</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{proposal.title}</p>
          {proposal.client_company && (
            <p className="text-xs text-gray-400">{proposal.client_company}</p>
          )}
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center gap-1.5 text-xs font-medium bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-black transition-colors disabled:opacity-60 shrink-0 ml-3"
        >
          {downloading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Download className="w-3.5 h-3.5" />
          }
          {downloading ? "Генерация..." : "Скачать PDF"}
        </button>
      </div>

      {/* Content */}
      <div className="py-4 sm:py-8">
        <div className="w-full max-w-[794px] mx-auto px-0 sm:px-4">
          <ScaledProposalPreview
            blocks={proposal.blocks || []}
            theme={proposal.theme || {}}
            previewRef={previewRef}
          />
        </div>
      </div>
    </div>
  );
}
