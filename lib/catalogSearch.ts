import type { CatalogCard } from "@/lib/catalogTypes";

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every search token must appear in the card's name (not set or description). */
export function cardNameMatchesQuery(card: CatalogCard, q: string): boolean {
  const name = normalizeSearchText(card.name);
  const tokens = normalizeSearchText(q).split(" ").filter(Boolean);
  if (!name || tokens.length === 0) return false;
  return tokens.every((token) => name.includes(token));
}

export function rankCardNameMatch(card: CatalogCard, q: string): number {
  const name = normalizeSearchText(card.name);
  const query = normalizeSearchText(q);
  if (!name || !query) return 99;
  if (name === query) return 0;
  if (name.startsWith(query + " ") || name.startsWith(query)) return 1;
  if (name.includes(" " + query) || name.includes(query)) return 2;
  return 3;
}

export function filterAndRankCatalogCards(
  cards: CatalogCard[],
  q: string
): CatalogCard[] {
  return cards
    .filter((card) => cardNameMatchesQuery(card, q))
    .sort((a, b) => {
      const rankDiff = rankCardNameMatch(a, q) - rankCardNameMatch(b, q);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name);
    });
}
