import {
  buildCardDescription,
  extractCardName,
  formatDisplayName,
  normalizeCardFields,
  normalizeRarity,
  parseYearFromText,
  stripTcgPrefix,
} from "@/lib/cardFormat";
import type { CatalogCard } from "@/lib/catalogTypes";
import { filterAndRankCatalogCards } from "@/lib/catalogSearch";
import {
  fetchPokemonTcgCardById,
  searchPokemonTcgCards,
} from "@/lib/pokemontcg";

export type { CatalogCard } from "@/lib/catalogTypes";

const POKEWALLET_BASE = "https://api.pokewallet.io";

type PokewalletCardInfo = {
  name?: string;
  clean_name?: string;
  set_name?: string;
  set_code?: string;
  card_number?: string;
  rarity?: string;
  card_text?: string;
  release_date?: string;
  attacks?: string[];
  abilities?: string[];
};

type PokewalletSearchResult = {
  id: string;
  card_info?: PokewalletCardInfo;
  tcgplayer?: { url?: string | null } | null;
  images?: { languages?: string[] } | null;
};

type PokewalletSearchResponse = {
  results?: PokewalletSearchResult[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: string;
};

function getApiKey(): string | undefined {
  return process.env.POKEWALLET_API_KEY?.trim();
}

type CachedImage = {
  body: ArrayBuffer;
  contentType: string;
  expires: number;
};

const imageCache = new Map<string, CachedImage>();
const missingImages = new Map<string, number>();
const searchCache = new Map<
  string,
  {
    expires: number;
    data: { cards: CatalogCard[]; page: number; pageSize: number; totalCount: number };
  }
>();
const IMAGE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MISSING_IMAGE_TTL_MS = 60 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000;
const SEARCH_STALE_TTL_MS = 24 * 60 * 60 * 1000;
/** After a 429, pause outbound PokeWallet search/detail calls. */
let rateLimitedUntil = 0;

function getCachedSearch(key: string, allowStale: boolean) {
  const cached = searchCache.get(key);
  if (!cached) return null;
  if (cached.expires > Date.now()) return cached.data;
  if (allowStale && cached.expires + SEARCH_STALE_TTL_MS > Date.now()) {
    return cached.data;
  }
  return null;
}

function findStaleSearchForQuery(q: string, page: number) {
  const needle = `${q.toLowerCase()}|${page}|`;
  for (const [key, cached] of Array.from(searchCache.entries())) {
    if (!key.startsWith(needle)) continue;
    if (cached.expires + SEARCH_STALE_TTL_MS > Date.now()) {
      return cached.data;
    }
  }
  return null;
}

function getCachedImage(key: string): CachedImage | null {
  const cached = imageCache.get(key);
  if (!cached) return null;
  if (cached.expires <= Date.now()) {
    imageCache.delete(key);
    return null;
  }
  return cached;
}

async function fetchPokewalletImage(
  id: string,
  size: "low" | "high",
  apiKey: string
): Promise<Response> {
  const url = `${POKEWALLET_BASE}/images/${encodeURIComponent(id)}?size=${size}`;
  const headers = { "X-API-Key": apiKey };
  return fetch(url, { headers, cache: "force-cache", next: { revalidate: 86400 } });
}

function inferYear(info: PokewalletCardInfo): number | null {
  return parseYearFromText(info.release_date) ?? parseYearFromText(info.set_name);
}

export function catalogImageUrl(id: string, size: "low" | "high" = "low"): string {
  return `/api/catalog/image?id=${encodeURIComponent(id)}&size=${size}`;
}

function tcgplayerProductId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/product\/(\d+)/i);
  return match?.[1] ?? null;
}

export function tcgplayerImageUrl(
  productUrlOrId?: string | null,
  size: "low" | "high" = "low"
): string | null {
  if (!productUrlOrId) return null;
  const id = /^\d+$/.test(productUrlOrId)
    ? productUrlOrId
    : tcgplayerProductId(productUrlOrId);
  if (!id) return null;
  return size === "high"
    ? `https://product-images.tcgplayer.com/${id}.jpg`
    : `https://product-images.tcgplayer.com/fit-in/437x437/${id}.jpg`;
}

