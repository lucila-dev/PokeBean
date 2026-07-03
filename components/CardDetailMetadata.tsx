import { Badge } from "@/components/ui/Badge";
import { getDisplayLabel, type CardFields } from "@/lib/cardFormat";

export type CardDetailData = CardFields & {
  createdAt?: string | null;
  marketPrice?: number | null;
  priceUpdatedAt?: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type Props = {
  card: CardDetailData;
  showAdded?: boolean;
};

export function CardDetailMetadata({ card, showAdded = false }: Props) {
  const description = card.description?.trim();

  return (
    <>
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1">
          Description
        </h3>
        {description ? (
          <p className="text-stone-700 dark:text-stone-300 text-sm whitespace-pre-wrap leading-relaxed">
            {description}
          </p>
        ) : (
          <p className="text-stone-500 dark:text-stone-400 text-sm">—</p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-stone-500 dark:text-stone-400">Set</dt>
        <dd className="text-stone-800 dark:text-stone-200">{card.setName ?? "—"}</dd>

        <dt className="text-stone-500 dark:text-stone-400">Year</dt>
        <dd className="text-stone-800 dark:text-stone-200">
          {card.year != null ? card.year : "—"}
        </dd>

        <dt className="text-stone-500 dark:text-stone-400">Rarity</dt>
        <dd>
          {card.rarity ? (
            <Badge variant={card.rarity}>{card.rarity}</Badge>
          ) : (
            <span className="text-stone-800 dark:text-stone-200">—</span>
          )}
        </dd>

        <dt className="text-stone-500 dark:text-stone-400">Number</dt>
        <dd className="text-stone-800 dark:text-stone-200">{card.cardNumber ?? "—"}</dd>

        {showAdded && (
          <>
            <dt className="text-stone-500 dark:text-stone-400">Added</dt>
            <dd className="text-stone-800 dark:text-stone-200">
              {card.createdAt ? formatDate(card.createdAt) : "—"}
            </dd>
          </>
        )}

        {card.marketPrice != null && (
          <>
            <dt className="text-stone-500 dark:text-stone-400">Price</dt>
            <dd className="text-stone-800 dark:text-stone-200 font-semibold tabular-nums">
              {formatPrice(card.marketPrice)}
            </dd>
          </>
        )}
      </dl>
    </>
  );
}

export function CardDetailTitle({
  card,
  id,
}: {
  card: CardFields;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="font-display font-semibold text-lg text-pokemon-dark dark:text-stone-100 pr-8"
    >
      {getDisplayLabel(card)}
    </h2>
  );
}
