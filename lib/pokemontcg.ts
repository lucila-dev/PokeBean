import type { CatalogCard } from "@/lib/catalogTypes";
import {
  buildCardDescription,
  extractCardName,
  formatDisplayName,
  normalizeCardFields,
  normalizeRarity,
  parseYearFromText,
} from "@/lib/cardFormat";
import { filterAndRankCatalogCards, normalizeSearchText } from "@/lib/catalogSearch";

const PTCG_BASE = "https://api.pokemontcg.io/v2";

type PokemonTcgCard = {
  id: string;
  name?: string;
  number?: string;
  rarity?: string;
  set?: { name?: string; releaseDate?: string };
  images?: { small?: string; large?: string };
  flavorText?: string;
  attacks?: { name?: string; text?: string; damage?: string }[];
  abilities?: { name?: string; text?: string }[];
};

type PokemonTcgSearchResponse = {
  data?: PokemonTcgCard[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
};

function getTcgHeaders(): HeadersInit {
  const key = process.env.POKEMON_TCG_API_KEY?.trim();
  return key
    ? { Accept: "application/json", "X-Api-Key": key }
    : { Accept: "application/json" };
}

function mapTcgCard(card: PokemonTcgCard): CatalogCard {
  const name = extractCardName(card.name?.trim() || "Unknown");
  const setName = card.set?.name?.trim() || null;
  const cardNumber = card.number?.trim() || null;
  const year =
    parseYearFromText(card.set?.releaseDate) ?? parseYearFromText(setName);
  const small = card.images?.small ?? null;
  const large = card.images?.large ?? null;

  const normalized = normalizeCardFields({
    name,
    displayName: formatDisplayName({ name, setName, cardNumber }),
    setName,
    year,
    rarity: normalizeRarity(card.rarity),
    cardNumber,
    description: buildCardDescription({
      cardText: card.flavorText,
      attacks: card.attacks?.map((a) =>
        [a.name, a.damage, a.text].filter(Boolean).join(" — ")
      ),
      abilities: card.abilities?.map((a) =>
        [a.name, a.text].filter(Boolean).join(" — ")
      ),
    }),
  });

  return {
    id: card.id,
    name: normalized.name,
    displayName: normalized.displayName ?? name,
    setName: normalized.setName ?? null,
    year: normalized.year ?? null,
    rarity: normalized.rarity ?? null,
    cardNumber: normalized.cardNumber ?? null,
    imageUrl: small,
    imageUrlLarge: large,
    imageUrlExternal: large ?? small,
    description: normalized.description ?? null,
  };
}

/** Escape Lucene special chars for pokemontcg.io name queries. */
function escapeTcgQueryTerm(term: string): string {
  return term.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, "\\$1");
}

function buildTcgNameQuery(q: string): string {
  const tokens = normalizeSearchText(q)
    .split(" ")
    .filter((t) => t.length > 1 || /^[a-z0-9]$/i.test(t));
  const terms = (tokens.length > 0 ? tokens : [normalizeSearchText(q)]).filter(Boolean);
  // AND each token against the name field — avoids fuzzy set/product junk.
  return terms.map((t) => `name:${escapeTcgQueryTerm(t)}`).join(" ");
}

export async function searchPokemonTcgCards(params: {
  q: string;
  page: number;
  pageSize: number;
}): Promise<{ cards: CatalogCard[]; page: number; pageSize: number; totalCount: number }> {
  const q = params.q.trim();
  if (!q) {
    return { cards: [], page: params.page, pageSize: params.pageSize, totalCount: 0 };
  }

  const url = new URL(`${PTCG_BASE}/cards`);
  url.searchParams.set("q", buildTcgNameQuery(q));
  url.searchParams.set("page", String(params.page));
  // Slightly over-fetch so post-filtering still fills the page.
  url.searchParams.set("pageSize", String(Math.min(50, params.pageSize + 8)));
  url.searchParams.set("orderBy", "name,set.releaseDate");

  const res = await fetch(url.toString(), {
    headers: getTcgHeaders(),
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { cards: [], page: params.page, pageSize: params.pageSize, totalCount: 0 };
    }
    if (res.status === 429) {
      throw new Error("Catalog search is rate-limited. Try again in a moment.");
    }
    throw new Error("Could not load the card catalog. Please try again.");
  }

  const json = (await res.json()) as PokemonTcgSearchResponse;
  const ranked = filterAndRankCatalogCards((json.data ?? []).map(mapTcgCard), q);
  const cards = ranked.slice(0, params.pageSize);

  return {
    cards,
    page: json.page ?? params.page,
    pageSize: params.pageSize,
    totalCount: Math.max(cards.length, json.totalCount ?? ranked.length),
  };
}

export async function fetchPokemonTcgCardById(
  id: string
): Promise<CatalogCard | null> {
  const res = await fetch(`${PTCG_BASE}/cards/${encodeURIComponent(id)}`, {
    headers: getTcgHeaders(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: PokemonTcgCard };
  if (!json.data?.id) return null;
  return mapTcgCard(json.data);
}
