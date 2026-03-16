import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
  ShadingType, TableLayoutType, VerticalAlign, Header, Footer,
  PageBreak, ImageRun, convertInchesToTwip, UnderlineType
} from "docx";

const pt = (n) => n * 2; // half-points for docx font sizes
const colorHex = (hex) => (hex || "#2563eb").replace("#", "");
const ACCENT = (theme) => colorHex(theme?.accentColor || "#2563eb");
const HEADER_COLOR = (theme) => colorHex(theme?.headerColor || "#1f2937");

// ── helpers ────────────────────────────────────────────────────────────────

function emptyLine(size = 12) {
  return new Paragraph({ children: [new TextRun({ text: "", size: pt(size) })] });
}

function sectionHeading(text, theme) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: pt(16),
        color: HEADER_COLOR(theme),
      }),
    ],
    spacing: { before: 280, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT(theme) },
    },
  });
}

function plainParagraph(text, opts = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text || "",
        size: pt(opts.size || 11),
        bold: opts.bold || false,
        color: colorHex(opts.color || "#374151"),
      }),
    ],
    spacing: { after: opts.after || 80 },
    alignment: opts.align || AlignmentType.LEFT,
  });
}

// ── block renderers ────────────────────────────────────────────────────────

function renderCover(data, theme) {
  const paragraphs = [];
  paragraphs.push(emptyLine(24));
  if (data.title) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.title, bold: true, size: pt(28), color: HEADER_COLOR(theme) })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  }
  if (data.subtitle) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.subtitle, size: pt(14), color: "6b7280" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }));
  }
  if (data.date) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.date, size: pt(11), color: "9ca3af" })],
      alignment: AlignmentType.CENTER,
    }));
  }
  paragraphs.push(emptyLine(24));
  return paragraphs;
}

function renderHeader(data, theme) {
  const paragraphs = [];
  if (data.company_name) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.company_name, bold: true, size: pt(18), color: ACCENT(theme) })],
      spacing: { after: 100 },
    }));
  }
  if (data.title) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.title, bold: true, size: pt(22), color: HEADER_COLOR(theme) })],
      spacing: { after: 80 },
    }));
  }
  if (data.subtitle) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: data.subtitle, size: pt(12), color: "6b7280" })],
      spacing: { after: 80 },
    }));
  }
  if (data.client_company || data.client_name) {
    paragraphs.push(emptyLine(6));
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: "Для: ", bold: true, size: pt(11), color: "374151" }),
        new TextRun({ text: [data.client_company, data.client_name].filter(Boolean).join(", "), size: pt(11), color: "374151" }),
      ],
      spacing: { after: 60 },
    }));
  }
  paragraphs.push(emptyLine(8));
  return paragraphs;
}

function renderText(data, theme) {
  const paragraphs = [];
  if (data.heading) paragraphs.push(sectionHeading(data.heading, theme));
  if (data.text) {
    const lines = data.text.split("\n");
    lines.forEach(line => {
      paragraphs.push(plainParagraph(line, { size: 11 }));
    });
  }
  paragraphs.push(emptyLine(6));
  return paragraphs;
}