function mapPokewalletCard(
  id: string,
  info: PokewalletCardInfo,
  tcgplayerUrl?: string | null
): CatalogCard {
  const setName = info.set_name ? stripTcgPrefix(info.set_name.trim()) : null;
  const name = extractCardName(info.name?.trim() || "Unknown");
  const cardNumber = info.card_number?.trim() || null;
  const external = tcgplayerImageUrl(tcgplayerUrl, "low");

  const normalized = normalizeCardFields({
    name,
    displayName: formatDisplayName({ name, setName, cardNumber }),
    setName,
    year: inferYear(info),
    rarity: normalizeRarity(info.rarity),
    cardNumber,
    description: buildCardDescription({
      cardText: info.card_text,
      attacks: info.attacks,
      abilities: info.abilities,
    }),
  });

  return {
    id,
    name: normalized.name,
    displayName: normalized.displayName ?? name,
    setName: normalized.setName ?? null,
    year: normalized.year ?? null,
    rarity: normalized.rarity ?? null,
    cardNumber: normalized.cardNumber ?? null,
    imageUrl: catalogImageUrl(id, "low"),
    imageUrlLarge: catalogImageUrl(id, "high"),
    imageUrlExternal: external,
    description: normalized.description ?? null,
  };
}

function mapApiCard(result: PokewalletSearchResult): CatalogCard {
  return mapPokewalletCard(
    result.id,
    result.card_info ?? {},
    result.tcgplayer?.url
  );
}

const JP_SCRIPT = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;
/** JP expansions on TCGPlayer are often labeled like "XY3: Rising Fist". */
const JP_SET_CODE_LABEL = /^[A-Z]{1,4}\d+[a-z]?:\s/;

function isLikelyEnglishCatalogResult(result: PokewalletSearchResult): boolean {
  const info = result.card_info ?? {};
  const name = info.name ?? "";
  const setName = (info.set_name ?? "").trim();
  if (JP_SCRIPT.test(name) || JP_SCRIPT.test(setName)) return false;
  if (JP_SET_CODE_LABEL.test(setName)) return false;
  const langs = result.images?.languages;
  if (Array.isArray(langs) && langs.length > 0 && !langs.includes("en")) {
    return false;
  }
  return true;
}

function preferEnglishResults(
  results: PokewalletSearchResult[]
): PokewalletSearchResult[] {
  const english = results.filter(isLikelyEnglishCatalogResult);
  // Keep a few non-English only if we would otherwise return almost nothing.
  if (english.length >= Math.min(6, results.length)) return english;
  if (english.length === 0) return results;
  const extras = results.filter((r) => !isLikelyEnglishCatalogResult(r));
  return [...english, ...extras];
}

