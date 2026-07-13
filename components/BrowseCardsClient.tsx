"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { getDisplayLabel } from "@/lib/cardFormat";
import {
  CardDetailMetadata,
  CardDetailTitle,
  type CardDetailData,
} from "@/components/CardDetailMetadata";

type CatalogCard = {
  id: string;
  name: string;
  displayName: string;
  setName: string | null;
  year: number | null;
  rarity: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  imageUrlLarge: string | null;
  imageUrlExternal?: string | null;
  description: string | null;
};

type OwnedCatalogCard = {
  catalogId: string;
  createdAt: string;
  marketPrice: number | null;
  priceUpdatedAt: string | null;
};

type Props = {
  ownedCatalogCards: OwnedCatalogCard[];
};

const PAGE_SIZE = 12;

const SUGGESTED_QUERIES = [
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

const CARD_HOVER =
  "group overflow-hidden p-0 flex flex-col h-full transition-all duration-200 ease-out hover:shadow-card-hover-cute hover:-translate-y-1 hover:scale-[1.02] hover:ring-2 hover:ring-pokemon-yellow/30";

function BrowseCardTile({
  card,
  owned,
  isAdding,
  onOpen,
  onAdd,
}: {
  card: CatalogCard;
  owned: boolean;
  isAdding: boolean;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const label = getDisplayLabel(card);
  // Prefer TCGPlayer CDN first — avoids burning PokeWallet image quota.
  const sources = [
    card.imageUrlExternal,
    card.imageUrl,
    card.imageUrlLarge,
  ].filter((src, index, arr): src is string => !!src && arr.indexOf(src) === index);

  return (
    <Card className={CARD_HOVER}>
      <div className="relative flex flex-1 flex-col">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full text-left focus:outline-none focus-ring rounded-t-card overflow-hidden shrink-0"
          aria-label={`View details for ${label}`}
        >
          <div className="relative aspect-[2.5/3.5] bg-stone-100 dark:bg-stone-900 overflow-hidden">
            {sources.length > 0 ? (
              <CatalogCardImage
                sources={sources}
                alt={label}
                className="object-cover object-top"
                priority={false}
              />
            ) : (
              <CardImagePlaceholder label={label} />
            )}
            {owned && (
              <span className="absolute top-2 right-2 rounded-full bg-pokemon-yellow text-pokemon-dark text-[10px] font-semibold px-2 py-0.5 shadow-sm">
                Owned
              </span>
            )}
          </div>
        </button>
        <div className="flex flex-1 flex-col p-3 gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="text-left focus-ring rounded-button -m-1 p-1 flex-1"
          >
            <p className="font-medium text-pokemon-dark dark:text-stone-100 text-sm line-clamp-2 leading-snug min-h-[2.5rem]">
              {label}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 mt-1 min-h-[1.25rem]">
              {card.setName ? <span className="truncate">{card.setName}</span> : null}
              {card.rarity ? <Badge variant={card.rarity}>{card.rarity}</Badge> : null}
            </div>
          </button>
          <Button
            variant={owned ? "secondary" : "primary"}
            className="w-full shrink-0 min-h-[44px] h-[44px] text-xs px-2"
            loading={isAdding}
            disabled={owned}
            onClick={onAdd}
          >
            {owned ? "In collection" : "Add to collection"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CardImagePlaceholder({ label }: { label: string }) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900 px-3 text-center gap-2">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pokemon-yellow/90 text-xl font-bold text-pokemon-dark">
        {initial}
      </span>
      <span className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2">
        {label}
      </span>
    </div>
  );
}

function CatalogCardImage({
  sources,
  alt,
  className,
  priority = false,
}: {
  sources: string[];
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const currentSrc = sources[index];

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [sources.join("|")]);

  if (failed || !currentSrc) {
    return <CardImagePlaceholder label={alt} />;
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      unoptimized
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
      className={className}
      onError={() => {
        if (index < sources.length - 1) {
          setIndex((i) => i + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

export function BrowseCardsClient({ ownedCatalogCards: initialOwned }: Props) {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cards, setCards] = useState<CatalogCard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownedByCatalogId, setOwnedByCatalogId] = useState<
    Map<string, OwnedCatalogCard>
  >(() => new Map(initialOwned.map((c) => [c.catalogId, c])));
  const [detailCard, setDetailCard] = useState<CatalogCard | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showingSuggestions = !debouncedSearch.trim();
  const ownedIds = new Set(ownedByCatalogId.keys());

  const getDetailData = (card: CatalogCard): CardDetailData => {
    const owned = ownedByCatalogId.get(card.id);
    return {
      ...card,
      createdAt: owned?.createdAt ?? null,
      marketPrice: owned?.marketPrice ?? null,
      priceUpdatedAt: owned?.priceUpdatedAt ?? null,
    };
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setCards([]);
      setHasMoreSuggestions(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCards = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(pageToLoad),
          pageSize: String(PAGE_SIZE),
        });

        const isSuggested = !debouncedSearch.trim();
        if (isSuggested) {
          params.set("suggested", "true");
        } else {
          params.set("q", debouncedSearch.trim());
        }

        const res = await fetch(`/api/catalog?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Search failed");

        const nextCards = (data.cards ?? []) as CatalogCard[];

        setCards((prev) => {
          if (!append) return nextCards;
          const seen = new Set(prev.map((c) => c.id));
          const merged = [...prev];
          for (const card of nextCards) {
            if (seen.has(card.id)) continue;
            seen.add(card.id);
            merged.push(card);
          }
          return merged;
        });

        setTotalCount(data.totalCount ?? 0);
        if (isSuggested) {
          setHasMoreSuggestions(Boolean(data.hasMore));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        if (!append) {
          setCards([]);
          setTotalCount(0);
        }
        setHasMoreSuggestions(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch]
  );

  useEffect(() => {
    const append = page > 1 && !debouncedSearch.trim();
    fetchCards(page, append);
  }, [fetchCards, page, debouncedSearch]);

  useEffect(() => {
    if (!showingSuggestions || !hasMoreSuggestions || loading || loadingMore) return;

    const node = loadMoreRef.current;
    if (!node) return;

    let armed = false;
    const armTimer = setTimeout(() => {
      armed = true;
    }, 800);

    const observer = new IntersectionObserver(
      (entries) => {
        if (!armed) return;
        if (entries[0]?.isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "80px 0px" }
    );

    observer.observe(node);
    return () => {
      clearTimeout(armTimer);
      observer.disconnect();
    };
  }, [showingSuggestions, hasMoreSuggestions, loading, loadingMore, cards.length]);

  useEffect(() => {
    if (!detailCard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailCard(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailCard]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const addToCollection = async (card: CatalogCard) => {
    if (ownedIds.has(card.id)) return;

    setAddingId(card.id);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogId: card.id,
          name: card.name,
          displayName: card.displayName,
          description: card.description,
          year: card.year,
          setName: card.setName,
          rarity: card.rarity,
          cardNumber: card.cardNumber,
          imageUrl:
            card.imageUrlExternal ??
            card.imageUrl ??
            card.imageUrlLarge,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        if (data.card?.catalogId) {
          setOwnedByCatalogId((prev) => {
            const next = new Map(prev);
            next.set(data.card.catalogId, {
              catalogId: data.card.catalogId,
              createdAt: data.card.createdAt,
              marketPrice: data.card.marketPrice ?? null,
              priceUpdatedAt: data.card.priceUpdatedAt ?? null,
            });
            return next;
          });
        }
        setSuccessMessage("Already in your collection.");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Could not add card");

      setOwnedByCatalogId((prev) => {
        const next = new Map(prev);
        next.set(card.id, {
          catalogId: card.id,
          createdAt: data.createdAt,
          marketPrice: data.marketPrice ?? null,
          priceUpdatedAt: data.priceUpdatedAt ?? null,
        });
        return next;
      });
      setSuccessMessage(`Added ${card.name} to your collection.`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add card");
    } finally {
      setAddingId(null);
    }
  };

  const inputBase =
    "w-full rounded-input border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200 focus-ring min-h-[44px] transition-colors hover:border-stone-400 dark:hover:border-stone-500";

  const initialLoading = loading && cards.length === 0;

  return (
    <div>
      <Card className="mb-6 p-4 sm:p-5">
        <label htmlFor="browse-search" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
          Search the catalog
        </label>
        <input
          id="browse-search"
          type="search"
          placeholder="Search English cards (e.g. Charizard, Pikachu)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputBase}
          autoComplete="off"
        />
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          {initialLoading
            ? "Loading…"
            : showingSuggestions
              ? "Showing English TCG cards — scroll for more, or search by name."
              : totalCount > 0
                ? `${totalCount.toLocaleString()} English card${totalCount !== 1 ? "s" : ""} found`
                : "No cards match your search."}
        </p>
        {!search.trim() && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => setSearch(query)}
                className="rounded-full border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/80 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 capitalize hover:border-pokemon-yellow hover:bg-pokemon-yellow/10 hover:text-pokemon-dark dark:hover:text-pokemon-yellow focus-ring transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </Card>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {successMessage && !error && (
        <Alert variant="success" className="mb-6" role="status">
          {successMessage}
        </Alert>
      )}

      {initialLoading && (
        <div className="flex justify-center py-12">
          <span
            className="inline-block w-8 h-8 border-2 border-pokemon-yellow border-t-transparent rounded-full animate-spin"
            aria-label="Loading cards"
          />
        </div>
      )}

      {!initialLoading && !showingSuggestions && debouncedSearch.trim() && cards.length === 0 && !error ? (
        <Card className="text-center py-16 px-6">
          <p className="font-medium text-stone-700 dark:text-stone-200 mb-2">No cards found</p>
          <p className="text-stone-600 dark:text-stone-400 text-sm max-w-sm mx-auto">
            Try a different name or set, or pick one of the suggestions above.
          </p>
        </Card>
      ) : (
        cards.length > 0 && (
          <div>
            {showingSuggestions && (
              <h2 className="font-display text-lg font-semibold text-pokemon-dark dark:text-stone-100 mb-4">
                Suggested cards
              </h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-stretch">
              {cards.map((card) => (
                <BrowseCardTile
                  key={card.id}
                  card={card}
                  owned={ownedIds.has(card.id)}
                  isAdding={addingId === card.id}
                  onOpen={() => setDetailCard(card)}
                  onAdd={() => addToCollection(card)}
                />
              ))}
            </div>
          </div>
        )
      )}

      {showingSuggestions && cards.length > 0 && (
        <div ref={loadMoreRef} className="flex justify-center py-8 min-h-[48px]">
          {loadingMore && (
            <span
              className="inline-block w-6 h-6 border-2 border-pokemon-yellow border-t-transparent rounded-full animate-spin"
              aria-label="Loading more cards"
            />
          )}
          {!loadingMore && !hasMoreSuggestions && (
            <p className="text-sm text-stone-500 dark:text-stone-400">You&apos;ve reached the end</p>
          )}
        </div>
      )}

      {totalPages > 1 && !showingSuggestions && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button
            variant="secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-stone-600 dark:text-stone-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {detailCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="browse-detail-title"
          onClick={() => setDetailCard(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-card shadow-card border border-stone-200 dark:border-stone-700 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <CardDetailTitle card={detailCard} id="browse-detail-title" />
                <button
                  type="button"
                  onClick={() => setDetailCard(null)}
                  className="shrink-0 rounded-button p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 focus-ring"
                  aria-label="Close"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
              <div className="relative w-full max-w-[240px] mx-auto aspect-[2.5/3.5] rounded-button overflow-hidden bg-stone-100 dark:bg-stone-900 mb-4">
                {([
                  detailCard.imageUrlExternal,
                  detailCard.imageUrlLarge,
                  detailCard.imageUrl,
                ].filter(Boolean) as string[]).length > 0 ? (
                  <CatalogCardImage
                    sources={[
                      detailCard.imageUrlExternal,
                      detailCard.imageUrlLarge,
                      detailCard.imageUrl,
                    ].filter((src, i, arr): src is string => !!src && arr.indexOf(src) === i)}
                    alt={getDisplayLabel(detailCard)}
                    className="object-cover object-top"
                    priority
                  />
                ) : (
                  <CardImagePlaceholder label={getDisplayLabel(detailCard)} />
                )}
              </div>
              <CardDetailMetadata
                card={getDetailData(detailCard)}
                showAdded={ownedIds.has(detailCard.id)}
              />
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  loading={addingId === detailCard.id}
                  disabled={ownedIds.has(detailCard.id)}
                  onClick={() => addToCollection(detailCard)}
                >
                  {ownedIds.has(detailCard.id) ? "In your collection" : "Add to collection"}
                </Button>
                <Button variant="secondary" onClick={() => setDetailCard(null)}>
                  Exit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
