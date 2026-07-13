import type { CatalogCard } from "@/lib/catalogTypes";
import {
  extractCardName,
  formatDisplayName,
  normalizeCardFields,
  normalizeRarity,
  parseYearFromText,
} from "@/lib/cardFormat";
import { filterAndRankCatalogCards, normalizeSearchText } from "@/lib/catalogSearch";

const PTCG_BASE = "https://api.pokemontcg.io/v2";
const JP_SCRIPT = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;

type PokemonTcgCard = {
  id: string;
  name?: string;
  number?: string;
  rarity?: string;
  set?: { id?: string; name?: string; releaseDate?: string };
  images?: { small?: string; large?: string };
  flavorText?: string;
  attacks?: { name?: string; text?: string; damage?: string }[];
  abilities?: { name?: string; text?: string; type?: string }[];
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

function formatTcgDescription(card: PokemonTcgCard): string | null {
  const parts: string[] = [];

  for (const ability of card.abilities ?? []) {
    const title = [ability.type, ability.name].filter(Boolean).join(": ");
    const line = [title || "Ability", ability.text?.trim()]
      .filter(Boolean)
      .join(" — ");
    if (line) parts.push(line);
  }

  for (const attack of card.attacks ?? []) {
    const name = attack.name?.trim();
    if (!name) continue;
    const damage = attack.damage?.trim();
    const effect = attack.text?.trim();
    const head = damage ? `${name} — ${damage}` : name;
    parts.push(effect ? `${head}\n${effect}` : head);
  }

  const flavor = card.flavorText?.trim();
  if (flavor) parts.push(flavor);

  const description = parts.join("\n\n").trim();
  return description || null;
}

function isEnglishTcgCard(card: PokemonTcgCard): boolean {
  const name = card.name ?? "";
  const setName = card.set?.name ?? "";
  if (JP_SCRIPT.test(name) || JP_SCRIPT.test(setName)) return false;
  // Official EN API set ids are latin (base1, swsh3, xy3…). Skip odd locales.
  const setId = card.set?.id ?? "";
  if (setId && !/^[a-z0-9]+$/i.test(setId)) return false;
  return true;
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
    description: formatTcgDescription(card),
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
  url.searchParams.set("pageSize", String(Math.min(50, Math.max(params.pageSize, 12))));
  url.searchParams.set("orderBy", "name,set.releaseDate");
  // Select only fields we need — faster + cleaner payloads.
  url.searchParams.set(
    "select",
    "id,name,number,rarity,set,images,flavorText,attacks,abilities"
  );

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
  const english = (json.data ?? []).filter(isEnglishTcgCard).map(mapTcgCard);
  const ranked = filterAndRankCatalogCards(english, q);
  const cards = ranked.slice(0, params.pageSize);

  return {
    cards,
    page: json.page ?? params.page,
    pageSize: params.pageSize,
    totalCount: json.totalCount ?? ranked.length,
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
  if (!json.data?.id || !isEnglishTcgCard(json.data)) return null;
  return mapTcgCard(json.data);
}
