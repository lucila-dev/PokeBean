/**
 * Shared rarity → pastel color mapping so analytics pie and card badges match.
 */

export const RARITY_BG: Record<string, string> = {
  Common: "#7EB8D4",
  Uncommon: "#7BC99A",
  Rare: "#E8C84A",
  "Holo Rare": "#E8899E",
  "Rare Holo": "#E8899E",
  "Rare Ultra": "#9B7EC8",
  "Ultra Rare": "#9B7EC8",
  "Secret Rare": "#F0A06A",
  Promo: "#5BB8A8",
  Legend: "#E8A87C",
  Unknown: "#94A3B8",
};

/** Distinct palette for charts / unknown rarities */
export const CHART_COLORS = [
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#10B981", // emerald
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6366F1", // indigo
  "#84CC16", // lime
  "#06B6D4", // cyan
  "#D946EF", // fuchsia
];

const BADGE_TEXT = "#1e293b";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getRarityColor(rarity: string): string {
  const key = rarity.trim();
  if (RARITY_BG[key]) return RARITY_BG[key];
  return CHART_COLORS[hashString(key.toLowerCase()) % CHART_COLORS.length];
}

export function getChartColor(index: number, key?: string): string {
  if (key) {
    return CHART_COLORS[hashString(key.toLowerCase()) % CHART_COLORS.length];
  }
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function getRarityBadgeStyle(rarity: string): {
  backgroundColor: string;
  color: string;
} {
  return {
    backgroundColor: getRarityColor(rarity),
    color: BADGE_TEXT,
  };
}
