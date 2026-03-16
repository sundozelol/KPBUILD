import React, { useRef, useEffect, useState } from "react";
import HeaderBlock from "./blocks/HeaderBlock";
import TextBlock from "./blocks/TextBlock";
import ProductsTableBlock from "./blocks/ProductsTableBlock";
import TermsBlock from "./blocks/TermsBlock";
import FooterBlock from "./blocks/FooterBlock";
import BannerBlock from "./blocks/BannerBlock";
import SummaryBlock from "./blocks/SummaryBlock";
import DividerBlock from "./blocks/DividerBlock";
import CoverBlock from "./blocks/CoverBlock";
import ManagerBlock from "./blocks/ManagerBlock";
import AdvantagesBlock from "./blocks/AdvantagesBlock";
import PhotoGalleryBlock from "./blocks/PhotoGalleryBlock";
import PromoBlock from "./blocks/PromoBlock";
import LogoBlock from "./blocks/LogoBlock";
import { getFontLinks } from "./themeUtils";

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

export const DEFAULT_THEME = {
  headerColor: "#2563eb",
  headerTextColor: "#ffffff",
  accentColor: "#1d4ed8",
  tableHeaderColor: "#2563eb",
  totalColor: "#1d4ed8",
  fontFamily: "'Inter', sans-serif",
  watermark: "",
  watermarkOpacity: 0.08,
  logo_url: "",
  logoHeight: 80,
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
  blockRadius: 0,
  blockShadow: "none",
  blockBorder: "none",
  blockMode: "flat",
  glassColor: "#ffffff",
  glassOpacity: 0.6,
  headerStyle: "classic",
  buttonStyle: "rounded",
  tableStyle: "classic",
};

const A4_W = 794;
const A4_H = 1123;
const MM_TO_PX = 3.78;

