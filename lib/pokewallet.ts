import {
  buildCardDescription,
  extractCardName,
  formatDisplayName,
  normalizeCardFields,
  normalizeRarity,
  parseYearFromText,
  stripTcgPrefix,
} from "@/lib/cardFormat";

const POKEWALLET_BASE = "https://api.pokewallet.io";

export type CatalogCard = {
  id: string;
  name: string;
  displayName: string;
  setName: string | null;
  year: number | null;
  rarity: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  imageUrlLarge: string | null;
  /** Direct CDN fallback when PokeWallet has no image (e.g. some JP sets). */
  imageUrlExternal: string | null;
  description: string | null;
};

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
  return (
    process.env.POKEWALLET_API_KEY?.trim() ||
    process.env.POKEMON_TCG_API_KEY?.trim()
  );
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
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

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
  let res = await fetch(url, { headers, cache: "no-store" });

  for (let attempt = 0; attempt < 2 && res.status === 403; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    res = await fetch(url, { headers, cache: "no-store" });
  }

  return res;
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
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const res = await fetch(`${POKEWALLET_BASE}/cards/${encodeURIComponent(id)}`, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;

  const json = (await res.json()) as PokewalletSearchResult & { error?: string };
  if (json.error || !json.id) return null;

  return mapPokewalletCard(json.id, json.card_info ?? {}, json.tcgplayer?.url);
}

export async function searchCatalogCards(params: {
  q: string;
  page: number;
  pageSize: number;
  preferEnglish?: boolean;
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

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("PokeWallet API key is not configured.");
  }

  const preferEnglish = params.preferEnglish === true;
  const fetchSize = preferEnglish
    ? Math.min(48, Math.max(params.pageSize * 3, params.pageSize))
    : params.pageSize;

  const cacheKey = `${q.toLowerCase()}|${params.page}|${fetchSize}|en=${preferEnglish ? 1 : 0}`;
  const cachedSearch = searchCache.get(cacheKey);
  if (cachedSearch && cachedSearch.expires > Date.now()) {
    return {
      ...cachedSearch.data,
      pageSize: params.pageSize,
      cards: cachedSearch.data.cards.slice(0, params.pageSize),
    };
  }

  const url = new URL(`${POKEWALLET_BASE}/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("limit", String(fetchSize));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { cards: [], page: params.page, pageSize: params.pageSize, totalCount: 0 };
    }
    if (res.status === 401) {
      throw new Error("Invalid PokeWallet API key.");
    }
    if (res.status === 429) {
      throw new Error("Catalog search is rate-limited. Try again in a moment.");
    }
    throw new Error("Could not load the card catalog. Please try again.");
  }

  const json = (await res.json()) as PokewalletSearchResponse;
  if (json.error) {
    throw new Error(json.error);
  }

  const rawResults = json.results ?? [];
  const ranked = preferEnglish ? preferEnglishResults(rawResults) : rawResults;
  const cards = ranked.map(mapApiCard).slice(0, params.pageSize);
  const pagination = json.pagination;

  const result = {
    cards,
    page: pagination?.page ?? params.page,
    pageSize: params.pageSize,
    totalCount: pagination?.total ?? cards.length,
  };

  searchCache.set(cacheKey, {
    data: {
      ...result,
      cards: ranked.map(mapApiCard),
    },
    expires: Date.now() + SEARCH_CACHE_TTL_MS,
  });

  return result;
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

  // PokeWallet often 404s for JP / older listings even when search says images exist.
  const fallback = await fetchTcgplayerFallbackImage(id, size, apiKey);
  if (fallback) {
    imageCache.set(cacheKey, {
      body: fallback.body,
      contentType: fallback.contentType,
      expires: Date.now() + IMAGE_CACHE_TTL_MS,
    });
    return fallback;
  }

  if (res.status === 404 || res.status === 403) {
    missingImages.set(cacheKey, Date.now() + MISSING_IMAGE_TTL_MS);
  }
  return null;
}

async function fetchTcgplayerFallbackImage(
  id: string,
  size: "low" | "high",
  apiKey: string
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  try {
    const cardRes = await fetch(`${POKEWALLET_BASE}/cards/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json", "X-API-Key": apiKey },
      cache: "no-store",
    });
    if (!cardRes.ok) return null;
    const json = (await cardRes.json()) as PokewalletSearchResult;
    const url = tcgplayerImageUrl(json.tcgplayer?.url, size);
    if (!url) return null;

    const imgRes = await fetch(url, { cache: "force-cache" });
    if (!imgRes.ok) return null;

    return {
      body: await imgRes.arrayBuffer(),
      contentType: imgRes.headers.get("content-type") ?? "image/jpeg",
    };
  } catch {
    return null;
  }
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