function renderProductsTable(data, theme) {
  const paragraphs = [];
  paragraphs.push(sectionHeading(data.heading || "Состав предложения", theme));

  const items = data.items || [];
  const priceType = data.priceType || 1;
  const showSku = data.showSku !== false;
  const showQty = data.showQty !== false;
  const showUnit = data.showUnit !== false;
  const showTotal = data.showTotal !== false;

  const getPrice = (item) => {
    if (item._priceOverridden) return item.price || 0;
    if (priceType === 2 && item.price2 != null) return item.price2;
    if (priceType === 3 && item.price3 != null) return item.price3;
    return item.price || 0;
  };

  const accentBg = ACCENT(theme);

  // Header row
  const headerCells = [];
  const addHeaderCell = (text, width) => headerCells.push(
    new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: pt(10), color: "ffffff" })],
        alignment: AlignmentType.CENTER,
      })],
      shading: { fill: accentBg, type: ShadingType.SOLID },
      width: { size: width, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
    })
  );

  addHeaderCell("№", 5);
  addHeaderCell("Наименование", showSku && showQty && showUnit && showTotal ? 40 : 55);
  if (showSku) addHeaderCell("Артикул", 10);
  if (showQty) addHeaderCell("Кол-во", 8);
  if (showUnit) addHeaderCell("Ед.", 7);
  addHeaderCell("Цена", 12);
  if (showTotal) addHeaderCell("Сумма", 13);

  const tableRows = [new TableRow({ children: headerCells, tableHeader: true })];

  items.forEach((item, i) => {
    const price = getPrice(item);
    const total = price * (item.qty || 1);
    const isEven = i % 2 === 0;
    const rowBg = isEven ? "ffffff" : "f9fafb";

    const makeCell = (text, align = AlignmentType.LEFT, bold = false) =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: String(text ?? ""), size: pt(10), bold, color: "374151" })],
          alignment: align,
        })],
        shading: { fill: rowBg, type: ShadingType.SOLID },
        verticalAlign: VerticalAlign.CENTER,
      });

    const cells = [];
    cells.push(makeCell(String(i + 1), AlignmentType.CENTER));
    cells.push(makeCell(item.name || ""));
    if (showSku) cells.push(makeCell(item.sku || "", AlignmentType.CENTER));
    if (showQty) cells.push(makeCell(String(item.qty || 1), AlignmentType.CENTER));
    if (showUnit) cells.push(makeCell(item.unit || "шт.", AlignmentType.CENTER));
    cells.push(makeCell(price.toLocaleString("ru-RU") + " ₽", AlignmentType.RIGHT));
    if (showTotal) cells.push(makeCell(total.toLocaleString("ru-RU") + " ₽", AlignmentType.RIGHT, true));

    tableRows.push(new TableRow({ children: cells }));
  });

  paragraphs.push(new Table({
    rows: tableRows,
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "e5e7eb" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "e5e7eb" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
      insideV: { style: BorderStyle.NONE },
    },
  }));

  paragraphs.push(emptyLine(8));
  return paragraphs;
}

function renderSummary(data, theme, allBlocks) {
  const paragraphs = [];
  paragraphs.push(sectionHeading(data.heading || "Итоговая стоимость", theme));

  const subtotal = (allBlocks || [])
    .filter(b => b.type === "products_table")
    .reduce((sum, b) => sum + (b.data.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0), 0);

  const discount = data.discount || 0;
  const discountAmt = Math.round(subtotal * discount / 100);
  const total = subtotal - discountAmt;

  if (discount > 0) {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: "Сумма: ", size: pt(11), color: "6b7280" }),
        new TextRun({ text: subtotal.toLocaleString("ru-RU") + " ₽", size: pt(11), color: "374151" }),
      ],
      spacing: { after: 60 },
    }));
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `Скидка ${discount}%: `, size: pt(11), color: "6b7280" }),
        new TextRun({ text: "-" + discountAmt.toLocaleString("ru-RU") + " ₽", size: pt(11), color: "dc2626" }),
      ],
      spacing: { after: 60 },
    }));
  }

  paragraphs.push(new Paragraph({
    children: [
      new TextRun({ text: "ИТОГО: ", bold: true, size: pt(16), color: ACCENT(theme) }),
      new TextRun({ text: total.toLocaleString("ru-RU") + " ₽", bold: true, size: pt(18), color: ACCENT(theme) }),
    ],
    spacing: { after: 80 },
  }));

  if (data.note) {
    paragraphs.push(plainParagraph(data.note, { size: 10, color: "#6b7280" }));
  }

  paragraphs.push(emptyLine(8));
  return paragraphs;
}