export default function ProposalPreview({ blocks, theme = {} }) {
  const t = { ...DEFAULT_THEME, ...theme };
  const margins = t.margins || { top: 10, right: 10, bottom: 10, left: 10 };
  const marginTop = (margins.top || 10) * MM_TO_PX;
  const marginBottom = (margins.bottom || 10) * MM_TO_PX;
  const marginLeft = (margins.left || 10) * MM_TO_PX;
  const marginRight = (margins.right || 10) * MM_TO_PX;

  const contentW = A4_W - marginLeft - marginRight;
  const contentH = A4_H - marginTop - marginBottom;

  const [pages, setPages] = useState([]);
  const measureRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const coverBlock = blocks.find(b => b.type === "cover");
  const headerBlock = blocks.find(b => b.type === "header");
  const contentBlocks = blocks.filter(b => b.type !== "cover");

  // Load Google Font
  const fontUrl = getFontLinks(t);
  useEffect(() => {
    if (!fontUrl) return;
    const id = "proposal-font-link";
    let link = document.getElementById(id);
    if (link) {
      link.href = fontUrl;
    } else {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = fontUrl;
      document.head.appendChild(link);
    }
  }, [fontUrl]);

  useEffect(() => {
    const timer = setTimeout(() => paginateBlocks(), 200);
    return () => clearTimeout(timer);
  }, [blocks, theme]);

  const paginateBlocks = () => {
    if (!measureRef.current) return;

    const container = measureRef.current;
    const blockElements = container.querySelectorAll("[data-block-id]");

    const hdrEl = container.querySelector("[data-block-type='header']");
    const hdrH = hdrEl ? hdrEl.offsetHeight : 0;
    setHeaderHeight(hdrH);

    const newPages = [];
    let currentPage = [];
    let currentHeight = 0;
    let pageIndex = 0;

    blockElements.forEach(el => {
      const blockId = el.getAttribute("data-block-id");
      const blockType = el.getAttribute("data-block-type");
      if (blockType === "cover") return;
      if (blockType === "header") {
        // Header is rendered in absolute position, just track it for pagination
        currentPage.push({ id: blockId, type: blockType, height: 0 });
        return;
      }

      const elHeight = el.offsetHeight;
      const availH = contentH - hdrH;

      if (currentHeight + elHeight > availH && currentPage.length > 0) {
        newPages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
        pageIndex++;
      }

      currentPage.push({ id: blockId, type: blockType, height: elHeight });
      currentHeight += elHeight;
    });

    if (currentPage.length > 0) {
      newPages.push(currentPage);
    }

    setPages(newPages);
  };

  const renderBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return null;
    const Component = BLOCK_COMPONENTS[block.type];
    if (!Component) return null;
    return (
      <Component
        data={block.data}
        preview={true}
        onChange={() => {}}
        theme={t}
        allBlocks={blocks}
      />
    );
  };

  const renderHeader = () => {
    if (!headerBlock) return null;
    return <HeaderBlock data={headerBlock.data} preview={true} onChange={() => {}} theme={t} />;
  };

  // Page background for glass mode - gradient from theme colors
  let pageBg = "#ffffff";
  if (t.blockMode === "glass") {
    const gc = t.glassColor || "#ffffff";
    const ac = t.accentColor || "#1d4ed8";
    const hc = t.headerColor || "#2563eb";
    pageBg = `linear-gradient(135deg, ${hc}12 0%, ${gc}40 40%, ${ac}10 100%)`;
  }

  return (
    <div style={{ fontFamily: t.fontFamily }}>
      {/* Hidden measurement container */}
      <div
        ref={measureRef}
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: contentW,
          visibility: "hidden",
          pointerEvents: "none",
          fontFamily: t.fontFamily,
        }}
      >
        {contentBlocks.map(block => {
          const Component = BLOCK_COMPONENTS[block.type];
          if (!Component) return null;
          return (
            <div key={block.id} data-block-id={block.id} data-block-type={block.type}>
              <Component
                data={block.data}
                preview={true}
                onChange={() => {}}
                theme={t}
                allBlocks={blocks}
              />
            </div>
          );
        })}
      </div>

      {/* Cover page */}
      {coverBlock && coverBlock.data.image_url && (
        <div
          className="shadow-lg mb-6 overflow-hidden relative"
          style={{ width: A4_W, height: A4_H, background: pageBg, borderRadius: (t.blockRadius || 0) + "px" }}
          data-pdf-page="cover"
        >
          <CoverBlock data={coverBlock.data} preview={true} onChange={() => {}} theme={t} />
        </div>
      )}

      {/* Content pages */}
      {pages.map((pageBlocks, pageIdx) => {
        const hasHeaderOnPage = pageBlocks.some(pb => pb.type === "header") || (pageIdx > 0 && headerBlock);
        return (
          <div
            key={pageIdx}
            className="shadow-lg mb-6 overflow-hidden relative"
            style={{ width: A4_W, height: A4_H, background: pageBg, borderRadius: (t.blockRadius || 0) + "px" }}
            data-pdf-page={`page-${pageIdx}`}
          >
            {/* Header — always rendered at absolute top:0, full width */}
            {hasHeaderOnPage && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                overflow: "hidden",
                ...(t.blockRadius > 0 && pageIdx === 0 ? {
                  borderTopLeftRadius: (t.blockRadius || 0) + "px",
                  borderTopRightRadius: (t.blockRadius || 0) + "px",
                } : {}),
              }}>
                {renderHeader()}
              </div>
            )}

            {/* Content blocks (non-header, non-footer) */}
            {(() => {
              const footerBlock = pageBlocks.find(pb => pb.type === "footer");
              const contentPageBlocks = pageBlocks.filter(pb => pb.type !== "header" && pb.type !== "footer");
              const footerHeight = footerBlock ? 80 : 0; // Approximate footer height

              return (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: hasHeaderOnPage ? headerHeight + marginTop : marginTop,
                      left: marginLeft,
                      width: contentW,
                      bottom: marginBottom + footerHeight,
                      overflow: "hidden",
                    }}
                  >
                    {contentPageBlocks.map((pb) => (
                      <div key={pb.id}>{renderBlock(pb.id)}</div>
                    ))}
                  </div>
                  {/* Footer — at bottom with border-radius */}
                  {footerBlock && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        overflow: "hidden",
                        ...(t.blockRadius > 0 ? {
                          borderBottomLeftRadius: (t.blockRadius || 0) + "px",
                          borderBottomRightRadius: (t.blockRadius || 0) + "px",
                        } : {}),
                      }}
                    >
                      {renderBlock(footerBlock.id)}
                    </div>
                  )}
                </>
              );
            })()}


          </div>
        );
      })}

      {/* Fallback */}
      {pages.length === 0 && !coverBlock && contentBlocks.length > 0 && (
        <div
          className="shadow-lg overflow-hidden"
          style={{ width: A4_W, minHeight: A4_H, background: pageBg, borderRadius: (t.blockRadius || 0) + "px" }}
          data-pdf-page="page-0"
        >
          <div style={{ padding: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px` }}>
            {contentBlocks.map(block => {
              const Component = BLOCK_COMPONENTS[block.type];
              if (!Component) return null;
              return (
                <Component
                  key={block.id}
                  data={block.data}
                  preview={true}
                  onChange={() => {}}
                  theme={t}
                  allBlocks={blocks}
                />
              );
            })}
          </div>
        </div>
      )}

      {pages.length === 0 && blocks.length === 0 && (
        <div
          className="shadow-lg overflow-hidden flex items-center justify-center"
          style={{ width: A4_W, height: A4_H, background: pageBg, borderRadius: (t.blockRadius || 0) + "px" }}
          data-pdf-page="page-0"
        >
          <p className="text-gray-300 text-lg">Добавьте блоки в КП</p>
        </div>
      )}
    </div>
  );
}