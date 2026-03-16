// Shared theme utilities for proposal blocks

export const CYRILLIC_FONTS = [
  { label: "Inter", value: "'Inter', sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" },
  { label: "Roboto", value: "'Roboto', sans-serif", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" },
  { label: "Open Sans", value: "'Open Sans', sans-serif", url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap" },
  { label: "PT Sans", value: "'PT Sans', sans-serif", url: "https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" },
  { label: "PT Serif", value: "'PT Serif', serif", url: "https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap" },
  { label: "Nunito", value: "'Nunito', sans-serif", url: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap" },
  { label: "Raleway", value: "'Raleway', sans-serif", url: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap" },
  { label: "Comfortaa", value: "'Comfortaa', cursive", url: "https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap" },
  { label: "Jost", value: "'Jost', sans-serif", url: "https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap" },
  { label: "Ubuntu", value: "'Ubuntu', sans-serif", url: "https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" },
  { label: "Golos Text", value: "'Golos Text', sans-serif", url: "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&display=swap" },
];


export const TABLE_STYLES = [
  { value: "classic", label: "Классика" },
  { value: "striped", label: "Полоски" },
  { value: "bordered", label: "С рамкой" },
  { value: "minimal", label: "Минимал" },
  { value: "cards", label: "Карточки" },
  { value: "compact", label: "Компакт" },
  { value: "modern", label: "Модерн" },
  { value: "dark", label: "Тёмная" },
  { value: "rounded", label: "Округлая" },
  { value: "flat", label: "Flat" },
];

export const BUTTON_STYLES = [
  { value: "rounded", label: "Округлые" },
  { value: "pill", label: "Пилюля" },
  { value: "square", label: "Квадрат" },
  { value: "soft", label: "Мягкие" },
];

export const BLOCK_STYLES = [
  { value: "flat", label: "Flat" },
  { value: "glass", label: "Glass" },
];

// Get block container styles based on theme settings
export function getBlockStyle(theme) {
  const radius = theme.blockRadius || 0;
  const shadow = theme.blockShadow || "none";
  const border = theme.blockBorder || "none";
  const mode = theme.blockMode || "flat";
  
  const style = {
    borderRadius: radius + "px",
  };

  // Shadow
  if (shadow === "sm") style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
  else if (shadow === "md") style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
  else if (shadow === "lg") style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";

  // Border
  if (border === "thin") style.border = "1px solid rgba(0,0,0,0.08)";
  else if (border === "medium") style.border = "1.5px solid rgba(0,0,0,0.12)";
  else if (border === "accent") style.border = `2px solid ${theme.accentColor || "#2563eb"}33`;

  // Glass mode
  if (mode === "glass") {
    const glassColor = theme.glassColor || "#ffffff";
    const glassOpacity = theme.glassOpacity ?? 0.6;
    // Convert hex to rgb
    const r = parseInt(glassColor.slice(1, 3), 16) || 255;
    const g = parseInt(glassColor.slice(3, 5), 16) || 255;
    const b = parseInt(glassColor.slice(5, 7), 16) || 255;
    style.background = `rgba(${r},${g},${b},${glassOpacity})`;
    style.backdropFilter = "blur(20px) saturate(180%)";
    style.WebkitBackdropFilter = "blur(20px) saturate(180%)";
    style.border = `1px solid rgba(${r},${g},${b},${Math.min(glassOpacity + 0.2, 1)})`;
    if (shadow === "none") style.boxShadow = `0 4px 16px rgba(0,0,0,0.06)`;
  }

  return style;
}

// Get button style based on theme
export function getButtonRadius(theme) {
  const bs = theme.buttonStyle || "rounded";
  if (bs === "pill") return "9999px";
  if (bs === "square") return "4px";
  if (bs === "soft") return "12px";
  return "8px"; // rounded
}

// Standard block padding based on theme margins (ensures all blocks align)
export function getBlockPadding(theme) {
  const margins = theme.margins || { top: 10, right: 10, bottom: 10, left: 10 };
  const left = (margins.left || 10) * 3.78;
  const right = (margins.right || 10) * 3.78;
  return {
    paddingLeft: left + "px",
    paddingRight: right + "px",
    // Raw numbers for inline math
    _left: left,
    _right: right,
  };
}

// Load Google Fonts
export function getFontLinks(theme) {
  const font = CYRILLIC_FONTS.find(f => f.value === theme.fontFamily);
  return font ? font.url : null;
}