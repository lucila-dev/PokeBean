"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getDisplayLabel, isCatalogImageUrl } from "@/lib/cardFormat";
import { CardDetailMetadata, CardDetailTitle } from "@/components/CardDetailMetadata";

const PAGE_SIZE = 12;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

type CardType = {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  year: number | null;
  setName: string | null;
  rarity: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  marketPrice: number | null;
  priceUpdatedAt: string | null;
  createdAt: string;
};

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type Props = {
  initialCards: CardType[];
  sets: string[];
  rarities: string[];
  years: number[];
};

export function DashboardClient({
  initialCards,
  sets,
  rarities,
  years,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [setFilter, setSetFilter] = useState<string>("");
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [selectionMode, setSelectionMode] = useState(false);
  const [detailCard, setDetailCard] = useState<CardType | null>(null);
  const [priceEditValue, setPriceEditValue] = useState<string>("");
  const [priceSaving, setPriceSaving] = useState(false);

  const filtered = useMemo(() => {
    return initialCards.filter((c) => {
      if (yearFilter && c.year !== parseInt(yearFilter, 10)) return false;
      if (setFilter && c.setName !== setFilter) return false;
      if (rarityFilter && c.rarity !== rarityFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const label = getDisplayLabel(c).toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        const name = c.name.toLowerCase();
        if (
          !label.includes(q) &&
          !desc.includes(q) &&
          !name.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [initialCards, yearFilter, setFilter, rarityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filtered, currentPage]
  );

  const hasActiveFilters = yearFilter || setFilter || rarityFilter;
  const allSelectedOnPage =
    paginated.length > 0 &&
    paginated.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  const clearFilters = () => {
    setYearFilter("");
    setSetFilter("");
    setRarityFilter("");
    setSearch("");
    setCurrentPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openDetail = (c: CardType) => {
    setDetailCard(c);
    setPriceEditValue(c.marketPrice != null ? String(c.marketPrice) : "");
  };

  const toggleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/cards/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      setSelectedIds(new Set());
      setCurrentPage(1);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const inputBase =
    "rounded-input border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-700 focus-ring min-h-[44px] transition-colors hover:border-stone-400";

  return (
    <div>
      {/* Toolbar: search, view, filters */}
      <Card className="mb-6 p-4 sm:p-5">
        {/* Row 1: Search + View toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex-1 min-w-0">
            <label htmlFor="dashboard-search" className="block text-sm font-medium text-stone-700 mb-1.5">
              Search
            </label>
            <input
              id="dashboard-search"
              type="search"
              placeholder="Name, set, or description…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className={`${inputBase} w-full sm:max-w-sm`}
              aria-label="Search cards"
            />
          </div>
          <div className="flex items-end gap-2 sm:flex-shrink-0">
            <span className="text-sm font-medium text-stone-600 py-2.5 sm:py-0">View</span>
            <div className="inline-flex rounded-input border border-stone-300 bg-stone-50/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-ring min-h-[40px] ${
                  viewMode === "list"
                    ? "bg-pokemon-blue text-white shadow-sm"
                    : "text-stone-600 hover:bg-white"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                aria-pressed={viewMode === "card"}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-ring min-h-[40px] ${
                  viewMode === "card"
                    ? "bg-pokemon-blue text-white shadow-sm"
                    : "text-stone-600 hover:bg-white"
                }`}
              >
                Card
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="mt-5 pt-5 border-t border-stone-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
            <div className="flex flex-wrap items-end gap-3 sm:gap-4">
              <div>
                <label htmlFor="filter-year" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Year
                </label>
                <select
                  id="filter-year"
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`${inputBase} min-w-[100px] sm:min-w-[120px]`}
                  aria-label="Filter by year"
                >
                  <option value="">All</option>
                  {[...years].sort((a, b) => a - b).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-set" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Set
                </label>
                <select
                  id="filter-set"
                  value={setFilter}
                  onChange={(e) => {
                    setSetFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`${inputBase} min-w-[140px] sm:min-w-[180px]`}
                  aria-label="Filter by set"
                >
                  <option value="">All sets</option>
                  {sets.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-rarity" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Rarity
                </label>
                <select
                  id="filter-rarity"
                  value={rarityFilter}
                  onChange={(e) => {
                    setRarityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`${inputBase} min-w-[120px] sm:min-w-[140px]`}
                  aria-label="Filter by rarity"
                >
                  <option value="">All</option>
                  {rarities.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-pokemon-blue hover:underline focus-ring rounded-button py-2 px-1 min-h-[44px] flex items-center"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Selection bar: enter selection mode + actions when selecting (grouped above content) */}
      <div
        className="mb-4 w-fit flex flex-wrap items-center gap-3 rounded-card border border-stone-200 dark:border-stone-600 bg-stone-50/50 dark:bg-stone-800/60 px-4 py-3 transition-colors"
      >
        {!selectionMode ? (
          <button
            type="button"
            onClick={() => setSelectionMode(true)}
            className="text-sm font-medium text-stone-600 hover:text-stone-800 focus-ring rounded-button py-1.5 px-2 border border-stone-300 bg-white"
          >
            Select cards
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
              className="text-sm font-medium text-stone-600 hover:text-stone-800 focus-ring rounded-button py-1.5 px-2 border border-stone-300 bg-white"
            >
              Done
            </button>
            {paginated.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllOnPage}
                className="text-sm font-medium text-stone-600 hover:text-stone-800 focus-ring rounded-button py-1.5 px-2 border border-stone-300 bg-white"
              >
                {allSelectedOnPage ? "Deselect page" : "Select all on page"}
              </button>
            )}
            {someSelected && (
              <>
                <span className="text-sm font-medium text-stone-700">
                  {selectedIds.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={deleting}
                    className="text-sm font-medium text-stone-600 hover:text-stone-800 focus-ring rounded-button py-1.5 px-2 border border-stone-300 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting…" : "Delete selected"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-sm font-medium text-stone-600 hover:text-stone-800 focus-ring rounded-button py-1.5 px-2 border border-stone-300 bg-white"
                  >
                    Clear selection
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Table (list view) */}
      <div className={viewMode === "list" ? "block" : "hidden"}>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-200 sticky top-0 z-10">
                <tr>
                  {selectionMode && (
                    <th className="px-5 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={toggleSelectAllOnPage}
                        aria-label="Select all on page"
                        className="rounded border-stone-300 focus-ring w-4 h-4"
                      />
                    </th>
                  )}
                  <th className="px-5 py-4 font-semibold text-stone-700 w-24">
                    Image
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700">
                    Name
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700 min-w-[200px]">
                    Description
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700">Set</th>
                  <th className="px-5 py-4 font-semibold text-stone-700">Year</th>
                  <th className="px-5 py-4 font-semibold text-stone-700">
                    Rarity
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700">No.</th>
                  <th className="px-5 py-4 font-semibold text-stone-700">
                    Price
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-stone-100 last:border-0 transition-colors duration-150 hover:bg-pokemon-yellow/5 ${
                      i % 2 === 1 ? "bg-stone-50/30" : ""
                    } ${selectedIds.has(c.id) ? "bg-pokemon-yellow/10" : ""}`}
                  >
                    {selectionMode && (
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          aria-label={`Select ${getDisplayLabel(c)}`}
                          className="rounded border-stone-300 focus-ring w-4 h-4"
                        />
                      </td>
                    )}
                    <td className="px-5 py-4 align-top">
                      {c.imageUrl ? (
                        <div className="relative w-16 h-20 rounded-button overflow-hidden bg-stone-100 shrink-0">
                          <Image
                            src={c.imageUrl}
                            alt={getDisplayLabel(c)}
                            fill
                            unoptimized={isCatalogImageUrl(c.imageUrl)}
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-20 rounded-button bg-stone-200 flex items-center justify-center text-stone-400 text-xs">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-pokemon-dark">
                      {getDisplayLabel(c)}
                    </td>
                    <td className="px-5 py-4 text-stone-600 text-sm max-w-xs line-clamp-3">
                      {c.description ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {c.setName ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-stone-600">{c.year ?? "—"}</td>
                    <td className="px-5 py-4">
                      {c.rarity ? (
                        <Badge variant={c.rarity}>{c.rarity}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4 text-stone-600">
                      {c.cardNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-stone-600 font-medium tabular-nums">
                      {formatPrice(c.marketPrice)}
                    </td>
                    <td className="px-5 py-4 text-stone-500 text-sm">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-stone-500">
              {filtered.length} card{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== initialCards.length && " (filtered)"}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-button px-3 py-1.5 text-sm border border-stone-300 bg-white disabled:opacity-50 focus-ring"
                >
                  Previous
                </button>
                <span className="text-sm text-stone-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-button px-3 py-1.5 text-sm border border-stone-300 bg-white disabled:opacity-50 focus-ring"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Card grid (card view): 3–4 per row, image prominent, click image for full details */}
      <div
        className={
          viewMode === "card"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            : "hidden"
        }
      >
        {viewMode === "card" &&
          paginated.map((c) => (
            <Card
              key={c.id}
              className={`group overflow-hidden p-0 flex flex-col transition-all duration-200 ease-out
                hover:shadow-card-hover-cute hover:-translate-y-1 hover:scale-[1.02]
                hover:ring-2 hover:ring-pokemon-yellow/30
                ${selectedIds.has(c.id) ? "ring-2 ring-pokemon-blue" : ""}`}
            >
              <div className="relative flex-1 flex flex-col">
                {selectionMode && (
                  <label className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-1 shadow-sm backdrop-blur-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${getDisplayLabel(c)}`}
                      className="rounded border-stone-300 focus-ring w-4 h-4"
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => openDetail(c)}
                  className="block w-full text-left focus:outline-none focus-ring rounded-t-card overflow-hidden"
                  aria-label={`View details for ${getDisplayLabel(c)}`}
                >
                  {c.imageUrl ? (
                    <div className="relative w-full aspect-[2.5/3.5] bg-stone-100 overflow-hidden">
                      <Image
                        src={c.imageUrl}
                        alt={getDisplayLabel(c)}
                        fill
                        unoptimized={isCatalogImageUrl(c.imageUrl)}
                        className="object-cover object-top"
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-stone-200 flex items-center justify-center text-stone-400 text-sm">
                      No image
                    </div>
                  )}
                </button>
                <div className="p-3 flex flex-col gap-1">
                  <p className="font-medium text-pokemon-dark text-sm line-clamp-2 leading-snug">
                    {getDisplayLabel(c)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
                    {c.setName && <span className="truncate">{c.setName}</span>}
                    {c.rarity && <Badge variant={c.rarity}>{c.rarity}</Badge>}
                  </div>
                  {c.marketPrice != null && (
                    <p className="text-sm font-semibold text-pokemon-dark mt-1 tabular-nums">
                      {formatPrice(c.marketPrice)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        {viewMode === "card" && (
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 px-1 py-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-stone-500">
              {filtered.length} card{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== initialCards.length && " (filtered)"}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-button px-3 py-1.5 text-sm border border-stone-300 bg-white disabled:opacity-50 focus-ring"
                >
                  Previous
                </button>
                <span className="text-sm text-stone-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-button px-3 py-1.5 text-sm border border-stone-300 bg-white disabled:opacity-50 focus-ring"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail modal: full description and info when image is clicked */}
      {detailCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setDetailCard(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Card details"
        >
          <div
            className="bg-white rounded-card shadow-card max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <CardDetailTitle card={detailCard} />
                <button
                  type="button"
                  onClick={() => setDetailCard(null)}
                  className="shrink-0 rounded-button p-1.5 text-stone-500 hover:bg-stone-100 focus-ring"
                  aria-label="Close"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
              {detailCard.imageUrl && (
                <div className="relative w-full max-w-[240px] mx-auto aspect-[2.5/3.5] rounded-button overflow-hidden bg-stone-100 mb-4">
                  <Image
                    src={detailCard.imageUrl}
                    alt={getDisplayLabel(detailCard)}
                    fill
                    unoptimized={isCatalogImageUrl(detailCard.imageUrl)}
                    className="object-cover object-top"
                    sizes="240px"
                  />
                </div>
              )}
              <CardDetailMetadata card={detailCard} showAdded />
              <div className="mt-4 pt-4 border-t border-stone-200">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Market price (optional)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-stone-600">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceEditValue}
                    onChange={(e) => setPriceEditValue(e.target.value)}
                    placeholder="0.00"
                    className="rounded-input border border-stone-300 bg-white px-3 py-2 w-24 text-pokemon-dark tabular-nums focus:ring-2 focus:ring-pokemon-yellow focus:border-pokemon-yellow"
                    aria-label="Market price in USD"
                  />
                  <button
                    type="button"
                    disabled={priceSaving}
                    onClick={async () => {
                      if (!detailCard) return;
                      const num =
                        priceEditValue.trim() === ""
                          ? null
                          : parseFloat(priceEditValue);
                      if (
                        num !== null &&
                        (Number.isNaN(num) || num < 0)
                      )
                        return;
                      setPriceSaving(true);
                      try {
                        const res = await fetch(`/api/cards/${detailCard.id}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            marketPrice: num,
                          }),
                        });
                        if (!res.ok) throw new Error("Failed to update");
                        const updated = await res.json();
                        setDetailCard({
                          ...detailCard,
                          marketPrice: updated.marketPrice ?? null,
                          priceUpdatedAt:
                            updated.priceUpdatedAt ?? detailCard.priceUpdatedAt,
                        });
                        setPriceEditValue(
                          updated.marketPrice != null
                            ? String(updated.marketPrice)
                            : ""
                        );
                      } finally {
                        setPriceSaving(false);
                      }
                      router.refresh();
                    }}
                    className="rounded-button px-3 py-2 text-sm font-medium bg-pokemon-yellow text-pokemon-dark hover:bg-pokemon-yellow/90 focus-ring disabled:opacity-50"
                  >
                    {priceSaving ? "Saving…" : "Save price"}
                  </button>
                </div>
                {detailCard.priceUpdatedAt && (
                  <p className="text-xs text-stone-500 mt-1">
                    Last updated{" "}
                    {formatDate(detailCard.priceUpdatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: same grid (2 cols), image on top, tap for details */}
      <div
        className={`${viewMode === "card" ? "grid grid-cols-2 gap-3" : "hidden"} md:hidden`}
      >
        {viewMode === "card" &&
          paginated.map((c) => (
            <Card
              key={c.id}
              className={`group overflow-hidden p-0 flex flex-col transition-all duration-200 ease-out
                hover:shadow-card-hover-cute active:scale-[0.98]
                ${selectedIds.has(c.id) ? "ring-2 ring-pokemon-blue" : ""}`}
            >
              <div className="relative flex flex-col">
                {selectionMode && (
                  <label className="absolute top-1.5 left-1.5 z-10 flex items-center rounded-full bg-white/95 px-1 py-0.5 shadow backdrop-blur-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${getDisplayLabel(c)}`}
                      className="rounded border-stone-300 w-3.5 h-3.5"
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => openDetail(c)}
                  className="block w-full text-left focus:outline-none rounded-t-card overflow-hidden"
                  aria-label={`View details for ${getDisplayLabel(c)}`}
                >
                  {c.imageUrl ? (
                    <div className="relative w-full aspect-[2.5/3.5] bg-stone-100 overflow-hidden">
                      <Image
                        src={c.imageUrl}
                        alt={getDisplayLabel(c)}
                        fill
                        unoptimized={isCatalogImageUrl(c.imageUrl)}
                        className="object-cover object-top"
                        sizes="50vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[2.5/3.5] bg-stone-200 flex items-center justify-center text-stone-400 text-xs">
                      No image
                    </div>
                  )}
                </button>
                <div className="p-2">
                  <p className="font-medium text-pokemon-dark text-xs line-clamp-2 leading-tight">
                    {getDisplayLabel(c)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {c.rarity && (
                      <Badge variant={c.rarity}>{c.rarity}</Badge>
                    )}
                  </div>
                  {c.marketPrice != null && (
                    <p className="text-xs font-semibold text-pokemon-dark mt-1 tabular-nums">
                      {formatPrice(c.marketPrice)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        {viewMode === "card" && (
          <div className="col-span-2 flex flex-col items-center gap-2 py-3">
            <span className="text-sm text-stone-500">
              {filtered.length} card{filtered.length !== 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-button px-3 py-1.5 text-sm border border-stone-300 bg-white disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-stone-600">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-button px-3 py-1.5 text-sm border border-stone-300 bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