function renderTerms(data, theme) {
  const paragraphs = [];
  paragraphs.push(sectionHeading(data.heading || "Условия предложения", theme));
  (data.terms || []).forEach(term => {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({ text: (term.label || "") + ": ", bold: true, size: pt(11), color: HEADER_COLOR(theme) }),
        new TextRun({ text: term.value || "", size: pt(11), color: "374151" }),
      ],
      spacing: { after: 80 },
    }));
  });
  paragraphs.push(emptyLine(6));
  return paragraphs;
}

function renderAdvantages(data, theme) {
  const paragraphs = [];
  paragraphs.push(sectionHeading(data.heading || "Наши преимущества", theme));
  (data.items || []).forEach(item => {
    paragraphs.push(new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun({ text: (item.title || "") + (item.description ? " — " + item.description : ""), size: pt(11), color: "374151" }),
      ],
      spacing: { after: 60 },
    }));
  });
  paragraphs.push(emptyLine(6));
  return paragraphs;
}

function renderManager(data, theme) {
  const paragraphs = [];
  paragraphs.push(sectionHeading(data.block_title || "Ваш менеджер", theme));
  if (data.name) paragraphs.push(plainParagraph(data.name, { bold: true, size: 13 }));
  if (data.phone) paragraphs.push(plainParagraph("📞 " + data.phone, { size: 11 }));
  if (data.email) paragraphs.push(plainParagraph("✉ " + data.email, { size: 11 }));
  if (data.telegram) paragraphs.push(plainParagraph("Telegram: " + data.telegram, { size: 11 }));
  paragraphs.push(emptyLine(6));
  return paragraphs;
}

function renderFooter(data, theme) {
  const parts = [data.company_name, data.phone, data.email, data.website].filter(Boolean);
  const paragraphs = [];
  if (parts.length) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: parts.join("  |  "), size: pt(9), color: "9ca3af" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }));
  }
  if (data.note) {
    paragraphs.push(plainParagraph(data.note, { size: 10, color: "#6b7280", align: AlignmentType.CENTER }));
  }
  return paragraphs;
}

function renderLogo(data, theme) {
  const paragraphs = [];
  paragraphs.push(sectionHeading(data.heading || "Наши бренды", theme));
  (data.items || []).forEach(item => {
    if (item.title) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: item.title, bold: true, size: pt(11), color: HEADER_COLOR(theme) })],
        spacing: { after: item.description ? 40 : 80 },
      }));
    }
    if (item.description) {
      paragraphs.push(plainParagraph(item.description, { size: 10, color: "#6b7280" }));
    }
  });
  paragraphs.push(emptyLine(6));
  return paragraphs;
}

// ── main export function ───────────────────────────────────────────────────

export async function exportProposalToWord({ blocks, theme, title, clientName, clientCompany }) {
  const children = [];

  for (const block of blocks) {
    switch (block.type) {
      case "cover":        children.push(...renderCover(block.data, theme)); break;
      case "header":       children.push(...renderHeader(block.data, theme)); break;
      case "text":         children.push(...renderText(block.data, theme)); break;
      case "products_table": children.push(...renderProductsTable(block.data, theme)); break;
      case "summary":      children.push(...renderSummary(block.data, theme, blocks)); break;
      case "terms":        children.push(...renderTerms(block.data, theme)); break;
      case "advantages":   children.push(...renderAdvantages(block.data, theme)); break;
      case "manager":      children.push(...renderManager(block.data, theme)); break;
      case "footer":       children.push(...renderFooter(block.data, theme)); break;
      case "logo":         children.push(...renderLogo(block.data, theme)); break;
      case "divider":      children.push(emptyLine(8)); break;
      default: break;
    }
  }

  const doc = new Document({
    creator: "КП Генератор",
    title: title || "Коммерческое предложение",
    description: clientCompany || "",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: pt(11), color: "374151" },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "КП"}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}