export async function fetchCatalogCardById(id: string): Promise<CatalogCard | null> {
  if (!id.startsWith("pk_")) {
    return fetchPokemonTcgCardById(id);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return fetchPokemonTcgCardById(id);
  }

  try {
    const res = await fetch(`${POKEWALLET_BASE}/cards/${encodeURIComponent(id)}`, {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = (await res.json()) as PokewalletSearchResult & { error?: string };
      if (!json.error && json.id) {
        return mapPokewalletCard(json.id, json.card_info ?? {}, json.tcgplayer?.url);
      }
    }
  } catch {
    // fall through to Pokemon TCG API
  }

  return fetchPokemonTcgCardById(id);
}

export async function searchCatalogCards(params: {
  q: string;
  page: number;
  pageSize: number;
  preferEnglish?: boolean;
  /** Prefer Pokemon TCG name search (more accurate for typed queries). */
  preferAccurateName?: boolean;
}): Promise<{ cards: CatalogCard[]; page: number; pageSize: number; totalCount: number }> {
  const q = params.q.trim();
  if (!q) {
    return {
      cards: [],
      page: params.page,
      pageSize: params.pageSize,
      totalCount: 0,
    };
  }

  const preferEnglish = params.preferEnglish === true;
  const preferAccurateName = params.preferAccurateName === true;
  const fetchSize = preferEnglish
    ? Math.min(36, params.pageSize + 12)
    : params.pageSize;

  const cacheKey = `${q.toLowerCase()}|${params.page}|${fetchSize}|en=${preferEnglish ? 1 : 0}|acc=${preferAccurateName ? 1 : 0}`;
  const cachedFresh = getCachedSearch(cacheKey, false);
  if (cachedFresh) {
    return {
      ...cachedFresh,
      pageSize: params.pageSize,
      cards: cachedFresh.cards.slice(0, params.pageSize),
    };
  }

  const usePokemonTcg = async () => {
    const tcg = await searchPokemonTcgCards({
      q,
      page: params.page,
      pageSize: params.pageSize,
    });
    searchCache.set(cacheKey, {
      data: tcg,
      expires: Date.now() + SEARCH_CACHE_TTL_MS,
    });
    return tcg;
  };

  // Typed browse search: accurate name matching first.
  if (preferAccurateName) {
    try {
      return await usePokemonTcg();
    } catch {
      // Fall through to PokeWallet, then filter by name.
    }
  }

  if (Date.now() < rateLimitedUntil) {
    const stale =
      getCachedSearch(cacheKey, true) ?? findStaleSearchForQuery(q, params.page);
    if (stale) {
      return {
        ...stale,
        pageSize: params.pageSize,
        cards: stale.cards.slice(0, params.pageSize),
      };
    }
    return usePokemonTcg();
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return usePokemonTcg();
  }

  const url = new URL(`${POKEWALLET_BASE}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("limit", String(fetchSize));

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      next: { revalidate: 1800 },
    });
  } catch {
    return usePokemonTcg();
  }

  if (!res.ok) {
    if (res.status === 404) {
      return { cards: [], page: params.page, pageSize: params.pageSize, totalCount: 0 };
    }
    if (res.status === 401) {
      throw new Error("Invalid PokeWallet API key.");
    }
    if (res.status === 429) {
      rateLimitedUntil = Date.now() + 90_000;
      const stale =
        getCachedSearch(cacheKey, true) ?? findStaleSearchForQuery(q, params.page);
      if (stale) {
        return {
          ...stale,
          pageSize: params.pageSize,
          cards: stale.cards.slice(0, params.pageSize),
        };
      }
      return usePokemonTcg();
    }
    return usePokemonTcg();
  }

  const json = (await res.json()) as PokewalletSearchResponse;
  if (json.error) {
    return usePokemonTcg();
  }

  const rawResults = json.results ?? [];
  const rankedRaw = preferEnglish ? preferEnglishResults(rawResults) : rawResults;
  const mapped = filterAndRankCatalogCards(rankedRaw.map(mapApiCard), q);
  const pagination = json.pagination;

  // If PokeWallet returned mostly unrelated fuzzy hits, use TCG instead.
  if (preferAccurateName && mapped.length === 0) {
    return usePokemonTcg();
  }

  const fullResult = {
    cards: mapped,
    page: pagination?.page ?? params.page,
    pageSize: params.pageSize,
    totalCount: pagination?.total ?? mapped.length,
  };

  searchCache.set(cacheKey, {
    data: fullResult,
    expires: Date.now() + SEARCH_CACHE_TTL_MS,
  });

  return {
    ...fullResult,
    cards: mapped.slice(0, params.pageSize),
  };
}

export async function fetchCatalogImage(
  id: string,
  size: "low" | "high"
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const cacheKey = `${id}:${size}`;
  const cached = getCachedImage(cacheKey);
  if (cached) {
    return { body: cached.body, contentType: cached.contentType };
  }

  const missingUntil = missingImages.get(cacheKey);
  if (missingUntil && missingUntil > Date.now()) return null;
  if (missingUntil) missingImages.delete(cacheKey);

  const res = await fetchPokewalletImage(id, size, apiKey);

  if (res.ok) {
    const body = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    imageCache.set(cacheKey, {
      body,
      contentType,
      expires: Date.now() + IMAGE_CACHE_TTL_MS,
    });
    return { body, contentType };
  }

  // Do not call PokeWallet /cards again for TCGPlayer fallback — that burns API
  // quota. Browse already has imageUrlExternal from search results.
  if (res.status === 404 || res.status === 403 || res.status === 429) {
    missingImages.set(cacheKey, Date.now() + MISSING_IMAGE_TTL_MS);
  }
  return null;
}

export const SUGGESTED_QUERIES = [
  "pikachu",
  "charizard",
  "eevee",
  "mewtwo",
  "umbreon",
  "mew",
  "lucario",
  "gengar",
  "snorlax",
  "rayquaza",
];

export async function getSuggestedCatalogCards(params: {
  page: number;
  pageSize: number;
}): Promise<{ cards: CatalogCard[]; hasMore: boolean }> {
  const { page, pageSize } = params;
  const queryIndex = (page - 1) % SUGGESTED_QUERIES.length;
  const queryPage = Math.floor((page - 1) / SUGGESTED_QUERIES.length) + 1;
  const q = SUGGESTED_QUERIES[queryIndex];

  const result = await searchCatalogCards({
    q,
    page: queryPage,
    pageSize,
    preferEnglish: true,
    preferAccurateName: true,
  });
  const queryTotalPages = Math.max(1, Math.ceil(result.totalCount / pageSize));
  const moreInQuery = queryPage < queryTotalPages;
  const moreQueriesAhead = queryIndex < SUGGESTED_QUERIES.length - 1;
  const canGoDeeper = queryPage < 20;

  const hasMore =
    result.cards.length > 0 &&
    (moreInQuery || moreQueriesAhead || (queryIndex === SUGGESTED_QUERIES.length - 1 && canGoDeeper));

  return { cards: result.cards, hasMore };
}
