/**
 * Shared rarity → pastel color mapping so analytics pie and card badges match.
 */

export const RARITY_BG: Record<string, string> = {
  Common: "#A8D4E6",       // soft blue
  Uncommon: "#B8E0C8",     // pastel green
  Rare: "#F5E6A4",         // pastel yellow
  "Holo Rare": "#F8B4C4",  // pastel pink
  "Rare Holo": "#F8B4C4",  // same as Holo Rare
  "Rare Ultra": "#D4C4E8", // pastel purple (legacy)
  "Ultra Rare": "#D4C4E8", // pastel purple
  Legend: "#FFDAB9",       // pastel peach
};

const DEFAULT_BG = "#E0D4F0"; // pastel lavender
const BADGE_TEXT = "#334155";  // dark enough to read on all pastels

export function getRarityColor(rarity: string): string {
  return RARITY_BG[rarity] ?? DEFAULT_BG;
}

export function getRarityBadgeStyle(rarity: string): { backgroundColor: string; color: string } {
  return {
    backgroundColor: getRarityColor(rarity),
    color: BADGE_TEXT,
  };
}
