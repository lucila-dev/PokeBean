"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SafeImage } from "@/components/SafeImage";
import { getDisplayLabel } from "@/lib/cardFormat";
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
    "rounded-input border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-700 dark:text-stone-200 focus-ring min-h-[44px] transition-colors hover:border-stone-400 dark:hover:border-stone-500";
  const toolbarBtn =
    "text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 focus-ring rounded-button py-1.5 px-2 border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900";
  const pageBtn =
    "rounded-button px-3 py-1.5 text-sm border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 disabled:opacity-50 focus-ring";

  return (
    <div>
      {/* Compact tools — one block, not a separate “select section” */}
      <Card className="mb-4 p-3 sm:p-5">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="dashboard-search" className="sr-only">
              Search
            </label>
            <input
              id="dashboard-search"
              type="search"
              placeholder="Search collection…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className={`${inputBase} w-full`}
              aria-label="Search cards"
            />
          </div>
          <div className="inline-flex h-10 items-center rounded-input border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              className={`rounded-lg px-3 h-full text-sm font-medium transition-colors focus-ring ${
                viewMode === "list"
                  ? "bg-pokemon-blue text-white shadow-sm"
                  : "text-stone-600 dark:text-stone-300"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              aria-pressed={viewMode === "card"}
              className={`rounded-lg px-3 h-full text-sm font-medium transition-colors focus-ring ${
                viewMode === "card"
                  ? "bg-pokemon-blue text-white shadow-sm"
                  : "text-stone-600 dark:text-stone-300"
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm font-medium text-stone-600 dark:text-stone-300 list-none flex items-center gap-1 focus-ring rounded-button py-1">
            Filters
            {hasActiveFilters ? (
              <span className="text-pokemon-blue">· on</span>
            ) : null}
          </summary>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="filter-year" className="block text-xs text-stone-500 mb-1">
                Year
              </label>
              <select
                id="filter-year"
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputBase} min-w-[100px]`}
              >
                <option value="">All</option>
                {[...years].sort((a, b) => a - b).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-set" className="block text-xs text-stone-500 mb-1">
                Set
              </label>
              <select
                id="filter-set"
                value={setFilter}
                onChange={(e) => {
                  setSetFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputBase} min-w-[140px]`}
              >
                <option value="">All sets</option>
                {sets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-rarity" className="block text-xs text-stone-500 mb-1">
                Rarity
              </label>
              <select
                id="filter-rarity"
                value={rarityFilter}
                onChange={(e) => {
                  setRarityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputBase} min-w-[120px]`}
              >
                <option value="">All</option>
                {rarities.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-pokemon-blue hover:underline py-2"
              >
                Clear
              </button>
            )}
          </div>
        </details>
      </Card>

      {/* Single collection block: count + select live with the grid */}
      <section aria-label="Collection">
        <div className="mb-3 flex items-center justify-between gap-2 min-h-[40px]">
          <p className="text-sm font-semibold text-pokemon-dark dark:text-stone-100 tabular-nums">
            {filtered.length} card{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== initialCards.length
              ? ` of ${initialCards.length}`
              : ""}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!selectionMode ? (
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                className="text-sm font-medium text-pokemon-blue hover:underline focus-ring rounded-button px-1 py-1"
              >
                Select
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleSelectAllOnPage}
                  className="text-sm font-medium text-stone-600 dark:text-stone-300 hover:underline px-1 py-1"
                >
                  {allSelectedOnPage ? "Deselect all" : "Select all"}
                </button>
                {someSelected && (
                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={deleting}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50 px-1 py-1"
                  >
                    {deleting ? "Deleting…" : `Delete (${selectedIds.size})`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="text-sm font-medium text-stone-700 dark:text-stone-200 hover:underline px-1 py-1"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>

      {/* Table (list view) */}
      <div className={viewMode === "list" ? "block" : "hidden"}>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-10">
                <tr>
                  {selectionMode && (
                    <th className="px-5 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={toggleSelectAllOnPage}
                        aria-label="Select all on page"
                        className="rounded border-stone-300 dark:border-stone-600 focus-ring w-4 h-4"
                      />
                    </th>
                  )}
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200 w-24">
                    Image
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">
                    Name
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200 min-w-[200px]">
                    Description
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">Set</th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">Year</th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">
                    Rarity
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">No.</th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">
                    Price
                  </th>
                  <th className="px-5 py-4 font-semibold text-stone-700 dark:text-stone-200">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-stone-100 dark:border-stone-800 last:border-0 transition-colors duration-150 hover:bg-pokemon-yellow/5 ${
                      i % 2 === 1 ? "bg-stone-50/30 dark:bg-stone-950/40" : ""
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
                      <div className="relative w-16 h-20 rounded-button overflow-hidden bg-stone-100 shrink-0">
                        <SafeImage
                          src={c.imageUrl}
                          alt={getDisplayLabel(c)}
                          fill
                          className="object-cover"
                          sizes="64px"
                          placeholderText="No img"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-pokemon-dark dark:text-stone-100">
                      {getDisplayLabel(c)}
                    </td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300 text-sm max-w-xs line-clamp-3">
                      {c.description ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300">
                      {c.setName ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300">{c.year ?? "—"}</td>
                    <td className="px-5 py-4">
                      {c.rarity ? (
                        <Badge variant={c.rarity}>{c.rarity}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300">
                      {c.cardNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-stone-600 dark:text-stone-300 font-medium tabular-nums">
                      {formatPrice(c.marketPrice)}
                    </td>
                    <td className="px-5 py-4 text-stone-500 dark:text-stone-400 text-sm">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-stone-50 dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {filtered.length} card{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== initialCards.length && " (filtered)"}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={pageBtn}
                >
                  Previous
                </button>
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={pageBtn}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Card grid: 2 cols on phone, more on larger screens */}
      <div
        className={
          viewMode === "card"
            ? "collection-card-grid !grid !grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4"
            : "hidden"
        }
      >
        {viewMode === "card" &&
          paginated.map((c) => (
            <Card
              key={c.id}
              className={`group overflow-hidden p-0 flex flex-col transition-all duration-200 ease-out
                hover:shadow-card-hover-cute hover:-translate-y-1 hover:scale-[1.02]
                hover:ring-2 hover:ring-pokemon-yellow/30 active:scale-[0.98]
                ${selectedIds.has(c.id) ? "ring-2 ring-pokemon-blue" : ""}`}
            >
              <div className="relative flex-1 flex flex-col">
                {selectionMode && (
                  <label className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-white/95 dark:bg-stone-900/95 px-1.5 py-1 shadow-sm backdrop-blur-sm">
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
                  <div className="relative w-full aspect-[2.5/3.5] bg-stone-100 dark:bg-stone-900 overflow-hidden">
                    <SafeImage
                      src={c.imageUrl}
                      alt={getDisplayLabel(c)}
                      fill
                      className="object-cover object-top"
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    />
                  </div>
                </button>
                <div className="p-2 sm:p-3 flex flex-col gap-1">
                  <p className="font-medium text-pokemon-dark dark:text-stone-100 text-xs sm:text-sm line-clamp-2 leading-snug">
                    {getDisplayLabel(c)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                    {c.setName && (
                      <span className="truncate hidden sm:inline">{c.setName}</span>
                    )}
                    {c.rarity && <Badge variant={c.rarity}>{c.rarity}</Badge>}
                  </div>
                  {c.marketPrice != null && (
                    <p className="text-sm font-semibold text-pokemon-dark dark:text-stone-100 mt-1 tabular-nums">
                      {formatPrice(c.marketPrice)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        {viewMode === "card" && (
          <div className="col-span-2 md:col-span-3 lg:col-span-4 px-1 py-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              Showing {paginated.length} of {filtered.length} card
              {filtered.length !== 1 ? "s" : ""}
              {filtered.length !== initialCards.length && " (filtered)"}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={pageBtn}
                >
                  Previous
                </button>
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={pageBtn}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      </section>

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
            className="bg-white dark:bg-stone-900 rounded-card shadow-card border border-stone-200 dark:border-stone-700 max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
              <div className="relative w-full max-w-[240px] mx-auto aspect-[2.5/3.5] rounded-button overflow-hidden bg-stone-100 mb-4">
                <SafeImage
                  src={detailCard.imageUrl}
                  alt={getDisplayLabel(detailCard)}
                  fill
                  className="object-cover object-top"
                  sizes="240px"
                />
              </div>
              <CardDetailMetadata card={detailCard} showAdded />
              <div className="mt-4 pt-4 border-t border-stone-200">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Market price (optional)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-stone-600 dark:text-stone-300">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceEditValue}
                    onChange={(e) => setPriceEditValue(e.target.value)}
                    placeholder="0.00"
                    className="rounded-input border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 px-3 py-2 w-24 text-pokemon-dark dark:text-stone-100 tabular-nums focus:ring-2 focus:ring-pokemon-yellow focus:border-pokemon-yellow"
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
    </div>
  );
}
